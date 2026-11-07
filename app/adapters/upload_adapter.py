import os
from pathlib import Path
from typing import List, Optional
import docx
from app.adapters.base import BaseSourceAdapter, TenderNotice
from app.core.prompt_guard import PromptGuard

class UploadAdapter(BaseSourceAdapter):
    """
    Adapter for manually uploaded TOR documents (Word .docx, text, markdown, or PDF).
    Slide 3: 'Uploaded TORs -> Extraction -> Structured TOR'
    """

    @property
    def source_name(self) -> str:
        return "Manual TOR Upload"

    @property
    def source_type(self) -> str:
        return "upload"

    async def poll_new_tenders(self) -> List[TenderNotice]:
        # Uploads are pushed via API rather than pulled via polling
        return []

    async def fetch_tender_detail(self, reference_code: str) -> Optional[TenderNotice]:
        return None

    @classmethod
    def read_document_text(cls, file_path: str) -> str:
        """Extracts text content from uploaded files (.docx, .md, .txt)."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        suffix = path.suffix.lower()

        if suffix == ".docx":
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                if para.text.strip():
                    full_text.append(para.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        full_text.append(f"[TABLE ROW]: {row_text}")
            return "\n\n".join(full_text)

        elif suffix in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        elif suffix == ".pdf":
            # Basic fallback text extractor for PDFs
            try:
                with open(file_path, "rb") as f:
                    content = f.read().decode("latin-1", errors="ignore")
                    # simple printable string filter
                    printable = "".join(ch for ch in content if 32 <= ord(ch) <= 126 or ch in "\n\r\t")
                    return printable[:50000]
            except Exception:
                return f"[PDF document stored at {file_path}]"

        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
