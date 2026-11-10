import pytest

from app.services import otari_provider


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class FakeAsyncClient:
    calls = []

    def __init__(self, timeout=None):
        self.timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, headers=None, json=None):
        self.calls.append({"url": url, "headers": headers, "json": json})
        return FakeResponse({
            "model": "open-weight:sample-model",
            "choices": [{"message": {"content": "A grounded tender assessment."}}],
            "usage": {
                "prompt_tokens": 17,
                "completion_tokens": 9,
                "cost_usd": "0.001250",
            },
        })


@pytest.mark.asyncio
async def test_otari_provider_sends_chat_request_and_records_gateway_cost(monkeypatch):
    FakeAsyncClient.calls = []
    recorded = []
    monkeypatch.setattr(otari_provider.httpx, "AsyncClient", FakeAsyncClient)
    monkeypatch.setattr(otari_provider.spend_guard, "check_allowance", lambda *args: (True, None))
    monkeypatch.setattr(
        otari_provider.spend_guard,
        "record_cost",
        lambda tender_id, cost: recorded.append((tender_id, cost)) or cost,
    )

    provider = otari_provider.OtariLLMProvider(
        api_key="test-token",
        model="open-weight:sample-model",
        base_url="https://api.otari.ai/api",
    )
    result = await provider.generate(
        "Assess this tender",
        system_prompt="You are a careful bid analyst.",
        tender_id="tender-123",
    )

    request = FakeAsyncClient.calls[0]
    assert request["url"] == "https://api.otari.ai/api/v1/chat/completions"
    assert request["headers"]["Authorization"] == "Bearer test-token"
    assert request["json"]["model"] == "open-weight:sample-model"
    assert request["json"]["messages"][0] == {
        "role": "system",
        "content": "You are a careful bid analyst.",
    }
    assert result.content == "A grounded tender assessment."
    assert result.input_tokens == 17
    assert result.output_tokens == 9
    assert result.model == "open-weight:sample-model"
    assert result.cost_usd == 0.00125
    assert recorded == [("tender-123", 0.00125)]


@pytest.mark.asyncio
async def test_otari_provider_rejects_empty_choices(monkeypatch):
    class EmptyChoicesClient(FakeAsyncClient):
        async def post(self, url, headers=None, json=None):
            return FakeResponse({"choices": [], "usage": {}})

    monkeypatch.setattr(otari_provider.httpx, "AsyncClient", EmptyChoicesClient)
    monkeypatch.setattr(otari_provider.spend_guard, "check_allowance", lambda *args: (True, None))

    provider = otari_provider.OtariLLMProvider(
        api_key="test-token",
        model="open-weight:sample-model",
        base_url="https://api.otari.ai/api",
    )
    with pytest.raises(ValueError, match="no completion choices"):
        await provider.generate("Assess this tender")
