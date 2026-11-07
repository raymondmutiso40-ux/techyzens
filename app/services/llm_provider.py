import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.core.config import get_settings
from app.core.spend_guard import spend_guard, SpendCapExceededError
from app.core.prompt_guard import PromptGuard

logger = logging.getLogger(__name__)

class LLMResponse:
    def __init__(self, content: str, input_tokens: int, output_tokens: int, model: str, cost_usd: float):
        self.content = content
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.model = model
        self.cost_usd = cost_usd

class BaseLLMProvider:
    async def generate(self, prompt: str, system_prompt: str = "", tender_id: str = "general") -> LLMResponse:
        raise NotImplementedError

class MockLLMProvider(BaseLLMProvider):
    """
    Intelligent mock provider providing deterministic, domain-accurate outputs
    for testing, offline development, and CI without external API dependencies.
    """

    async def generate(self, prompt: str, system_prompt: str = "", tender_id: str = "general") -> LLMResponse:
        model = "mock-model"
        input_tokens = len(prompt.split()) + len(system_prompt.split())
        output_tokens = 450
        cost = spend_guard.calculate_cost(model, input_tokens, output_tokens)

        # Enforce spend caps
        spend_guard.check_allowance(tender_id, cost)
        spend_guard.record_usage(tender_id, model, input_tokens, output_tokens)

        # Route response based on prompt context
        lower_prompt = prompt.lower()

        if "extract" in lower_prompt or "structured tor" in lower_prompt:
            content = self._mock_extraction(prompt)
        elif "score the fit" in lower_prompt or "bid or no-bid" in lower_prompt:
            content = self._mock_scoring(prompt)
        elif "evidence tracing" in lower_prompt or "grounding" in lower_prompt or "claim" in lower_prompt:
            content = self._mock_grounding(prompt)
        elif "draft" in lower_prompt or "technical proposal" in lower_prompt:
            content = self._mock_drafting(prompt)
        else:
            content = json.dumps({"status": "success", "message": "Default mock LLM completion."})

        return LLMResponse(content=content, input_tokens=input_tokens, output_tokens=output_tokens, model=model, cost_usd=cost)

    def _mock_extraction(self, prompt: str) -> str:
        # Extract keywords if present in prompt
        title = "National Early Warning Systems & Climate Risk Dashboard"
        donor = "UNDP"
        if "world bank" in prompt.lower() or "health" in prompt.lower():
            title = "Federated National Health Information Exchange (HIE)"
            donor = "World Bank"
        elif "usaid" in prompt.lower() or "agri" in prompt.lower():
            title = "Digital Agriculture & AI-Driven Farmer Advisory System"
            donor = "USAID"

        return json.dumps({
            "title": title,
            "donor": donor,
            "deadline": "2026-12-15",
            "budget": "USD 450,000",
            "country": "Kenya / East Africa Regional",
            "scope_summary": "Full life-cycle engineering of an automated, scalable data pipeline and dashboard platform supporting predictive risk modeling and real-time alerts.",
            "objectives": [
                "Deploy a high-throughput ingestion pipeline for distributed sensor and satellite feeds",
                "Implement an automated alerting system delivering SMS and web notifications",
                "Deliver role-based analytics dashboards for regional meteorological officers",
                "Conduct certified training workshops for at least 50 government hydrologists"
            ],
            "eligibility_criteria": [
                "Firm must have at least 7 years verifiable experience in enterprise software & data engineering",
                "Proven track record of delivering at least 2 donor-funded public sector systems in the region",
                "Valid corporate registration and sound financial audit statements for the past 3 consecutive years"
            ],
            "evaluation_criteria": [
                {"criterion": "Technical Methodology & Proposed System Architecture", "weight": 40},
                {"criterion": "Key Personnel Qualifications & Team Composition", "weight": 30},
                {"criterion": "Past Performance & Institutional Capability", "weight": 20},
                {"criterion": "Project Work Plan & Deliverable Milestones", "weight": 10}
            ],
            "deliverables": [
                "Inception Report & System Architecture Specification (Month 1)",
                "Data Ingestion Pipeline & Cloud Data Lakehouse Core (Month 3)",
                "Early Warning Rule Engine & Multi-Channel Alert Dispatcher (Month 5)",
                "Interactive Web Dashboard & User Acceptance Testing (Month 7)",
                "Final System Handover, Source Code Repository & Training Manuals (Month 9)"
            ],
            "key_skills_required": [
                "Lead Solution Architect with 10+ years enterprise systems experience",
                "Senior Cloud Data Engineer (Python, PostgreSQL, Kafka/PubSub, Docker)",
                "Monitoring, Evaluation & Learning (MEL) Specialist with donor reporting track record",
                "Information Security & Governance Lead (ISO 27001)"
            ],
            "mandatory_requirements": [
                "ISO 9001 (Quality Management) or equivalent quality assurance process",
                "ISO 27001 (Information Security) compliance or strict data security policy",
                "Bid validity of 90 calendar days from submission deadline",
                "CVs of proposed key personnel in standard format with signed declarations"
            ]
        }, indent=2)

    def _mock_scoring(self, prompt: str) -> str:
        return json.dumps({
            "fit_score": 88,
            "bid_decision": "BID",
            "reasons": "Exceptional capability alignment with core data platform engineering competencies. The firm possesses strong in-house key personnel matching all mandatory profiles, verified past performance with UNDP/World Bank, and requisite ISO compliance.",
            "capability_fit_score": 92,
            "strategic_alignment_score": 85,
            "compliance_risk": "LOW",
            "pros": [
                "100% qualification match for proposed Team Lead (Dr. Amina Kadir) and Lead Data Engineer (Marcus Chen)",
                "Strong direct past performance: successfully delivered the Kenya Drought Monitoring Platform (2024)",
                "Budget range (USD 450k) matches our target engagement size and margin profile",
                "Client (UNDP) has an active institutional relationship with our team"
            ],
            "risks": [
                "Short 4-week window to finalize local partner teaming agreement",
                "Strict milestone penalty clauses for Inception Report delivery"
            ],
            "disqualifiers": []
        }, indent=2)

    def _mock_drafting(self, prompt: str) -> str:
        return json.dumps({
            "executive_summary": "We are pleased to submit our Technical Proposal for the National Early Warning Systems & Climate Risk Dashboard. Drawing on over a decade of proven experience deploying mission-critical data architectures across East Africa, our consortium offers an end-to-end, open-standards platform designed for high availability, sovereign data ownership, and rapid operational adoption.",
            "context_understanding": "The client requires a resilient, multi-hazard early warning architecture capable of aggregating disparate telemetry from radar stations, satellite feeds, and community sensor arrays. Given recurring drought and flood volatility in the target river basins, latency in alert dissemination directly impacts community resilience. Our proposed solution directly solves historical fragmentation by establishing a unified geospatial data lakehouse.",
            "technical_methodology": "Our architectural approach is structured into three integrated tiers:\n1. Ingestion & Normalization Engine: Automated ETL connectors pulling weather radar and hydrological gauge data into a secure PostgreSQL/PostGIS time-series data store.\n2. Analytics & Threshold Evaluation: Scalable rule engines executing predictive hydrological models with automated anomaly detection.\n3. Dissemination & Dashboard Tier: A responsive web portal offering role-based geospatial maps, combined with a high-throughput SMS gateway ensuring alert delivery even in low-bandwidth rural corridors.",
            "work_plan_deliverables": "The 9-month project timeline is managed under agile delivery milestones:\n- Month 1: Milestone 1 - Comprehensive Inception Report, Stakeholder Needs Assessment & Architecture Blueprint\n- Month 3: Milestone 2 - Ingestion Pipeline Deployment & Data Lakehouse Setup\n- Month 5: Milestone 3 - Real-Time Alert Engine & Multi-Channel Dispatch Modules\n- Month 7: Milestone 4 - Web Analytics Portal Deployment & Pilot User Testing\n- Month 9: Milestone 5 - User Acceptance Signoff, Capacity Building Workshops & Handover Documentation",
            "past_performance": "Our institutional capability is demonstrated by directly relevant past performance:\n1. Kenya National Drought Early Warning System (2023-2025): Deployed automated alerting across 23 arid counties, monitoring 4.2M people.\n2. Regional Disease Surveillance Data Exchange (2022-2024): Deployed federated FHIR-compliant health data pipeline across 14 referral hubs with 99.98% uptime."
        }, indent=2)

    def _mock_grounding(self, prompt: str) -> str:
        return json.dumps([
            {
                "section_name": "Technical Methodology",
                "claim_text": "The platform incorporates automated ETL connectors pulling weather radar into a PostgreSQL/PostGIS store.",
                "evidence_source": "Past Proposal: Kenya National Drought Early Warning System (Section 3.2)",
                "source_type": "PAST_PROPOSAL",
                "is_grounded": True,
                "confidence_score": 0.95,
                "flag_reason": None
            },
            {
                "section_name": "Staffing & Key Personnel",
                "claim_text": "Dr. Amina Kadir holds a PhD in Information Systems with 15+ years leading geospatial enterprise architectures.",
                "evidence_source": "CV: Dr. Amina Kadir (Education & Summary)",
                "source_type": "CV",
                "is_grounded": True,
                "confidence_score": 1.0,
                "flag_reason": None
            },
            {
                "section_name": "Compliance & Standards",
                "claim_text": "The consortium maintains active ISO 27001 Information Security certification.",
                "evidence_source": "Corporate Governance Repository (Cert-2024-ISO27001)",
                "source_type": "ORGANIZATIONAL_RECORD",
                "is_grounded": True,
                "confidence_score": 0.98,
                "flag_reason": None
            },
            {
                "section_name": "Local Presence",
                "claim_text": "Our permanent regional engineering office in Nairobi houses 30 full-time software engineers.",
                "evidence_source": "Unverified assertion in proposal text",
                "source_type": "UNVERIFIED",
                "is_grounded": False,
                "confidence_score": 0.40,
                "flag_reason": "Staff count in Nairobi office cannot be cross-referenced to team registry. Recommend verifying exact head count with HR before submission."
            }
        ], indent=2)

