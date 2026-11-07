import asyncio
import json
from pathlib import Path
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, init_db
from app.models.entities import Tender
from app.services.orchestrator import PipelineOrchestrator

async def run_demo():
    print("=" * 80)
    print("BIDDESK AI - AUTONOMOUS BID INTELLIGENCE PIPELINE DEMO")
    print("Based on Janet's Bid Desk Specification (October 2026)")
    print("=" * 80)

    await init_db()

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Tender).order_by(Tender.created_at.asc()))
        tenders = res.scalars().all()
        if not tenders:
            print("No tenders found. Please run 'scripts/seed_database.py' first.")
            return

        target_tender = tenders[0]
        print(f"\n[TARGET TENDER SELECTED]")
        print(f"ID: {target_tender.id}")
        print(f"Reference: {target_tender.reference_code}")
        print(f"Title: {target_tender.title}")
        print(f"Donor: {target_tender.donor}")
        print(f"Budget: {target_tender.budget}")
        print("-" * 80)

        print("\n🚀 Executing 7 Moves from Tender Notice to Review-Ready Draft...")
        report = await PipelineOrchestrator.run_full_pipeline(
            db=db,
            tender_id=target_tender.id,
            template_type="TECHNICAL_PROPOSAL",
            recipient_email="janet@acme-consulting.org",
            recipient_phone="+1234567890"
        )

        print("\n" + "=" * 80)
        print("PIPELINE EXECUTION SUMMARY REPORT")
        print("=" * 80)
        print(f"• Tender Title:        {report['title']}")
        print(f"• Current Status:      {report['status']}")
        print(f"• AI Fit Score:        {report['fit_score']}/100")
        print(f"• Bid Recommendation:  {report['bid_decision']}")
        print(f"• Team Shortlisted:    {report['team_shortlist_count']} Key Personnel")
        print(f"• Grounded Claims:     {report['claims_total']} traced ({report['claims_flagged']} flagged for verification)")
        print(f"• Generated Word Doc:  {report['docx_path']}")
        print(f"• Review Pack ID:      {report['review_pack_id']}")
        print(f"• Daily Spend:         ${report['spend_summary']['daily_spend_usd']:.4f} / ${report['spend_summary']['daily_cap_usd']:.2f}")

        print("\n" + "-" * 80)
        print("CRITICAL GOVERNANCE CHECK (Slide 1 & 8):")
        print(f"📢 \"{report['governance_rule']}\"")
        print("The system has STOPPED at the draft stage. No submission was made.")
        print("-" * 80)

        # Simulate human sign-off
        print("\n[SIMULATING HUMAN REVIEWER DECISION GATE]")
        decision_report = await PipelineOrchestrator.record_human_decision(
            db=db,
            tender_id=target_tender.id,
            decision="APPROVED_TO_BID",
            reviewer_name="Janet (Bid Director)",
            reviewer_email="janet@acme-consulting.org",
            comments="Proposal methodology is exceptionally strong. Team allocation approved. Ready for partner signoff."
        )
        print(f"✅ Human Decision Recorded: {decision_report['decision']}")
        print(f"👤 Reviewer: {decision_report['reviewer']}")
        print(f"📝 Final Tender Status: {decision_report['status']}")
        print(f"📱 Thrivewave SMS confirmation dispatched.")
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_demo())
