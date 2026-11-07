"""
Document & link intake for the frontend.

POST /api/v1/intake/tor-file   multipart TOR file  -> tender (extracted + scored)
POST /api/v1/intake/url        {"url": ...}        -> tender (page fetched, extracted + scored)
POST /api/v1/intake/knowledge  multipart CV / past proposal / capability statement -> KB document

All uploaded files and fetched pages are treated as untrusted data (see PromptGuard).
"""
import hashlib
import ipaddress
import logging
import re
import socket
import uuid
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urljoin, urlparse

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.adapters.upload_adapter import UploadAdapter
from app.api.v1.tenders import enrich_tender_for_frontend
from app.core.audit import AuditLogger
from app.core.config import get_settings
from app.core.database import get_db
from app.models.entities import PastProposal, TeamMember, Tender
from app.services.extractor import TORExtractor
from app.services.scorer import TenderScorer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/intake", tags=["Intake: files & links"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_PAGE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_REDIRECTS = 5
FETCH_TIMEOUT = httpx.Timeout(15.0, connect=8.0)
KB_TYPES = {"CV", "Past Proposal", "Capability Statement"}


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #

def _human_size(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 * 1024:
        return f"{n / 1024:.0f} KB"
    return f"{n / (1024 * 1024):.1f} MB"


def _safe_stored_name(original: str) -> Tuple[str, str]:
    """Return (display_name, stored_filename). Never trusts client paths."""
    display = Path(original or "document").name[:150] or "document"
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(display).stem)[:60] or "document"
    return display, f"{uuid.uuid4().hex[:10]}_{stem}{Path(display).suffix.lower()}"


