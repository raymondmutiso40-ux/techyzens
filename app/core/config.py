from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "TenderPilot BidDesk AI - Autonomous Bid Intelligence System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Cross-origin frontend configuration for separate Vercel hosting
    FRONTEND_URL: Optional[str] = None
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Supabase configuration (credentials are supplied through Railway variables)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "tenderpilot-documents"

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/storage/bid_desk.db"
    SYNC_DATABASE_URL: str = f"sqlite:///{BASE_DIR}/storage/bid_desk.db"

    # Directories
    STORAGE_DIR: Path = BASE_DIR / "storage"
    DOCUMENTS_DIR: Path = BASE_DIR / "storage" / "documents"
    DRAFTS_DIR: Path = BASE_DIR / "storage" / "drafts"
    MOCKUPS_DIR: Path = BASE_DIR / "mockups"
    TEMPLATES_DIR: Path = BASE_DIR / "mockups" / "templates"

    # Slide 8 - Spend Caps & Safety Limits
    DAILY_SPEND_CAP_USD: float = 50.00
    PER_TENDER_SPEND_CAP_USD: float = 5.00
    SPEND_WARNING_THRESHOLD_PCT: float = 80.0

    # Slide 2 & 3 - Scoring & Review Config
    FIT_THRESHOLD_SCORE: int = 70
    DEFAULT_BID_LEAD_EMAIL: str = "bid.lead@acme-consulting.org"

    # AI / LLM Configuration (Defaulting to mock for offline reliability, supports Claude/Gemini/OpenAI)
    LLM_PROVIDER: str = "mock"  # "mock" | "claude" | "gemini" | "openai" | "otari"
    ANTHROPIC_API_KEY: Optional[str] = None
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20241022"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-pro"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OTARI_API_KEY: Optional[str] = None
    OTARI_BASE_URL: str = "https://api.otari.ai/api"
    OTARI_MODEL: str = ""  # Set an exact model ID available in your Otari account

    # Email delivery
    EMAIL_PROVIDER: str = "mock"  # "mock" | "resend" | "smtp"
    RESEND_API_KEY: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Thrivewave SMS Integration (For urgent bid lead alerts and spend cap tripwires)
    ENABLE_SMS_ALERTS: bool = True
    THRIVEWAVE_API_KEY: Optional[str] = None
    THRIVEWAVE_SENDER_ID: str = "BIDDESK"
    THRIVEWAVE_API_URL: str = "https://api.thrivewave.com/v1/sms/send"
    BID_LEAD_PHONE: str = "+1234567890"

    # Security
    API_KEY_HEADER: str = "X-BidDesk-API-Key"
    ADMIN_API_KEY: str = "biddesk-secret-key-2026"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    settings.DRAFTS_DIR.mkdir(parents=True, exist_ok=True)
    return settings
