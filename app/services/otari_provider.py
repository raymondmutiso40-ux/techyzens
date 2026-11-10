import logging
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.spend_guard import spend_guard
from app.services.llm_provider import BaseLLMProvider, LLMResponse

logger = logging.getLogger(__name__)


class OtariLLMProvider(BaseLLMProvider):
    """OpenAI-compatible Otari gateway provider."""

    def __init__(self, api_key: str, model: str, base_url: str, timeout: float = 120.0):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def generate(
        self, prompt: str, system_prompt: str = "", tender_id: str = "general"
    ) -> LLMResponse:
        # Use the existing spend guard's model-rate estimate before making a paid call.
        estimated_input = max(1, len(prompt.split()) + len(system_prompt.split()))
        estimated_cost = spend_guard.calculate_cost(self.model, estimated_input, 4096)
        spend_guard.check_allowance(tender_id, estimated_cost)

        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 4096,
            # DeepSeek V4.1 supports disabling reasoning so the completion
            # returns user-facing text in message.content.
            "reasoning_effort": "none",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices") or []
        if not choices:
            raise ValueError("Otari returned no completion choices.")

        choice = choices[0]
        message = choice.get("message") or {}
        content = message.get("content", "")
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") for part in content if isinstance(part, dict)
            )
        if not isinstance(content, str) or not content.strip():
            # Do not expose reasoning_content as the user-facing answer. Log only
            # safe response metadata so the upstream behavior can be diagnosed.
            logger.error(
                "Otari returned no user-facing text (model=%s finish_reason=%s has_reasoning_content=%s content_type=%s)",
                data.get("model") or self.model,
                choice.get("finish_reason"),
                bool(message.get("reasoning_content")),
                type(message.get("content")).__name__,
            )
            raise ValueError("Otari returned no user-facing text. Check the model response and reasoning settings.")

        usage = data.get("usage") or {}
        input_tokens = int(usage.get("prompt_tokens") or usage.get("input_tokens") or estimated_input)
        output_tokens = int(usage.get("completion_tokens") or usage.get("output_tokens") or len(content.split()))
        served_model = str(data.get("model") or self.model)

        # Prefer the gateway's billed cost when available; otherwise use the local
        # SpendGuard estimate for models without a returned price.
        gateway_cost = usage.get("cost_usd")
        try:
            cost = float(gateway_cost) if gateway_cost is not None else spend_guard.calculate_cost(
                served_model, input_tokens, output_tokens
            )
        except (TypeError, ValueError):
            cost = spend_guard.calculate_cost(served_model, input_tokens, output_tokens)

        spend_guard.record_cost(tender_id, cost)
        return LLMResponse(
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            model=served_model,
            cost_usd=cost,
        )


def get_otari_provider() -> OtariLLMProvider | None:
    settings = get_settings()
    if not settings.OTARI_API_KEY or not settings.OTARI_MODEL:
        logger.warning(
            "LLM_PROVIDER is 'otari' but OTARI_API_KEY or OTARI_MODEL is missing; using mock provider."
        )
        return None
    return OtariLLMProvider(
        api_key=settings.OTARI_API_KEY,
        model=settings.OTARI_MODEL,
        base_url=settings.OTARI_BASE_URL,
    )
