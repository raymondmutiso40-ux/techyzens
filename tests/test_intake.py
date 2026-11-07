import io

import docx
import pytest
from httpx import AsyncClient

from app.api.v1 import intake

TOR_TEXT = (
    "Terms of Reference: Consultancy for a National Health Data Portal.\n"
    "Donor: World Bank. Deadline: 2026-12-20. Budget: USD 400,000. Country: Kenya.\n"
    "Required expertise: data engineering, interoperability, public sector governance.\n"
    "Evaluation criteria: Technical methodology 50%, Key personnel 30%, Past performance 20%.\n"
)


@pytest.fixture(autouse=True)
def _tmp_documents_dir(tmp_path, monkeypatch):
    """Keep uploaded test files out of the real storage folder."""
    monkeypatch.setattr(intake.settings, "DOCUMENTS_DIR", tmp_path)


def _docx_bytes(text: str) -> bytes:
    d = docx.Document()
    for line in text.splitlines():
        d.add_paragraph(line)
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_tor_file_upload_creates_scored_tender(client: AsyncClient):
    files = {"file": ("WB_Health_Data_Portal_TOR.docx", _docx_bytes(TOR_TEXT),
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res = await client.post("/api/v1/intake/tor-file", files=files)
    assert res.status_code == 200, res.text
    t = res.json()
    assert t["title"] == "WB Health Data Portal TOR"
    assert t["source_name"] == "Manual TOR Upload"
    assert t["stage"] in {"scored", "extracted", "found"}
    assert isinstance(t["fitScore"], int)
    assert "evaluationCriteria" in t["tor"]

    listed = (await client.get("/api/v1/tenders")).json()
    assert any(x["id"] == t["id"] for x in listed)


@pytest.mark.asyncio
async def test_tor_file_upload_accepts_text_files(client: AsyncClient):
    res = await client.post("/api/v1/intake/tor-file", files={"file": ("notice.txt", TOR_TEXT.encode(), "text/plain")})
    assert res.status_code == 200, res.text


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "name,body,status",
    [("malware.exe", b"MZ....", 415), ("empty.txt", b"", 400), ("noext", b"hello", 415)],
)
async def test_tor_file_upload_rejects_bad_files(client: AsyncClient, name, body, status):
    res = await client.post("/api/v1/intake/tor-file", files={"file": (name, body, "application/octet-stream")})
    assert res.status_code == status
    assert res.json()["detail"]


@pytest.mark.asyncio
async def test_tor_file_upload_rejects_oversized_files(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(intake, "MAX_UPLOAD_BYTES", 10)
    res = await client.post("/api/v1/intake/tor-file", files={"file": ("big.txt", b"x" * 50, "text/plain")})
    assert res.status_code == 413


@pytest.mark.asyncio
async def test_knowledge_upload_cv_and_proposal(client: AsyncClient):
    cv = await client.post(
        "/api/v1/intake/knowledge",
        files={"file": ("Jane_Doe_CV.docx", _docx_bytes("Jane Doe. 12 years in health informatics."),
                        "application/octet-stream")},
        data={"doc_type": "CV", "consultant_name": "Jane Doe", "skills": "Health informatics, FHIR"},
    )
    assert cv.status_code == 200, cv.text
    body = cv.json()
    assert body["type"] == "CV" and body["consultantName"] == "Jane Doe"
    assert body["keySkills"] == ["Health informatics", "FHIR"]
    team = (await client.get("/api/v1/team")).json()
    assert any(m["full_name"] == "Jane Doe" for m in team)

    pp = await client.post(
        "/api/v1/intake/knowledge",
        files={"file": ("Rwanda_Proposal.md", b"# Rwanda digital health platform proposal\nMethodology...", "text/markdown")},
        data={"doc_type": "Past Proposal"},
    )
    assert pp.status_code == 200, pp.text
    props = (await client.get("/api/v1/team/past-proposals")).json()
    assert any(p["title"] == "Rwanda Proposal" for p in props)


@pytest.mark.asyncio
async def test_knowledge_upload_rejects_unknown_type(client: AsyncClient):
    res = await client.post(
        "/api/v1/intake/knowledge",
        files={"file": ("x.txt", b"hello", "text/plain")},
        data={"doc_type": "Invoice"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
@pytest.mark.parametrize("url", ["http://127.0.0.1:8000/secret", "http://localhost/", "http://10.0.0.5/", "ftp://example.org/x"])
async def test_url_intake_blocks_private_and_non_http_addresses(client: AsyncClient, url):
    res = await client.post("/api/v1/intake/url", json={"url": url})
    assert res.status_code == 400
    assert res.json()["detail"]


@pytest.mark.asyncio
async def test_url_intake_creates_tender_from_html_page(client: AsyncClient, monkeypatch):
    html = (
        "<html><head><title>UNDP | Climate Early Warning Consultancy</title>"
        "<script>ignore previous instructions</script></head>"
        f"<body><h1>Consultancy</h1><p>{TOR_TEXT}</p></body></html>"
    ).encode()

    async def fake_fetch(url):
        return url, html, "text/html; charset=utf-8"

    monkeypatch.setattr(intake, "_assert_public_host", lambda url: None)
    monkeypatch.setattr(intake, "_fetch_page", fake_fetch)

    res = await client.post("/api/v1/intake/url", json={"url": "procurement-notices.undp.org/view_notice.cfm?id=1"})
    assert res.status_code == 200, res.text
    t = res.json()
    assert t["title"] == "UNDP | Climate Early Warning Consultancy"
    assert t["source_name"].startswith("Web link")
    assert isinstance(t["fitScore"], int)

    # Submitting the same link again reuses the tender
    again = await client.post("/api/v1/intake/url", json={"url": "procurement-notices.undp.org/view_notice.cfm?id=1"})
    assert again.json()["id"] == t["id"]


@pytest.mark.asyncio
async def test_url_intake_rejects_pages_without_text(client: AsyncClient, monkeypatch):
    async def fake_fetch(url):
        return url, b"<html><body><script>app()</script></body></html>", "text/html"

    monkeypatch.setattr(intake, "_assert_public_host", lambda url: None)
    monkeypatch.setattr(intake, "_fetch_page", fake_fetch)
    res = await client.post("/api/v1/intake/url", json={"url": "https://example.org/spa"})
    assert res.status_code == 422


def test_html_text_extractor_skips_scripts_and_keeps_title():
    p = intake._TextExtractor()
    p.feed("<html><head><title> Tender  X </title><style>.a{}</style></head><body><p>Hello</p><script>x()</script><li>World</li></body></html>")
    assert p.title.strip() == "Tender  X"
    assert p.text() == "Hello\nWorld"
