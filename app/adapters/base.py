from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class TenderNotice(BaseModel):
    reference_code: str
    title: str
    source_name: str
    source_url: Optional[str] = None
    donor: Optional[str] = None
    deadline: Optional[str] = None
    budget: Optional[str] = None
    country: Optional[str] = None
    summary: Optional[str] = None
    raw_content: Optional[str] = None
    file_path: Optional[str] = None

class BaseSourceAdapter(ABC):
    """
    Abstract adapter for tender sources.
    Slide 3: 'Scrapers and monitors: one adapter per source'
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        pass

    @property
    @abstractmethod
    def source_type(self) -> str:
        # "portal" | "donor_site" | "email" | "upload"
        pass

    @abstractmethod
    async def poll_new_tenders(self) -> List[TenderNotice]:
        """Polls the remote source for recently posted tender opportunities."""
        pass

    @abstractmethod
    async def fetch_tender_detail(self, reference_code: str) -> Optional[TenderNotice]:
        """Fetches the full specification or document for a specific notice."""
        pass
