import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import Tender

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "BidDesk" in data["app"]

@pytest.mark.asyncio
async def test_tenders_crud_and_run(client: AsyncClient, db_session: AsyncSession):
    # 1. Create tender via API
    payload = {
        "title": "National Water Resource Information System",
        "donor": "African Development Bank",
        "deadline": "2026-11-30",
        "budget": "USD 500,000",
        "country": "Tanzania",
        "raw_text": "AfDB requires consulting services to build a water resource information portal."
    }
    create_res = await client.post("/api/v1/tenders", json=payload)
    assert create_res.status_code == 200
    tender_data = create_res.json()
    tender_id = tender_data["id"]
    assert tender_data["title"] == payload["title"]
    assert tender_data["status"] == "DISCOVERED"

    # 2. List tenders
    list_res = await client.get("/api/v1/tenders")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Run full pipeline on tender
    run_res = await client.post(f"/api/v1/tenders/{tender_id}/run")
    assert run_res.status_code == 200
    report = run_res.json()
    assert report["fit_score"] is not None
    assert report["status"] == "UNDER_HUMAN_REVIEW"
    assert report["docx_path"] is not None

    # 4. View in Review Desk
    rev_res = await client.get(f"/api/v1/reviews/{tender_id}")
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["tender"]["status"] == "UNDER_HUMAN_REVIEW"
    assert rev_data["draft"] is not None

    # 5. Record Human Decision
    dec_payload = {
        "decision": "APPROVED_TO_BID",
        "reviewer_name": "Janet",
        "reviewer_email": "janet@example.org",
        "comments": "Quality looks strong. Proceed."
    }
    dec_res = await client.post(f"/api/v1/reviews/{tender_id}/decision", json=dec_payload)
    assert dec_res.status_code == 200
    assert dec_res.json()["decision"] == "APPROVED_TO_BID"

@pytest.mark.asyncio
async def test_monitors_poll(client: AsyncClient):
    resp = await client.get("/api/v1/monitors")
    assert resp.status_code == 200
    adapters = resp.json()
    assert len(adapters) >= 3

    poll_res = await client.post("/api/v1/monitors/poll")
    assert poll_res.status_code == 200
    assert "polled_count" in poll_res.json()

@pytest.mark.asyncio
async def test_spend_status_endpoint(client: AsyncClient):
    resp = await client.get("/api/v1/spend/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "daily_spend_usd" in data
    assert "daily_cap_usd" in data


@pytest.mark.asyncio
async def test_auth_request_and_verify(client: AsyncClient):
    # Request code
    req_res = await client.post("/auth/request-code", json={"phone": "+254712345678"})
    assert req_res.status_code == 200
    req_data = req_res.json()
    assert req_data["ok"] is True
    demo_code = req_data.get("demo_code", "123456")

    # Verify code
    verify_res = await client.post("/auth/verify-code", json={"phone": "+254712345678", "code": demo_code})
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["authenticated"] is True
    assert v_data["phone"] == "+254712345678"
    assert v_data["user"]["name"] == "Romano Juma"
