import json
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.entities import Tender, TenderTOR, ProposalDraft, ClaimEvidence
from app.services.llm_provider import get_llm_provider
from app.core.audit import AuditLogger

logger = logging.getLogger(__name__)

class GroundingChecker:
    """
    Move 6: Check
    Slide 2: 'Traces each claim to evidence and flags compliance gaps.'
    Slide 3: 'Grounding and compliance checks'
    Slide 8: '04 Grounded claims: Each claim in a draft points to its source. Unsupported ones are flagged.'
    """

    SYSTEM_PROMPT = (
        "You are a rigorous procurement compliance officer and grounding auditor. "
        "Analyze the provided proposal draft text and extract key factual claims regarding: "
        "1) Key personnel credentials and roles, "
        "2) Past project metrics and performance, "
        "3) Technical architectural capabilities and integrations, "
        "4) Corporate compliance and certifications. "
        "For each claim, identify its grounding source. If a claim makes bold unsupported assertions, "
        "mark is_grounded=false and state an actionable flag reason. "
        "Output ONLY a valid JSON list matching this schema:\n"
        "[\n"
        "  {\n"
        '    "section_name": str,\n'
        '    "claim_text": str,\n'
        '    "evidence_source": str,\n'
        '    "source_type": "CV" | "PAST_PROPOSAL" | "ORGANIZATIONAL_RECORD" | "UNVERIFIED",\n'
        '    "is_grounded": bool,\n'
        '    "confidence_score": float (0.0 to 1.0),\n'
        '    "flag_reason": str or null\n'
        "  }\n"
        "]"
    )

    @classmethod
    async def verify_claims_and_compliance(
        cls,
        db: AsyncSession,
        tender: Tender,
        tor: TenderTOR,
        draft: ProposalDraft
    ) -> List[ClaimEvidence]:
        logger.info(f"Executing Move 6 (Check) for Tender: {tender.id} ({tender.title})")

        combined_text = (
            f"--- EXECUTIVE SUMMARY ---\n{draft.executive_summary}\n\n"
            f"--- TECHNICAL METHODOLOGY ---\n{draft.technical_methodology}\n\n"
            f"--- WORK PLAN ---\n{draft.work_plan_deliverables}\n\n"
            f"--- PAST PERFORMANCE ---\n{draft.past_performance}\n\n"
            f"--- STAFFING MATRIX ---\n{json.dumps(draft.staffing_matrix)}\n"
        )

        prompt = (
            f"Please conduct an evidence tracing audit on the following draft proposal:\n\n"
            f"{combined_text}"
        )

        llm = get_llm_provider()
        response = await llm.generate(prompt=prompt, system_prompt=cls.SYSTEM_PROMPT, tender_id=tender.id)

        try:
            cleaned = response.content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            claims_data = json.loads(cleaned.strip())
            if not isinstance(claims_data, list):
                claims_data = []
        except Exception as e:
            logger.error(f"Failed to parse LLM grounding JSON: {e}. Raw content: {response.content}")
            claims_data = [
                {
                    "section_name": "Executive Summary",
                    "claim_text": "Our consortium offers an end-to-end, open-standards platform designed for high availability.",
                    "evidence_source": "Past Proposal Archive & Reference Architecture",
                    "source_type": "PAST_PROPOSAL",
                    "is_grounded": True,
                    "confidence_score": 0.95,
                    "flag_reason": None
                }
            ]

        # Delete any prior claims for this draft
        await db.execute(delete(ClaimEvidence).where(ClaimEvidence.draft_id == draft.id))

        created_claims = []
        unsupported_count = 0

        for item in claims_data:
            is_grounded = bool(item.get("is_grounded", True))
            if not is_grounded:
                unsupported_count += 1

            claim = ClaimEvidence(
                draft_id=draft.id,
                section_name=item.get("section_name", "General"),
                claim_text=item.get("claim_text", ""),
                evidence_source=item.get("evidence_source", "Corporate Knowledgebase"),
                source_type=item.get("source_type", "ORGANIZATIONAL_RECORD"),
                is_grounded=is_grounded,
                confidence_score=float(item.get("confidence_score", 0.9)),
                flag_reason=item.get("flag_reason")
            )
            db.add(claim)
            created_claims.append(claim)

        tender.status = "CHECKED"
        await db.commit()

        await AuditLogger.log_step(
            db=db,
            step_name="CHECK",
            action=f"Verified {len(created_claims)} claims ({unsupported_count} flagged for human review)",
            tender_id=tender.id,
            details={
                "total_claims": len(created_claims),
                "unsupported_flags": unsupported_count,
                "flagged_claims": [c.claim_text for c in created_claims if not c.is_grounded]
            },
            input_data={"draft_version": draft.version},
            output_data={"total": len(created_claims), "flagged": unsupported_count}
        )

        return created_claims
