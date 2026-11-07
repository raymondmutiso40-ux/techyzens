from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
from app.core.config import get_settings

class SpendCapExceededError(Exception):
    """Raised when an operation would exceed either the per-tender or daily spend cap."""
    pass

class SpendWarning(Exception):
    """Raised or logged when spend exceeds warning threshold (e.g. 80%)."""
    pass

class SpendGuard:
    """
    Implements Slide 8 Governance:
    '02 Spend caps: Daily and per-tender limits on AI usage, with alerts before they bite.'
    """

    # Price per million tokens (USD) [input, output]
    PRICING = {
        "claude-3-5-sonnet-20241022": (3.00, 15.00),
        "gemini-1.5-pro": (1.25, 5.00),
        "gpt-4o": (2.50, 10.00),
        "mock-model": (0.01, 0.02),
    }

    def __init__(self):
        self.settings = get_settings()
        # In-memory tracking for fast atomic checks; syncs with DB records
        self._tender_spend: Dict[str, float] = {}
        self._daily_spend: Dict[str, float] = {}

    def _get_today_key(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        input_price, output_price = self.PRICING.get(model, (3.00, 15.00))
        cost = (input_tokens / 1_000_000.0 * input_price) + (output_tokens / 1_000_000.0 * output_price)
        return round(cost, 6)

    def check_allowance(self, tender_id: str, estimated_cost: float) -> Tuple[bool, Optional[str]]:
        """
        Validates whether the upcoming operation is within spend caps.
        Returns (is_allowed, warning_or_error_message).
        """
        today = self._get_today_key()
        current_daily = self._daily_spend.get(today, 0.0)
        current_tender = self._tender_spend.get(tender_id, 0.0)

        # Check Per-Tender Limit
        projected_tender = current_tender + estimated_cost
        if projected_tender > self.settings.PER_TENDER_SPEND_CAP_USD:
            raise SpendCapExceededError(
                f"Per-tender spend cap of ${self.settings.PER_TENDER_SPEND_CAP_USD:.2f} exceeded! "
                f"Current: ${current_tender:.4f}, Projected: ${projected_tender:.4f}"
            )

        # Check Daily Limit
        projected_daily = current_daily + estimated_cost
        if projected_daily > self.settings.DAILY_SPEND_CAP_USD:
            raise SpendCapExceededError(
                f"Daily spend cap of ${self.settings.DAILY_SPEND_CAP_USD:.2f} exceeded! "
                f"Current: ${current_daily:.4f}, Projected: ${projected_daily:.4f}"
            )

        # Check Warning Thresholds (e.g. 80%)
        tender_warn = self.settings.PER_TENDER_SPEND_CAP_USD * (self.settings.SPEND_WARNING_THRESHOLD_PCT / 100.0)
        daily_warn = self.settings.DAILY_SPEND_CAP_USD * (self.settings.SPEND_WARNING_THRESHOLD_PCT / 100.0)

        warning = None
        if projected_tender >= tender_warn:
            warning = f"Alert: Tender {tender_id} has reached {projected_tender/self.settings.PER_TENDER_SPEND_CAP_USD*100:.1f}% of spend cap."
        elif projected_daily >= daily_warn:
            warning = f"Alert: Daily AI spend has reached {projected_daily/self.settings.DAILY_SPEND_CAP_USD*100:.1f}% of daily cap."

        return True, warning

    def record_usage(self, tender_id: str, model: str, input_tokens: int, output_tokens: int) -> float:
        cost = self.calculate_cost(model, input_tokens, output_tokens)
        today = self._get_today_key()

        self._daily_spend[today] = self._daily_spend.get(today, 0.0) + cost
        self._tender_spend[tender_id] = self._tender_spend.get(tender_id, 0.0) + cost
        return cost

    def get_status(self, tender_id: Optional[str] = None) -> Dict:
        today = self._get_today_key()
        daily = round(self._daily_spend.get(today, 0.0), 4)
        tender = round(self._tender_spend.get(tender_id, 0.0), 4) if tender_id else 0.0

        return {
            "date": today,
            "daily_spend_usd": daily,
            "daily_cap_usd": self.settings.DAILY_SPEND_CAP_USD,
            "daily_remaining_usd": max(0.0, round(self.settings.DAILY_SPEND_CAP_USD - daily, 4)),
            "daily_percent_used": round((daily / self.settings.DAILY_SPEND_CAP_USD) * 100, 2),
            "tender_id": tender_id,
            "tender_spend_usd": tender,
            "tender_cap_usd": self.settings.PER_TENDER_SPEND_CAP_USD,
            "tender_remaining_usd": max(0.0, round(self.settings.PER_TENDER_SPEND_CAP_USD - tender, 4)),
            "tender_percent_used": round((tender / self.settings.PER_TENDER_SPEND_CAP_USD) * 100, 2) if tender_id else 0.0
        }

spend_guard = SpendGuard()
