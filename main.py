import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field

from sms import SMSProviderError, send_sms

load_dotenv()

AUTH_DB_PATH = os.getenv("AUTH_DB_PATH", "tenderpilot.db")
OTP_TTL_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_SECONDS = 60
PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")
GENERIC_CODE_RESPONSE = {
    "message": "If the number is eligible, a verification code has been sent."
}

app = FastAPI(title="TenderPilot API")


class PhoneRequest(BaseModel):
    phone: str = Field(..., min_length=8, max_length=20)


class VerifyCodeRequest(PhoneRequest):
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_phone(phone: str) -> str:
    normalized = re.sub(r"[\s().-]", "", phone)
    if not PHONE_PATTERN.fullmatch(normalized):
        raise HTTPException(
            status_code=422,
            detail="Phone number must use E.164 format, for example +254712345678",
        )
    return normalized


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(AUTH_DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with connect_db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                phone TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL,
                last_login_at TEXT
            );
            CREATE TABLE IF NOT EXISTS otp_codes (
                id TEXT PRIMARY KEY,
                phone TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                used_at TEXT,
                created_at TEXT NOT NULL,
                ip TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_otp_phone_created
                ON otp_codes(phone, created_at);
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked_at TEXT
            );
            """
        )


def hash_code(phone: str, code: str) -> str:
    secret = os.getenv("OTP_HASH_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="OTP service is not configured")
    return hmac.new(
        secret.encode(), f"{phone}:{code}".encode(), hashlib.sha256
    ).hexdigest()


def rate_limited(connection: sqlite3.Connection, phone: str, ip: str | None) -> bool:
    now = utc_now()
    hour_ago = (now - timedelta(hours=1)).isoformat()
    if connection.execute(
        "SELECT COUNT(*) FROM otp_codes WHERE phone = ? AND created_at >= ?",
        (phone, hour_ago),
    ).fetchone()[0] >= 5:
        return True
    if ip and connection.execute(
        "SELECT COUNT(*) FROM otp_codes WHERE ip = ? AND created_at >= ?",
        (ip, hour_ago),
    ).fetchone()[0] >= 20:
        return True
    latest = connection.execute(
        "SELECT created_at FROM otp_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1",
        (phone,),
    ).fetchone()
    return bool(
        latest
        and now - datetime.fromisoformat(latest["created_at"])
        < timedelta(seconds=OTP_RESEND_SECONDS)
    )


init_db()


@app.post("/auth/request-code", tags=["Authentication"])
async def request_code(payload: PhoneRequest, request: Request):
    phone = normalize_phone(payload.phone)
    now = utc_now()
    code = f"{secrets.randbelow(1_000_000):06d}"
    client_ip = request.client.host if request.client else None

    otp_id = str(uuid.uuid4())
    with connect_db() as connection:
        if rate_limited(connection, phone, client_ip):
            return GENERIC_CODE_RESPONSE
        connection.execute(
            """
            INSERT INTO otp_codes
                (id, phone, code_hash, expires_at, created_at, ip)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                otp_id,
                phone,
                hash_code(phone, code),
                (now + timedelta(minutes=OTP_TTL_MINUTES)).isoformat(),
                now.isoformat(),
                client_ip,
            ),
        )

    try:
        await send_sms(
            phone,
            f"Your TenderPilot code is {code}. It expires in 5 minutes. Do not share it.",
        )
    except SMSProviderError as exc:
        with connect_db() as connection:
            connection.execute("DELETE FROM otp_codes WHERE id = ?", (otp_id,))
        raise HTTPException(status_code=502, detail="Unable to send verification code") from exc

    return GENERIC_CODE_RESPONSE


@app.post("/auth/verify-code", tags=["Authentication"])
async def verify_code(payload: VerifyCodeRequest, response: Response):
    phone = normalize_phone(payload.phone)
    now = utc_now()

    with connect_db() as connection:
        row = connection.execute(
            """
            SELECT * FROM otp_codes
            WHERE phone = ? AND used_at IS NULL
            ORDER BY created_at DESC LIMIT 1
            """,
            (phone,),
        ).fetchone()
        if not row or row["attempts"] >= OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=401, detail="Invalid or expired code")

        connection.execute(
            "UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?", (row["id"],)
        )
        connection.commit()
        valid = (
            datetime.fromisoformat(row["expires_at"]) > now
            and hmac.compare_digest(row["code_hash"], hash_code(phone, payload.code))
        )
        if not valid:
            raise HTTPException(status_code=401, detail="Invalid or expired code")

        connection.execute(
            "UPDATE otp_codes SET used_at = ? WHERE id = ?", (now.isoformat(), row["id"])
        )
        user = connection.execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()
        user_id = user["id"] if user else str(uuid.uuid4())
        if user:
            connection.execute(
                "UPDATE users SET last_login_at = ? WHERE id = ?", (now.isoformat(), user_id)
            )
        else:
            connection.execute(
                "INSERT INTO users (id, phone, created_at, last_login_at) VALUES (?, ?, ?, ?)",
                (user_id, phone, now.isoformat(), now.isoformat()),
            )

        raw_token = secrets.token_urlsafe(32)
        connection.execute(
            """
            INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                user_id,
                hashlib.sha256(raw_token.encode()).hexdigest(),
                now.isoformat(),
                (now + timedelta(days=30)).isoformat(),
            ),
        )

    response.set_cookie(
        "tenderpilot_session",
        raw_token,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "true").lower() == "true",
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
    )
    return {"authenticated": True, "phone": phone}


@app.post("/auth/logout", status_code=204, tags=["Authentication"])
async def logout(response: Response):
    response.delete_cookie("tenderpilot_session")


@app.get("/health")
async def health():
    return {
        "ok": True,
        "sms_provider_configured": bool(
            os.getenv("THRIVEWAVE_API_URL") and os.getenv("THRIVEWAVE_API_KEY")
        ),
    }
