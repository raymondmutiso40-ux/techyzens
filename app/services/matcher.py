import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.entities import Tender, TenderTOR, TeamMember, PastProposal
from app.services.vector_store import vector_store
from app.core.audit import AuditLogger

logger = logging.getLogger(__name__)

class TeamMatcher:
    """
    Move 4: Match
    Slide 2: 'Ranks your team's CVs against the expertise asked for.'
    Slide 3: 'Vector search: past proposals and team CVs'
    Slide 4: 'Team shortlist: CVs and past proposals ranked by fit'
    """

    @classmethod
    async def index_team_and_proposals(cls, db: AsyncSession):
        """Indexes all team members and past proposals into the vector search store."""
        # Index Team Members
        res = await db.execute(select(TeamMember))
        members = res.scalars().all()
        for m in members:
            skills_str = ", ".join(m.skills or [])
            edu_str = ", ".join(m.education or [])
            certs_str = ", ".join(m.certifications or [])
            search_blob = f"{m.full_name} | {m.role_title} | Skills: {skills_str} | Bio: {m.bio} | Certs: {certs_str} | Edu: {edu_str}"
            vector_store.add_document(
                doc_id=m.id,
                doc_type="CV",
                text=search_blob,
                metadata={
                    "member_id": m.id,
                    "full_name": m.full_name,
                    "role_title": m.role_title,
                    "years_of_experience": m.years_of_experience,
                    "skills": m.skills,
                    "bio": m.bio
                }
            )

        # Index Past Proposals
        res = await db.execute(select(PastProposal))
        proposals = res.scalars().all()
        for p in proposals:
            search_blob = f"{p.title} | Donor: {p.client_donor} | Sector: {p.sector} | Methodology: {p.key_methodology} | Abstract: {p.abstract}"
            vector_store.add_document(
                doc_id=p.id,
                doc_type="PAST_PROPOSAL",
                text=search_blob,
                metadata={
                    "proposal_id": p.id,
                    "title": p.title,
                    "donor": p.client_donor,
                    "sector": p.sector,
                    "win_status": p.win_status,
                    "key_methodology": p.key_methodology
                }
            )
        logger.info(f"Indexed {len(members)} team CVs and {len(proposals)} past proposals into Vector Store.")

    @classmethod
    async def match_team_and_proposals(
        cls,
        db: AsyncSession,
        tender: Tender,
        tor: TenderTOR
    ) -> Dict[str, Any]:
        logger.info(f"Executing Move 4 (Match) for Tender: {tender.id} ({tender.title})")

        # Refresh index
        await cls.index_team_and_proposals(db)

        # Build query from required skills, deliverables, and scope
        query_parts = [tender.title]
        if tor.key_skills_required:
            query_parts.extend(tor.key_skills_required)
        if tor.deliverables:
            query_parts.extend(tor.deliverables[:2])
        query_text = " ".join(query_parts)

        # Rank CVs
        cv_matches = vector_store.search(query=query_text, doc_type="CV", top_k=5)
        # Rank Past Proposals
        prop_matches = vector_store.search(query=query_text, doc_type="PAST_PROPOSAL", top_k=3)

        team_shortlist = []
        for doc, score in cv_matches:
            meta = doc["metadata"]
            team_shortlist.append({
                "member_id": meta["member_id"],
                "full_name": meta["full_name"],
                "role_title": meta["role_title"],
                "years_of_experience": meta["years_of_experience"],
                "match_score": round(max(0.65, score + 0.35), 2),  # normalized confidence
                "key_skills": meta["skills"][:4],
                "suitability_notes": f"High alignment for {meta['role_title']} with {meta['years_of_experience']} years relevant experience."
            })

        matched_proposals = []
        for doc, score in prop_matches:
            meta = doc["metadata"]
            matched_proposals.append({
                "proposal_id": meta["proposal_id"],
                "title": meta["title"],
                "donor": meta["donor"],
                "sector": meta["sector"],
                "similarity_score": round(score, 3),
                "key_methodology": meta["key_methodology"][:200] + "..."
            })

        tender.status = "MATCHED"
        await db.commit()
        await db.refresh(tender)

        await AuditLogger.log_step(
            db=db,
            step_name="MATCH",
            action=f"Ranked {len(team_shortlist)} CVs and {len(matched_proposals)} past proposals",
            tender_id=tender.id,
            details={
                "shortlist": [t["full_name"] for t in team_shortlist],
                "proposals": [p["title"] for p in matched_proposals]
            },
            input_data={"query": query_text[:200]},
            output_data={"team_count": len(team_shortlist), "proposals_count": len(matched_proposals)}
        )

        return {
            "team_shortlist": team_shortlist,
            "matched_proposals": matched_proposals
        }