async def _save_upload(file: UploadFile) -> Tuple[str, Path, int]:
    display, stored = _safe_stored_name(file.filename or "")
    ext = Path(display).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext or 'none'}'. Upload a PDF, Word (.docx), .txt or .md file.",
        )
    settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    dest = settings.DOCUMENTS_DIR / stored
    size = 0
    with open(dest, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File is larger than 15 MB.")
            out.write(chunk)
    if size == 0:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    return display, dest, size


def _read_text(path: Path) -> str:
    try:
        return UploadAdapter.read_document_text(str(path)) or ""
    except Exception as exc:  # corrupt docx etc.
        logger.warning("Could not read %s: %s", path.name, exc)
        raise HTTPException(status_code=422, detail="The file could not be read. Is it a valid document?")


async def _load_enriched(db: AsyncSession, tender_id: str) -> dict:
    res = await db.execute(
        select(Tender)
        .options(selectinload(Tender.tor), selectinload(Tender.score), selectinload(Tender.drafts))
        .where(Tender.id == tender_id)
        .execution_options(populate_existing=True)
    )
    t = res.scalar_one()
    data = enrich_tender_for_frontend(t)
    data["source_url"] = t.source_url
    data["summary"] = (t.tor.scope_summary if t.tor and t.tor.scope_summary else (t.raw_text or "")[:400])
    return data


async def _extract_and_score(db: AsyncSession, tender: Tender) -> dict:
    """Run Move 2 (Extract) and Move 3 (Score); never lose the tender if the AI step fails."""
    try:
        tor = await TORExtractor.extract_tor(db, tender)
        await TenderScorer.score_tender(db, tender, tor)
    except Exception as exc:
        logger.warning("Extraction/scoring failed for %s: %s", tender.id, exc)
    return await _load_enriched(db, tender.id)


class _TextExtractor(HTMLParser):
    """Turns an HTML page into readable text and captures its <title>."""

    SKIP = {"script", "style", "noscript", "svg", "template", "head"}
    BLOCK = {"p", "div", "li", "tr", "br", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "td", "th"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.title = ""
        self._skip_depth = 0
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self._in_title = True
        if tag in self.SKIP:
            self._skip_depth += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in self.SKIP and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self._skip_depth:
            self.parts.append(data)

    def text(self) -> str:
        raw = "".join(self.parts)
        lines = (re.sub(r"[ \t\r\f\v]+", " ", ln).strip() for ln in raw.splitlines())
        return "\n".join(ln for ln in lines if ln)


def _assert_public_host(url: str) -> None:
    """Block requests to localhost / private networks (SSRF protection)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Enter a full web address starting with http:// or https://")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"Could not find the website '{parsed.hostname}'.")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            raise HTTPException(status_code=400, detail="That address points to a private network and can't be fetched.")


async def _fetch_page(url: str) -> Tuple[str, bytes, str]:
    """Fetch a public URL, re-checking every redirect hop. Returns (final_url, body, content_type)."""
    current = url
    async with httpx.AsyncClient(
        timeout=FETCH_TIMEOUT,
        follow_redirects=False,
        headers={"User-Agent": "TenderPilot/1.0 (+tender intake)"},
    ) as client:
        for _ in range(MAX_REDIRECTS + 1):
            _assert_public_host(current)
            try:
                async with client.stream("GET", current) as resp:
                    if resp.is_redirect and resp.headers.get("location"):
                        current = urljoin(current, resp.headers["location"])
                        continue
                    if resp.status_code >= 400:
                        raise HTTPException(status_code=502, detail=f"The website returned an error ({resp.status_code}).")
                    body = bytearray()
                    async for chunk in resp.aiter_bytes():
                        body.extend(chunk)
                        if len(body) > MAX_PAGE_BYTES:
                            raise HTTPException(status_code=413, detail="That page is larger than 5 MB.")
                    return current, bytes(body), resp.headers.get("content-type", "").lower()
            except httpx.TimeoutException:
                raise HTTPException(status_code=504, detail="The website took too long to respond.")
            except httpx.HTTPError as exc:
                raise HTTPException(status_code=502, detail=f"Could not reach the website ({exc.__class__.__name__}).")
    raise HTTPException(status_code=502, detail="Too many redirects.")


# --------------------------------------------------------------------------- #
# Endpoints                                                                   #
# --------------------------------------------------------------------------- #

@router.post("/tor-file")
async def intake_tor_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Upload a TOR document; creates a tender and runs extraction + fit scoring."""
    display, path, size = await _save_upload(file)
    text = _read_text(path)
    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text was found in this file.")

    tender = Tender(
        reference_code=f"UPL-{uuid.uuid4().hex[:8].upper()}",
        title=Path(display).stem.replace("_", " ").replace("-", " ").strip()[:200] or "Uploaded TOR",
        source_name="Manual TOR Upload",
        raw_document_path=str(path),
        raw_text=text,
        status="DISCOVERED",
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    await AuditLogger.log_step(
        db=db, step_name="FIND", action=f"TOR uploaded: {display} ({_human_size(size)})",
        actor="Bid Desk User", tender_id=tender.id, details={"file": display, "bytes": size},
    )
    return await _extract_and_score(db, tender)


class UrlIntake(BaseModel):
    url: str


@router.post("/url")
async def intake_url(payload: UrlIntake, db: AsyncSession = Depends(get_db)):
    """Fetch a tender notice page (or linked PDF/DOCX), create a tender and run extraction + scoring."""
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Enter a web address.")
    if re.match(r"^[a-z][a-z0-9+.-]*://", url, re.IGNORECASE) and not re.match(r"^https?://", url, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Only http:// and https:// links are supported.")
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = f"https://{url}"
    _assert_public_host(url)

    existing = (await db.execute(select(Tender).where(Tender.source_url == url))).scalar_one_or_none()
    if existing:  # same link submitted again: reuse the tender instead of duplicating it
        return await _load_enriched(db, existing.id)

    final_url, body, ctype = await _fetch_page(url)
    path_ext = Path(urlparse(final_url).path).suffix.lower()

    if "pdf" in ctype or "officedocument.wordprocessingml" in ctype or path_ext in (".pdf", ".docx"):
        ext = ".pdf" if ("pdf" in ctype or path_ext == ".pdf") else ".docx"
        settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
        dest = settings.DOCUMENTS_DIR / f"{uuid.uuid4().hex[:10]}_link{ext}"
        dest.write_bytes(body)
        text = _read_text(dest)
        title = Path(urlparse(final_url).path).stem.replace("_", " ").replace("-", " ") or urlparse(final_url).hostname
    else:
        parser = _TextExtractor()
        parser.feed(body.decode("utf-8", errors="ignore"))
        text = parser.text()
        title = re.sub(r"\s+", " ", parser.title).strip() or urlparse(final_url).hostname

    if len(text.strip()) < 40:
        raise HTTPException(status_code=422, detail="That page has almost no readable text. Try the tender's PDF or notice page.")

    tender = Tender(
        reference_code=f"URL-{hashlib.sha1(url.encode()).hexdigest()[:8].upper()}",
        title=(title or "Tender from link")[:200],
        source_name=f"Web link ({urlparse(final_url).hostname})",
        source_url=url,
        raw_text=text[:60000],
        status="DISCOVERED",
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    await AuditLogger.log_step(
        db=db, step_name="FIND", action=f"Tender fetched from link: {urlparse(final_url).hostname}",
        actor="Bid Desk User", tender_id=tender.id, details={"url": url, "final_url": final_url, "chars": len(text)},
    )
    return await _extract_and_score(db, tender)


@router.post("/knowledge")
async def intake_knowledge_document(
    file: UploadFile = File(...),
    doc_type: str = Form("CV"),
    consultant_name: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    summary: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Upload a CV, past proposal or capability statement into the knowledge base."""
    if doc_type not in KB_TYPES:
        raise HTTPException(status_code=400, detail=f"doc_type must be one of: {', '.join(sorted(KB_TYPES))}")
    display, path, size = await _save_upload(file)
    text = _read_text(path)
    skill_list = [s.strip() for s in (skills or "").split(",") if s.strip()]
    abstract = (summary or "").strip() or re.sub(r"\s+", " ", text)[:600] or "Uploaded document."

    if doc_type == "CV":
        name = (consultant_name or "").strip() or Path(display).stem.replace("_", " ")
        record = TeamMember(
            full_name=name[:120],
            role_title="Consultant",
            email="",
            years_of_experience=0,
            bio=abstract,
            skills=skill_list,
            cv_document_path=str(path),
        )
    else:
        record = PastProposal(
            title=Path(display).stem.replace("_", " ")[:200],
            client_donor="Not specified",
            sector=doc_type,
            win_status="WON" if doc_type == "Past Proposal" else "N/A",
            abstract=abstract,
            key_methodology=re.sub(r"\s+", " ", text)[:1500] or abstract,
            team_composition=[],
            full_text=text or abstract,
        )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    await AuditLogger.log_step(
        db=db, step_name="KNOWLEDGE_BASE", action=f"{doc_type} uploaded: {display}",
        actor="Bid Desk User", details={"file": display, "bytes": size},
    )
    return {
        "id": record.id,
        "name": display,
        "type": doc_type,
        "size": _human_size(size),
        "uploadedAt": "Just now",
        "status": "Parsed & Indexed",
        "consultantName": record.full_name if doc_type == "CV" else None,
        "keySkills": skill_list or ["Consulting"],
        "summary": abstract[:400],
    }
