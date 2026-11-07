import pytest
from httpx import AsyncClient

from app.core.config import Settings, get_settings
from app.api.v1 import auth as auth_api


def test_sms_is_off_and_has_no_credentials_by_default(monkeypatch):
    for var in ("ENABLE_SMS_ALERTS", "THRIVEWAS_MSISDN", "THRIVEWAS_PASSWORD", "BID_LEAD_PHONE", "THRIVEWAVE_API_KEY"):
        monkeypatch.delenv(var, raising=False)
    s = Settings(_env_file=None)
    assert s.ENABLE_SMS_ALERTS is False
    assert not s.THRIVEWAS_MSISDN
    assert not s.THRIVEWAS_PASSWORD
    assert not s.BID_LEAD_PHONE


def test_tests_run_with_sms_disabled():
    assert get_settings().ENABLE_SMS_ALERTS is False


@pytest.mark.asyncio
async def test_login_code_is_not_returned_when_a_real_sms_is_sent(client: AsyncClient, monkeypatch):
    async def fake_send(to_phone, message):
        return {"status": "sent", "to": to_phone}

    monkeypatch.setattr(auth_api.thrivewave_client, "send_sms", fake_send)
    res = await client.post("/auth/request-code", json={"phone": "+254712345678"})
    assert res.status_code == 200
    assert "demo_code" not in res.json()


@pytest.mark.asyncio
async def test_login_code_is_returned_only_in_demo_mode(client: AsyncClient):
    res = await client.post("/auth/request-code", json={"phone": "+254712345679"})
    body = res.json()
    assert len(body["demo_code"]) == 6