class ClaudeLLMProvider(BaseLLMProvider):
    """
    Anthropic Claude Provider (from Slide 5: 'Claude: Reads long TORs; does the analysis, scoring and drafting')
    """
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system_prompt: str = "", tender_id: str = "general") -> LLMResponse:
        # Check spend cap allowance
        est_cost = spend_guard.calculate_cost(self.model, len(prompt.split()) * 2, 2000)
        spend_guard.check_allowance(tender_id, est_cost)

        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": self.model,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": prompt}]
            }
            resp = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

            content = data["content"][0]["text"]
            input_tokens = data.get("usage", {}).get("input_tokens", len(prompt.split()))
            output_tokens = data.get("usage", {}).get("output_tokens", len(content.split()))
            cost = spend_guard.record_usage(tender_id, self.model, input_tokens, output_tokens)

            return LLMResponse(content=content, input_tokens=input_tokens, output_tokens=output_tokens, model=self.model, cost_usd=cost)

def get_llm_provider() -> BaseLLMProvider:
    settings = get_settings()
    if settings.LLM_PROVIDER == "claude" and settings.ANTHROPIC_API_KEY:
        return ClaudeLLMProvider(settings.ANTHROPIC_API_KEY, settings.CLAUDE_MODEL)
    return MockLLMProvider()
