import logging
import asyncio
from typing import List, Dict
from app.adapters.base import BaseSourceAdapter, TenderNotice
from app.adapters.ungm_adapter import UNGMAdapter
from app.adapters.world_bank_adapter import WorldBankAdapter
from app.adapters.email_adapter import EmailAlertAdapter
from app.adapters.upload_adapter import UploadAdapter

logger = logging.getLogger(__name__)

class SourceAdapterManager:
    """
    Manages all configured source scrapers, monitors, and upload adapters.
    Implements retries, rate limiting, and scheduled synchronization.
    """

    def __init__(self):
        self.adapters: Dict[str, BaseSourceAdapter] = {
            "ungm": UNGMAdapter(),
            "world_bank": WorldBankAdapter(),
            "email_alerts": EmailAlertAdapter(),
            "upload": UploadAdapter(),
        }

    def register_adapter(self, key: str, adapter: BaseSourceAdapter):
        self.adapters[key] = adapter

    def get_adapter(self, key: str) -> BaseSourceAdapter:
        if key not in self.adapters:
            raise ValueError(f"Unknown source adapter: {key}")
        return self.adapters[key]

    async def poll_all_sources(self, max_retries: int = 3, retry_delay: float = 2.0) -> List[TenderNotice]:
        all_notices: List[TenderNotice] = []

        for key, adapter in self.adapters.items():
            if adapter.source_type == "upload":
                continue  # Uploads are event-driven

            attempt = 0
            while attempt < max_retries:
                try:
                    logger.info(f"Polling source: {adapter.source_name} (Attempt {attempt + 1})")
                    notices = await adapter.poll_new_tenders()
                    all_notices.extend(notices)
                    break
                except Exception as ex:
                    attempt += 1
                    logger.warning(f"Error polling {adapter.source_name}: {ex}. Retrying in {retry_delay}s...")
                    if attempt >= max_retries:
                        logger.error(f"Failed to poll {adapter.source_name} after {max_retries} attempts.")
                    else:
                        await asyncio.sleep(retry_delay)

        return all_notices

adapter_manager = SourceAdapterManager()
