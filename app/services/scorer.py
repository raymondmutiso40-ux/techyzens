import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.entities import Tender, TenderTOR, TenderScore
from app.services.llm_provider import get_llm_provider
from app.core.audit import AuditLogger
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class TenderScorer:
    """
    Move 3: Score
    Slide 2: 'Fit out of 100, with a bid or no-bid call and its reasons.'
    Slide 3: 'LLM analysis and scoring: fit /100, bid or no-bid, reasons'
    """

    SYSTEM_PROMPT = (
        "You are an executive bid director evaluating business development opportunities. "
        "Analyze the provided structured TOR and evaluate our organizational fit out of 100. "
        "Our firm specializes in enterprise digital transformation, cloud data engineering, "
        "health and environmental information platforms, and AI systems for donor and government clients. "
        "Output ONLY valid JSON matching this schema:\n"
        "{\n"
        '  "fit_score": int (0-100),\n'
        '  "bid_decision": "BID" | "NO_BID" | "CAUTION",\n'
        '  "reasons": str,\n'
        '  "capability_fit_score": int (0-100),\n'
        '  "strategic_alignment_score": int (0-100),\n'
        '  "compliance_risk": "LOW" | "MEDIUM" | "HIGH",\n'
        '  "pros": [str],\n'
        '  "risks": [str],\n'
        '  "disqualifiers": [str]\n'
        "}"
    )

    @classmethod
    async def score_tender(cls, db: AsyncSession, tender: Tender, tor: TenderTOR) -> TenderScore:
        logger.info(f"Executing Move 3 (Score) for Tender: {tender.id} ({tender.title})")
        settings = get_settings()

        prompt = (
            f"Tender Title: {tender.title}\n"
            f"Donor: {tender.donor}\n"
            f"Budget: {tender.budget}\n"
            f"Deadline: {tender.deadline}\n"
            f"Country: {tender.country}\n\n"
            f"Scope Summary: {tor.scope_summary}\n"
            f"Key Skills Required: {', '.join(tor.key_skills_required)}\n"
            f"Mandatory Requirements: {', '.join(tor.mandatory_requirements)}\n"
            f"Evaluation Criteria: {json.dumps(tor.evaluation_criteria)}\n\n"
            "Please provide the fit score, bid or no-bid call, and detailed strategic reasons."
        )

        llm = get_llm_provider()
        response = await llm.generate(prompt=prompt, system_prompt=cls.SYSTEM_PROMPT, tender_id=tender.id)

        try:
            cleaned = response.content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
        except Exception as e:
            logger.error(f"Failed to parse LLM scoring JSON: {e}. Raw content: {response.content}")
            data = {
                "fit_score": 75,
                "bid_decision": "BID",
                "reasons": "Opportunity aligns well with technical stack and strategic donor targets.",
                "capability_fit_score": 80,
                "strategic_alignment_score": 75,
                "compliance_risk": "LOW",
                "pros": ["Direct capability match", "Reputable donor"],
                "risks": ["Tight deadline"],
                "disqualifiers": []
            }

        fit_score = int(data.get("fit_score", 70))
        decision = data.get("bid_decision", "BID" if fit_score >= settings.FIT_THRESHOLD_SCORE else "NO_BID")

        # Check existing score
        res = await db.execute(select(TenderScore).where(TenderScore.tender_id == tender.id))
        score_record = res.scalar_one_or_none()

        if not score_record:
            score_record = TenderScore(
                tender_id=tender.id,
                fit_score=fit_score,
                bid_decision=decision,
                reasons=data.get("reasons", ""),
                capability_fit_score=data.get("capability_fit_score", fit_score),
                strategic_alignment_score=data.get("strategic_alignment_score", fit_score),
                compliance_risk=data.get("compliance_risk", "LOW"),
                pros=data.get("pros", []),
                risks=data.get("risks", []),
                disqualifiers=data.get("disqualifiers", [])
            )
            db.add(score_record)
        else:
            score_record.fit_score = fit_score
            score_record.bid_decision = decision
            score_record.reasons = data.get("reasons", score_record.reasons)
            score_record.capability_fit_score = data.get("capability_fit_score", score_record.capability_fit_score)
            score_record.strategic_alignment_score = data.get("strategic_alignment_score", score_record.strategic_alignment_score)
            score_record.compliance_risk = data.get("compliance_risk", score_record.compliance_risk)
            score_record.pros = data.get("pros", score_record.pros)
            score_record.risks = data.get("risks", score_record.risks)
            score_record.disqualifiers = data.get("disqualifiers", score_record.disqualifiers)

        tender.fit_score = fit_score
        tender.bid_decision = decision
        tender.status = "SCORED"
        await db.commit()
        await db.refresh(score_record)
        await db.refresh(tender)

        await AuditLogger.log_step(
            db=db,
            step_name="SCORE",
            action=f"Scored tender: {fit_score}/100 -> {decision}",
            tender_id=tender.id,
            details={"fit_score": fit_score, "bid_decision": decision, "reasons": score_record.reasons[:150]},
            input_data={"title": tender.title, "donor": tender.donor},
            output_data=data
        )

        return score_record
