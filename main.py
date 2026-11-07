import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

THRIVEVAS_API_KEY = os.getenv("THRIVEVAS_API_KEY", "secureapikeys")
THRIVEVAS_SMS_URL = os.getenv(
    "THRIVEVAS_SMS_URL", "https://sms.thrivevas.com/v1/message/send"
)

app = FastAPI(title="ThriveVas SMS Test")


# ---------- models ----------
class SMSRequest(BaseModel):
    msisdn: str = Field(
        ...,
        description="Recipient, e.g. +2547xxxxxxxx. Comma-separate up to 50 numbers.",
        examples=["+254700000001"],
    )
    message: str = Field(..., min_length=1, max_length=160)
    sender_id: Optional[str] = Field(None, examples=["ThriveVas"])
    callback_url: Optional[str] = Field(None, examples=["https://callback.io/123/dlr"])


class SMSResponse(BaseModel):
    status: int
    message: str
    transaction_id: Optional[int] = None


# ---------- endpoint ----------
@app.post("/test/send-sms", response_model=SMSResponse, tags=["SMS"])
async def send_sms(payload: SMSRequest):
    """
    Test endpoint: forwards a single SMS to ThriveVas.
    Swagger UI: http://127.0.0.1:8000/docs
    """
    body = {"message": payload.message, "msisdn": payload.msisdn}
    if payload.sender_id:
        body["sender_id"] = payload.sender_id
    if payload.callback_url:
        body["callback_url"] = payload.callback_url

    headers = {
        "Content-Type": "application/json",
        "x-api-key": THRIVEVAS_API_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.post(THRIVEVAS_SMS_URL, json=body, headers=headers)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Upstream request failed: {e}")

    # Try to parse JSON regardless of status code
    try:
        data = r.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail={"error": "Non-JSON upstream response", "body": r.text},
        )

    # Upstream body carries the real status
    upstream_status = data.get("status", r.status_code)
    if r.status_code >= 400 or upstream_status >= 400:
        raise HTTPException(
            status_code=upstream_status if isinstance(upstream_status, int) else 502,
            detail=data,
        )

    return SMSResponse(**data)


@app.get("/health")
async def health():
    return {"ok": True, "api_key_set": bool(THRIVEVAS_API_KEY)}