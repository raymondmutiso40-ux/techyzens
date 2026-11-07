"""Thrivewave SMS provider adapter.

The adapter is intentionally side-effect free on import. Provider calls only
happen when one of the exported functions is invoked.
"""

import base64
import os
from typing import Any

import httpx


class SMSProviderError(RuntimeError):
    """Raised when the SMS provider cannot accept a message."""


def _required_setting(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise SMSProviderError(f"Missing required setting: {name}")
    return value


async def send_sms(
    to: str,
    message: str,
    *,
    callback_url: str | None = None,
) -> dict[str, Any]:
    """Send an application-controlled SMS through the configured provider."""
    url = _required_setting("THRIVEWAVE_API_URL")
    api_key = _required_setting("THRIVEWAVE_API_KEY")

    body: dict[str, str] = {"message": message, "msisdn": to}
    sender_id = os.getenv("THRIVEWAVE_SENDER_ID")
    if sender_id:
        body["sender_id"] = sender_id
    if callback_url:
        body["callback_url"] = callback_url

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                url,
                json=body,
                headers={"Content-Type": "application/json", "x-api-key": api_key},
            )
    except httpx.RequestError as exc:
        raise SMSProviderError("SMS provider request failed") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise SMSProviderError("SMS provider returned a non-JSON response") from exc

    provider_status = data.get("status", response.status_code)
    if response.is_error or (
        isinstance(provider_status, int) and provider_status >= 400
    ):
        raise SMSProviderError("SMS provider rejected the message")

    return data


async def generate_api_key(
    msisdn: str,
    password: str,
    *,
    name: str = "tenderpilot",
    lifetime_seconds: int = 86400,
    url: str | None = None,
) -> dict[str, Any]:
    """Explicitly request a provider API key; never runs during module import."""
    url = url or _required_setting("THRIVEWAVE_IDENTITY_API_URL")
    credentials = base64.b64encode(f"{msisdn}:{password}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                url,
                json={"name": name, "lifetime_seconds": lifetime_seconds},
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Basic {credentials}",
                },
            )
    except httpx.RequestError as exc:
        raise SMSProviderError("API-key request failed") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise SMSProviderError("API-key endpoint returned a non-JSON response") from exc
    if response.is_error:
        raise SMSProviderError("API-key endpoint rejected the request")
    return data
