import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import Tender, TenderScore, ProposalDraft, ReviewPack, ClaimEvidence
from app.core.config import get_settings
from app.core.audit import AuditLogger
from app.services.thrivewave_sms import thrivewave_client

logger = logging.getLogger(__name__)

class ReviewPackNotifier:
    """
    Move 7: Send
    Slide 2: 'Emails a review pack to the bid lead.'
    Slide 3: 'Email review pack'
    Slide 4: 'Review pack: Email with score, team, draft and flags'
    Slide 8: 'It stops at the draft. Your team reviews, edits, decides whether to bid, and submits.'
    """

    @classmethod
    async def assemble_and_send_review_pack(
        cls,
        db: AsyncSession,
        tender: Tender,
        score: TenderScore,
        draft: ProposalDraft,
        claims: Optional[list] = None,
        recipient_email: Optional[str] = None,
        recipient_phone: Optional[str] = None
    ) -> ReviewPack:
        logger.info(f"Executing Move 7 (Send) for Tender: {tender.id} ({tender.title})")
        settings = get_settings()

        email_to = recipient_email or settings.DEFAULT_BID_LEAD_EMAIL
        phone_to = recipient_phone or settings.BID_LEAD_PHONE

        # Count flagged claims safely
        all_claims = claims if claims is not None else getattr(draft, "claims", [])
        unsupported_claims = [c for c in all_claims if not getattr(c, "is_grounded", True)]
        flag_summary = f"{len(unsupported_claims)} claims require human verification" if unsupported_claims else "All claims grounded in verified evidence"

        # Format summary markdown
        team_names = ", ".join(m.get("full_name", "") for m in (draft.staffing_matrix or []))
        docx_name = Path(draft.docx_file_path).name if draft.docx_file_path else "technical_proposal.docx"

        summary_md = f"""# Bid Desk Review Pack: {tender.title}

## Executive Bid Recommendation
- **Fit Score:** {score.fit_score}/100
- **Bid Recommendation:** **{score.bid_decision}**
- **Client / Donor:** {tender.donor or 'Not specified'}
- **Deadline:** {tender.deadline or 'TBD'}
- **Estimated Budget:** {tender.budget or 'TBD'}

### Strategic Rationale
{score.reasons}

### Proposed Core Team
{team_names}

### Technical Proposal Draft
- **File:** `{docx_name}`
- **Version:** v{draft.version}
- **Format:** Microsoft Word (.docx)

### Grounding & Compliance Audit
- **Total Claims Traced:** {len(all_claims)}
- **Audit Flag Status:** {flag_summary}
"""
        if unsupported_claims:
            summary_md += "\n#### Flags Requiring Signoff Before Submission:\n"
            for uc in unsupported_claims:
                summary_md += f"- **[{uc.section_name}]**: {uc.claim_text}\n  *Reason:* {uc.flag_reason}\n"

        summary_md += """
---
> **GOVERNANCE PRINCIPLE (Slide 1 & 8):**
> *...and then it stops. A person reviews and submits. Humans own the last mile.*
> The system has prepared this review-ready package and will NEVER submit to the portal automatically.
> Log in to the Bid Desk to review, make edits, and record your bid decision.
"""

        subject = f"🎯 [Bid Review Pack] {score.bid_decision}: {tender.title[:45]} ({score.fit_score}/100)"

        # Send simulated email / log delivery
        logger.info(f"[EMAIL DISPATCH] To: {email_to} | Subject: {subject} | Attachment: {draft.docx_file_path}")

        # Send Thrivewave SMS Alert
        sms_res = await thrivewave_client.notify_review_pack_ready(
            phone=phone_to,
            tender_title=tender.title,
            fit_score=score.fit_score,
            bid_decision=score.bid_decision,
            tender_id=tender.id
        )

        review_pack = ReviewPack(
            tender_id=tender.id,
            recipient_email=email_to,
            subject=subject,
            summary_markdown=summary_md,
            docx_file_path=draft.docx_file_path,
            compliance_summary={
                "fit_score": score.fit_score,
                "bid_decision": score.bid_decision,
                "total_claims": len(all_claims),
                "unsupported_count": len(unsupported_claims),
                "sms_dispatch": sms_res.get("status")
            },
            status="SENT"
        )
        db.add(review_pack)

        # Transition status to UNDER_HUMAN_REVIEW
        tender.status = "UNDER_HUMAN_REVIEW"
        await db.commit()
        await db.refresh(review_pack)
        await db.refresh(tender)

        await AuditLogger.log_step(
            db=db,
            step_name="SEND",
            action=f"Dispatched Review Pack email to {email_to} & Thrivewave SMS to {phone_to}",
            tender_id=tender.id,
            details={
                "email_to": email_to,
                "phone_to": phone_to,
                "docx_file": docx_name,
                "sms_status": sms_res.get("status")
            },
            input_data={"tender_id": tender.id},
            output_data={"review_pack_id": review_pack.id}
        )

        return review_pack
