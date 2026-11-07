from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Tender Schemas ---
class TenderBase(BaseModel):
    title: str
    source_name: str = "Uploaded TOR"
    source_url: Optional[str] = None
    donor: Optional[str] = None
    deadline: Optional[str] = None
    budget: Optional[str] = None
    country: Optional[str] = None

class TenderCreate(TenderBase):
    reference_code: Optional[str] = None
    raw_text: Optional[str] = None

class TenderResponse(TenderBase):
    id: str
    reference_code: Optional[str] = None
    status: str
    bid_decision: Optional[str] = None
    fit_score: Optional[int] = None
    fitScore: Optional[int] = None
    stage: Optional[str] = None
    recommendation: Optional[str] = None
    strengths: List[str] = []
    risks: List[str] = []
    tor: Optional[Any] = None
    matchedTeam: Optional[List[Dict[str, Any]]] = None
    missingExpertise: Optional[List[str]] = None
    humanDecision: Optional[Dict[str, Any]] = None
    outcome: Optional[Dict[str, Any]] = None
    submittedAt: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="allow")
# --- TOR Schemas ---
class TORResponse(BaseModel):
    id: str
    tender_id: str
    scope_summary: str
    objectives: List[str] = []
    eligibility_criteria: List[str] = []
    evaluation_criteria: List[Dict[str, Any]] = []
    deliverables: List[str] = []
    key_skills_required: List[str] = []
    mandatory_requirements: List[str] = []
    extracted_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Score Schemas ---
class ScoreResponse(BaseModel):
    id: str
    tender_id: str
    fit_score: int
    bid_decision: str
    reasons: str
    capability_fit_score: int
    strategic_alignment_score: int
    compliance_risk: str
    pros: List[str] = []
    risks: List[str] = []
    disqualifiers: List[str] = []
    scored_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Team & CV Schemas ---
class TeamMemberBase(BaseModel):
    full_name: str
    role_title: str
    email: str
    years_of_experience: int
    bio: str
    skills: List[str] = []
    education: List[str] = []
    certifications: List[str] = []
    past_projects: List[str] = []

class TeamMemberCreate(TeamMemberBase):
    raw_cv_text: Optional[str] = None

class TeamMemberResponse(TeamMemberBase):
    id: str
    cv_document_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Past Proposal Schemas ---
class PastProposalCreate(BaseModel):
    title: str
    client_donor: str
    sector: str
    win_status: str = "WON"
    abstract: str
    key_methodology: str
    team_composition: List[str] = []
    full_text: str

class PastProposalResponse(PastProposalCreate):
    id: str

    model_config = ConfigDict(from_attributes=True)

# --- Draft & Claims Schemas ---
class ClaimEvidenceResponse(BaseModel):
    id: str
    section_name: str
    claim_text: str
    evidence_source: str
    source_type: str
    is_grounded: bool
    confidence_score: float
    flag_reason: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class ProposalDraftResponse(BaseModel):
    id: str
    tender_id: str
    template_type: str
    title: str
    version: int
    executive_summary: str
    context_understanding: str
    technical_methodology: str
    work_plan_deliverables: str
    staffing_matrix: List[Dict[str, Any]] = []
    past_performance: str
    compliance_matrix: List[Dict[str, Any]] = []
    docx_file_path: Optional[str] = None
    is_human_edited: bool = False
    human_notes: Optional[str] = None
    claims: List[ClaimEvidenceResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProposalDraftUpdate(BaseModel):
    executive_summary: Optional[str] = None
    context_understanding: Optional[str] = None
    technical_methodology: Optional[str] = None
    work_plan_deliverables: Optional[str] = None
    past_performance: Optional[str] = None
    human_notes: Optional[str] = None

# --- Review & Governance Schemas ---
class HumanDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVED_TO_BID | REJECTED | REVISE | SUBMITTED_BY_HUMAN")
    reviewer_name: str
    reviewer_email: str
    comments: Optional[str] = None

class ReviewPackResponse(BaseModel):
    id: str
    tender_id: str
    recipient_email: str
    subject: str
    summary_markdown: str
    docx_file_path: Optional[str]
    compliance_summary: Dict[str, Any]
    status: str
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Spend & Audit Schemas ---
class SpendStatusResponse(BaseModel):
    date: str
    daily_spend_usd: float
    daily_cap_usd: float
    daily_remaining_usd: float
    daily_percent_used: float
    tender_id: Optional[str] = None
    tender_spend_usd: Optional[float] = None
    tender_cap_usd: Optional[float] = None
    tender_remaining_usd: Optional[float] = None
    tender_percent_used: Optional[float] = None

class AuditLogResponse(BaseModel):
    id: str
    tender_id: Optional[str]
    step_name: str
    actor: str
    action: str
    details: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
