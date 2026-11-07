from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import TeamMember, PastProposal
from app.models.schemas import TeamMemberCreate, TeamMemberResponse, PastProposalCreate, PastProposalResponse
from app.services.vector_store import vector_store

router = APIRouter(prefix="/team", tags=["Team CVs & Past Performance"])

@router.get("", response_model=List[TeamMemberResponse])
async def list_team_members(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(TeamMember))
    return res.scalars().all()

@router.post("", response_model=TeamMemberResponse)
async def create_team_member(member_in: TeamMemberCreate, db: AsyncSession = Depends(get_db)):
    member = TeamMember(
        full_name=member_in.full_name,
        role_title=member_in.role_title,
        email=member_in.email,
        years_of_experience=member_in.years_of_experience,
        bio=member_in.bio,
        skills=member_in.skills,
        education=member_in.education,
        certifications=member_in.certifications,
        past_projects=member_in.past_projects
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member

@router.get("/past-proposals", response_model=List[PastProposalResponse])
async def list_past_proposals(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PastProposal))
    return res.scalars().all()

@router.post("/past-proposals", response_model=PastProposalResponse)
async def create_past_proposal(prop_in: PastProposalCreate, db: AsyncSession = Depends(get_db)):
    proposal = PastProposal(
        title=prop_in.title,
        client_donor=prop_in.client_donor,
        sector=prop_in.sector,
        win_status=prop_in.win_status,
        abstract=prop_in.abstract,
        key_methodology=prop_in.key_methodology,
        team_composition=prop_in.team_composition,
        full_text=prop_in.full_text
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    return proposal
