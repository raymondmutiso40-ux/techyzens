import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(String, primary_key=True, default=generate_uuid)
    reference_code = Column(String, unique=True, index=True)
    title = Column(String, nullable=False, index=True)
    source_name = Column(String, nullable=False, default="Uploaded TOR")
    source_url = Column(String, nullable=True)
    donor = Column(String, nullable=True)  # e.g., UNDP, World Bank, USAID
    deadline = Column(String, nullable=True)
    budget = Column(String, nullable=True)
    country = Column(String, nullable=True)
    raw_document_path = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)

    # State Machine: 7 Moves + Human Review & Decision
    # DISCOVERED -> EXTRACTED -> SCORED -> MATCHED -> DRAFTED -> CHECKED -> REVIEW_PACK_SENT -> UNDER_HUMAN_REVIEW -> [APPROVED_TO_BID / REJECTED] -> SUBMITTED_BY_HUMAN
    status = Column(String, default="DISCOVERED", index=True)
    bid_decision = Column(String, nullable=True)  # BID, NO_BID, CAUTION
    fit_score = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    tor = relationship("TenderTOR", back_populates="tender", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    score = relationship("TenderScore", back_populates="tender", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    drafts = relationship("ProposalDraft", back_populates="tender", cascade="all, delete-orphan", lazy="selectin")
    audit_logs = relationship("AuditLog", back_populates="tender", cascade="all, delete-orphan", lazy="selectin")
    spend_records = relationship("SpendRecord", back_populates="tender", cascade="all, delete-orphan", lazy="selectin")
    review_packs = relationship("ReviewPack", back_populates="tender", cascade="all, delete-orphan", lazy="selectin")

class TenderTOR(Base):
    __tablename__ = "tender_tors"

    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False, unique=True)
    scope_summary = Column(Text, nullable=False)
    objectives = Column(JSON, default=list)  # list of str
    eligibility_criteria = Column(JSON, default=list)  # list of str
    evaluation_criteria = Column(JSON, default=list)  # dict or list of {criterion, weight}
    deliverables = Column(JSON, default=list)  # list of str
    key_skills_required = Column(JSON, default=list)  # list of str
    mandatory_requirements = Column(JSON, default=list)  # list of str
    raw_extracted_json = Column(JSON, default=dict)
    extracted_at = Column(DateTime(timezone=True), default=utc_now)

    tender = relationship("Tender", back_populates="tor")

class TenderScore(Base):
    __tablename__ = "tender_scores"

    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False, unique=True)
    fit_score = Column(Integer, nullable=False)  # 0 to 100
    bid_decision = Column(String, nullable=False)  # BID, NO_BID, CAUTION
    reasons = Column(Text, nullable=False)
    capability_fit_score = Column(Integer, default=0)
    strategic_alignment_score = Column(Integer, default=0)
    compliance_risk = Column(String, default="LOW")  # LOW, MEDIUM, HIGH
    pros = Column(JSON, default=list)
    risks = Column(JSON, default=list)
    disqualifiers = Column(JSON, default=list)
    scored_at = Column(DateTime(timezone=True), default=utc_now)

    tender = relationship("Tender", back_populates="score")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String, nullable=False)
    role_title = Column(String, nullable=False)
    email = Column(String, nullable=False)
    years_of_experience = Column(Integer, default=0)
    bio = Column(Text, nullable=False)
    skills = Column(JSON, default=list)
    education = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    past_projects = Column(JSON, default=list)
    cv_document_path = Column(String, nullable=True)
    embedding = Column(JSON, nullable=True)  # vector representation for similarity search

class PastProposal(Base):
    __tablename__ = "past_proposals"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    client_donor = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    win_status = Column(String, default="WON")  # WON, LOST
    abstract = Column(Text, nullable=False)
    key_methodology = Column(Text, nullable=False)
    team_composition = Column(JSON, default=list)
    full_text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)

class ProposalDraft(Base):
    __tablename__ = "proposal_drafts"

    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False)
    template_type = Column(String, default="TECHNICAL_PROPOSAL")  # TECHNICAL_PROPOSAL, EOI
    title = Column(String, nullable=False)
    version = Column(Integer, default=1)
    executive_summary = Column(Text, nullable=False)
    context_understanding = Column(Text, nullable=False)
    technical_methodology = Column(Text, nullable=False)
    work_plan_deliverables = Column(Text, nullable=False)
    staffing_matrix = Column(JSON, default=list)  # Matched team members + rationale
    past_performance = Column(Text, nullable=False)
    compliance_matrix = Column(JSON, default=list)  # Checklist of required TOR items
    docx_file_path = Column(String, nullable=True)
    is_human_edited = Column(Boolean, default=False)
    human_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    tender = relationship("Tender", back_populates="drafts")
    claims = relationship("ClaimEvidence", back_populates="draft", cascade="all, delete-orphan", lazy="selectin")

class ClaimEvidence(Base):
    __tablename__ = "claim_evidences"

    id = Column(String, primary_key=True, default=generate_uuid)
    draft_id = Column(String, ForeignKey("proposal_drafts.id"), nullable=False)
    section_name = Column(String, nullable=False)
    claim_text = Column(Text, nullable=False)
    evidence_source = Column(String, nullable=False)
    source_type = Column(String, default="CV")  # CV, PAST_PROPOSAL, EXTERNAL, UNVERIFIED
    is_grounded = Column(Boolean, default=True)
    confidence_score = Column(Float, default=1.0)
    flag_reason = Column(String, nullable=True)

    draft = relationship("ProposalDraft", back_populates="claims")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=True)
    step_name = Column(String, nullable=False)  # FIND, EXTRACT, SCORE, MATCH, DRAFT, CHECK, SEND, HUMAN_DECISION
    actor = Column(String, nullable=False, default="SYSTEM_AI")
    action = Column(String, nullable=False)
    details = Column(JSON, default=dict)
    input_hash = Column(String, nullable=True)
    output_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    tender = relationship("Tender", back_populates="audit_logs")

class SpendRecord(Base):
    __tablename__ = "spend_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=True)
    operation = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    tender = relationship("Tender", back_populates="spend_records")

class ReviewPack(Base):
    __tablename__ = "review_packs"

    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False)
    recipient_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    summary_markdown = Column(Text, nullable=False)
    docx_file_path = Column(String, nullable=True)
    compliance_summary = Column(JSON, default=dict)
    status = Column(String, default="SENT")  # PREVIEWED, SENT, FAILED
    sent_at = Column(DateTime(timezone=True), default=utc_now)

    tender = relationship("Tender", back_populates="review_packs")
