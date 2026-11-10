import json
import logging
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.entities import Tender, TenderTOR, ProposalDraft, ClaimEvidence
from app.services.llm_provider import get_llm_provider
from app.services.docx_builder import DocxProposalBuilder
from app.core.config import get_settings
from app.core.audit import AuditLogger
from app.services.supabase_storage import is_configured as storage_is_configured, upload_local_file

logger = logging.getLogger(__name__)

class ProposalDrafter:
    """
    Move 5: Draft
    Slide 2: 'Writes a Word technical proposal or EOI from your templates.'
    Slide 3: 'Drafting engine: your templates and past wording'
    Slide 5: 'Word (.docx) export from your templates'
    """

    SYSTEM_PROMPT = (
        "You are a careful proposal writer. Use only facts explicitly present in the tender and supplied company records. "
        "Never invent personnel, qualifications, certifications, clients, donor relationships, project references, results, "
        "metrics, policies, compliance status, or past performance. Do not turn an absence of evidence into a positive claim. "
        "When information is missing, write a concise placeholder such as 'Information required from the bidder' or "
        "'No verified company record was provided'. Distinguish proposed methods from proven experience. "
        "Do not claim that a requirement is compliant unless supporting evidence is explicitly supplied. "
        "Output ONLY valid JSON with the following structure:\n"
        "{\n"
        '  "executive_summary": str,\n'
        '  "context_understanding": str,\n'
        '  "technical_methodology": str,\n'
        '  "work_plan_deliverables": str,\n'
        '  "past_performance": str\n'
        "}"
    )

    @classmethod
    async def generate_draft(
        cls,
        db: AsyncSession,
        tender: Tender,
        tor: TenderTOR,
        match_data: dict,
        template_type: str = "TECHNICAL_PROPOSAL"
    ) -> ProposalDraft:
        logger.info(f"Executing Move 5 (Draft) for Tender: {tender.id} ({tender.title})")
        settings = get_settings()

        team_shortlist = match_data.get("team_shortlist", [])
        matched_proposals = match_data.get("matched_proposals", [])

        team_summary = "\n".join(
            f"- {m['full_name']} ({m['role_title']}, {m['years_of_experience']} yrs): {', '.join(m['key_skills'])}"
            for m in team_shortlist
        )
        prop_summary = "\n".join(
            f"- {p['title']} ({p['donor']}, {p['sector']}): {p['key_methodology']}"
            for p in matched_proposals
        )

        prompt = (
            f"Tender Title: {tender.title}\n"
            f"Client / Donor: {tender.donor or 'International Donor'}\n"
            f"Target Region: {tender.country or 'East Africa Regional'}\n"
            f"Scope Summary: {tor.scope_summary}\n\n"
            f"Key Objectives to Address:\n" + "\n".join(f"- {o}" for o in tor.objectives) + "\n\n"
            f"Proposed Key Personnel:\n{team_summary}\n\n"
            f"Past Winning Precedents & Wording:\n{prop_summary}\n\n"
            "Write the proposal sections using only the supplied facts. "
            "For past performance, refer only to the supplied past proposal records; if none are supplied, say that "
            "verified project references are required. For personnel, do not invent names, years, credentials or skills. "
            "Do not claim the bidder has a team, certifications or donor track record unless the records above establish it. "
            "Clearly mark assumptions and information gaps for human completion."
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
            logger.error(f"Failed to parse LLM drafting JSON: {e}. Raw content: {response.content}")
            data = {
                "executive_summary": (
                    f"This draft responds to {tender.title}. "
                    "Bidder-specific credentials and supporting company information must be completed and verified."
                ),
                "context_understanding": (
                    f"The tender concerns {tor.scope_summary or tender.title}. "
                    "The bidder should validate this interpretation against the complete Terms of Reference."
                ),
                "technical_methodology": (
                    "A project-specific methodology must be completed against the confirmed scope, "
                    "deliverables, dependencies and acceptance criteria in the Terms of Reference."
                ),
                "work_plan_deliverables": (
                    "A dated work plan and deliverables schedule must be completed after confirming the "
                    "contract duration, milestones and resource availability."
                ),
                "past_performance": "No verified company past-performance records were supplied. Add relevant references before submission."
            }

        # Past performance must be derived from supplied records, never invented by the language model.
        if matched_proposals:
            data["past_performance"] = (
                "The following records were found in the supplied past-proposal library. "
                "Verify client permission, project scope and reference details before submission:\n"
                + "\n".join(
                    f"- {p.get('title', 'Untitled project')} | "
                    f"{p.get('donor', p.get('client_donor', 'Client not recorded'))} | "
                    f"{p.get('sector', 'Sector not recorded')}: "
                    f"{p.get('key_methodology', 'No methodology summary recorded')}"
                    for p in matched_proposals
                )
            )
        else:
            data["past_performance"] = (
                "INFORMATION REQUIRED: No verified past-performance records were found in the supplied "
                "company records. Add relevant project references and supporting evidence before submission."
            )

        # Compliance is not presumed. No evidence in this workflow means NOT_VERIFIED.
        compliance_matrix = []
        for req in (tor.mandatory_requirements or []):
            compliance_matrix.append({
                "requirement": req,
                "status": "NOT_VERIFIED",
                "evidence": "No supporting evidence was supplied in the company records. Human verification required."
            })

        # Check existing draft
        res = await db.execute(select(ProposalDraft).where(ProposalDraft.tender_id == tender.id))
        draft = res.scalar_one_or_none()

        version = 1
        if draft:
            version = draft.version + 1

        docx_filename = f"{tender.id[:8]}_{template_type.lower()}_v{version}.docx"
        docx_path = str(settings.DRAFTS_DIR / docx_filename)

        if not draft:
            draft = ProposalDraft(
                tender_id=tender.id,
                template_type=template_type,
                title=f"Technical Proposal: {tender.title}",
                version=version,
                executive_summary=data.get("executive_summary", ""),
                context_understanding=data.get("context_understanding", ""),
                technical_methodology=data.get("technical_methodology", ""),
                work_plan_deliverables=data.get("work_plan_deliverables", ""),
                staffing_matrix=team_shortlist,
                past_performance=data.get("past_performance", ""),
                compliance_matrix=compliance_matrix,
                docx_file_path=docx_path
            )
            db.add(draft)
        else:
            draft.template_type = template_type
            draft.title = f"Technical Proposal: {tender.title}"
            draft.version = version
            draft.executive_summary = data.get("executive_summary", draft.executive_summary)
            draft.context_understanding = data.get("context_understanding", draft.context_understanding)
            draft.technical_methodology = data.get("technical_methodology", draft.technical_methodology)
            draft.work_plan_deliverables = data.get("work_plan_deliverables", draft.work_plan_deliverables)
            draft.staffing_matrix = team_shortlist
            draft.past_performance = data.get("past_performance", draft.past_performance)
            draft.compliance_matrix = compliance_matrix
            draft.docx_file_path = docx_path

        # Generate the physical Word .docx document
        DocxProposalBuilder.generate_docx(
            draft=draft,
            tender=tender,
            tor=tor,
            output_path=docx_path
        )

        if storage_is_configured():
            draft.docx_file_path = await upload_local_file(
                f"drafts/{docx_filename}",
                docx_path,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            Path(docx_path).unlink(missing_ok=True)

        tender.status = "DRAFTED"
        await db.commit()
        await db.refresh(draft)
        await db.refresh(tender)

        await AuditLogger.log_step(
            db=db,
            step_name="DRAFT",
            action=f"Generated Word proposal draft v{version} ({docx_filename})",
            tender_id=tender.id,
            details={"version": version, "template": template_type, "docx_path": draft.docx_file_path},
            input_data={"team_count": len(team_shortlist)},
            output_data={"draft_id": draft.id, "file": docx_filename}
        )

        return draft
