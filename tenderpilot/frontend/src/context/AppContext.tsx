import { fetchTenders, recordDecisionOnApi, recordOutcomeOnApi, markSubmittedOnApi } from '../services/tenderService';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Tender,
  KBDocument,
  GeneratedProposal,
  AuditLogEntry,
  PipelineStage,
  TOR,
} from '../data/mockData';
import {
  initialDocuments,
  initialTenders,
  initialProposals,
  initialAuditLogs,
} from '../data/mockData';

interface UserProfile {
  name: string;
  phone: string;
  firmName: string;
  role: string;
  isLoggedIn: boolean;
}

interface AppContextType {
  user: UserProfile;
  login: (phone: string) => void;
  logout: () => void;
  documents: KBDocument[];
  addDocument: (doc: Omit<KBDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  deleteDocument: (id: string) => void;
  tenders: Tender[];
  addTenderFromTOR: (fileName: string, extractedTOR: TOR) => Tender;
  /** Add a tender returned by the backend (uploaded TOR file or imported link). */
  addImportedTender: (tender: Tender, origin: string) => void;
  /** Add a document the backend has already stored and indexed. */
  addIndexedDocument: (doc: KBDocument) => void;
  updateTenderStage: (tenderId: string, stage: PipelineStage) => void;
  recordDecision: (tenderId: string, decision: 'bid' | 'no_bid', notes?: string) => void;
  recordOutcome: (tenderId: string, outcome: 'won' | 'lost', learningNote: string) => void;
  markSubmittedByHuman: (tenderId: string) => void;
  swapConsultantOnTender: (tenderId: string, oldId: string, newDocId: string) => void;
  removeConsultantFromTender: (tenderId: string, consultantId: string) => void;
  proposals: GeneratedProposal[];
  createProposalForTender: (
    tenderId: string,
    templateType?: 'technical' | 'eoi'
  ) => GeneratedProposal;
  updateProposalContent: (proposalId: string, sectionId: string, newContent: string) => void;
  acknowledgeProposalChecks: (proposalId: string) => void;
  sendReviewPackForTender: (tenderId: string, recipients: string[]) => void;
  activeProposal: GeneratedProposal | null;
  setActiveProposal: (prop: GeneratedProposal | null) => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tp_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      name: 'Romano Juma',
      phone: '+254 712 345 678',
      firmName: 'Apex Advisory Group',
      role: 'Bid Director',
      isLoggedIn: true,
    };
  });

  const [documents, setDocuments] = useState<KBDocument[]>(() => {
    const saved = localStorage.getItem('tp_documents_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialDocuments;
  });

  const [tenders, setTenders] = useState<Tender[]>(() => {
    const saved = localStorage.getItem('tp_tenders_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialTenders;
  });

  const [proposals, setProposals] = useState<GeneratedProposal[]>(() => {
    const saved = localStorage.getItem('tp_proposals_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialProposals;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('tp_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialAuditLogs;
  });

  const [activeProposal, setActiveProposal] = useState<GeneratedProposal | null>(() => {
    return proposals[0] || null;
  });

  useEffect(() => {
    fetchTenders().then((apiTenders) => {
      if (apiTenders && apiTenders.length > 0) {
        setTenders((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newFromApi = apiTenders.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newFromApi];
        });
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('tp_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tp_documents_v2', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('tp_tenders_v2', JSON.stringify(tenders));
  }, [tenders]);

  useEffect(() => {
    localStorage.setItem('tp_proposals_v2', JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem('tp_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const login = (phone: string) => {
    setUser((prev) => ({
      ...prev,
      phone,
      isLoggedIn: true,
    }));
  };

  const logout = () => {
    setUser((prev) => ({
      ...prev,
      isLoggedIn: false,
    }));
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addDocument = (docData: Omit<KBDocument, 'id' | 'uploadedAt' | 'status'>) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newDoc: KBDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadedAt: now,
      status: 'Parsed & Indexed',
    };
    setDocuments((prev) => [newDoc, ...prev]);

    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'extracted',
      source: 'Knowledge Base',
      details: `Indexed document "${docData.name}" (${docData.type}).`,
    });
  };

  const addIndexedDocument = (doc: KBDocument) => {
    setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'extracted',
      source: 'Knowledge Base',
      details: `Uploaded and indexed "${doc.name}" (${doc.type}, ${doc.size}).`,
    });
  };

  const addImportedTender = (tender: Tender, origin: string) => {
    setTenders((prev) => [tender, ...prev.filter((t) => t.id !== tender.id)]);
    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'extracted',
      tenderId: tender.id,
      tenderTitle: tender.title,
      source: origin,
      details: `Tender added from ${origin}. Fit score ${tender.fitScore}/100.`,
    });
  };

  const deleteDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (doc) {
      addAuditLog({
        actor: 'user',
        actorName: user.name,
        event: 'edited',
        source: 'Knowledge Base',
        details: `Deleted document "${doc.name}".`,
      });
    }
  };

  const addTenderFromTOR = (fileName: string, extractedTOR: TOR): Tender => {
    const newId = `tender-${Date.now()}`;
    const newTender: Tender = {
      id: newId,
      referenceNumber: `EXTRACT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Consultancy for ${extractedTOR.requiredExpertise[0] || 'Technical Assistance'}`,
      agency: extractedTOR.donor,
      source: 'Uploaded TOR',
      region: 'East Africa',
      country: 'Regional',
      sector: 'Digital Transformation & IT',
      deadline: extractedTOR.deadline,
      budgetEst: extractedTOR.budget,
      fitScore: 84,
      recommendation: 'bid',
      reasons: {
        strengths: [
          'Direct alignment with firm advisory portfolio.',
          'Roster consultant covers 2 of 3 required expertise areas.'
        ],
        risks: [
          'Eligibility requires 3 years audited accounts.'
        ]
      },
      summary: `Automated extraction from uploaded TOR file "${fileName}".`,
      stage: 'extracted',
      tor: extractedTOR,
      teamMatching: {
        assigned: [
          {
            consultantId: documents[0]?.id || 'doc-1',
            consultantName: documents[0]?.consultantName || 'Dr. Sarah Chen',
            matchPercentage: 92,
            expertiseCovered: [extractedTOR.requiredExpertise[0] || 'Technical Advisory'],
          },
        ],
        gaps: extractedTOR.requiredExpertise.slice(1),
      },
    };

    setTenders((prev) => [newTender, ...prev]);

    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'extracted',
      tenderId: newId,
      tenderTitle: newTender.title,
      source: fileName,
      details: `Uploaded TOR parsed. Extracted ${extractedTOR.evaluationCriteria.length} evaluation criteria.`,
    });

    return newTender;
  };

  const updateTenderStage = (tenderId: string, stage: PipelineStage) => {
    setTenders((prev) =>
      prev.map((t) => (t.id === tenderId ? { ...t, stage } : t))
    );
  };

  const recordDecision = (tenderId: string, decision: 'bid' | 'no_bid', notes?: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const tender = tenders.find((t) => t.id === tenderId);

    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== tenderId) return t;
        return {
          ...t,
          stage: decision,
          decision: {
            decision,
            decidedBy: user.name,
            decidedAt: now,
            notes: notes || (decision === 'bid' ? 'Proceed with proposal drafting.' : 'Declined opportunity.'),
          },
        };
      })
    );

    recordDecisionOnApi(tenderId, decision, notes);
    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'decision_made',
      tenderId,
      tenderTitle: tender?.title,
      source: 'Bid Desk',
      details: `Human decision recorded: ${decision.toUpperCase()}. ${notes || ''}`,
    });
  };

  const recordOutcome = (tenderId: string, outcome: 'won' | 'lost', learningNote: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const tender = tenders.find((t) => t.id === tenderId);

    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== tenderId) return t;
        return {
          ...t,
          outcome: {
            outcome,
            markedAt: now,
            learningNote,
          },
        };
      })
    );

    recordOutcomeOnApi(tenderId, outcome, learningNote);
    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'outcome_recorded',
      tenderId,
      tenderTitle: tender?.title,
      source: 'Bid Desk Feedback',
      details: `Tender marked as ${outcome.toUpperCase()}. Learning note: ${learningNote}`,
    });
  };

  const markSubmittedByHuman = (tenderId: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const tender = tenders.find((t) => t.id === tenderId);

    setTenders((prev) =>
      prev.map((t) => (t.id === tenderId ? { ...t, stage: 'submitted_by_human', submittedAt: now } : t))
    );

    markSubmittedOnApi(tenderId);
    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'submitted_by_human',
      tenderId,
      tenderTitle: tender?.title,
      source: 'Donor Portal Manual Submission',
      details: `Confirmed proposal submitted manually outside TenderPilot by ${user.name}.`,
    });
  };

  const swapConsultantOnTender = (tenderId: string, oldId: string, newDocId: string) => {
    const newDoc = documents.find((d) => d.id === newDocId);
    if (!newDoc) return;

    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== tenderId) return t;
        const updatedAssigned = t.teamMatching.assigned.map((a) => {
          if (a.consultantId === oldId) {
            return {
              consultantId: newDoc.id,
              consultantName: newDoc.consultantName || newDoc.name,
              matchPercentage: 90,
              expertiseCovered: newDoc.keySkills.slice(0, 2),
            };
          }
          return a;
        });

        const coveredSet = new Set(updatedAssigned.flatMap((a) => a.expertiseCovered));
        const updatedGaps = t.tor.requiredExpertise.filter((req) => !coveredSet.has(req));

        return {
          ...t,
          teamMatching: {
            assigned: updatedAssigned,
            gaps: updatedGaps,
          },
        };
      })
    );

    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'team_matched',
      tenderId,
      source: 'Team Matcher',
      details: `Replaced consultant with ${newDoc.consultantName || newDoc.name}.`,
    });
  };

  const removeConsultantFromTender = (tenderId: string, consultantId: string) => {
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== tenderId) return t;
        const updatedAssigned = t.teamMatching.assigned.filter((a) => a.consultantId !== consultantId);
        const coveredSet = new Set(updatedAssigned.flatMap((a) => a.expertiseCovered));
        const updatedGaps = t.tor.requiredExpertise.filter((req) => !coveredSet.has(req));

        return {
          ...t,
          teamMatching: {
            assigned: updatedAssigned,
            gaps: updatedGaps,
          },
        };
      })
    );

    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'team_matched',
      tenderId,
      source: 'Team Matcher',
      details: `Removed consultant ${consultantId} from proposed team.`,
    });
  };

  const createProposalForTender = (
    tenderId: string,
    templateType: 'technical' | 'eoi' = 'technical'
  ): GeneratedProposal => {
    const tender = tenders.find((t) => t.id === tenderId) || tenders[0];

    const existing = proposals.find((p) => p.tenderId === tenderId);
    if (existing) {
      setActiveProposal(existing);
      return existing;
    }

    const assignedNames = tender.teamMatching.assigned.map((a) => a.consultantName);
    const team = assignedNames.length > 0 ? assignedNames : ['Dr. Sarah Chen (Lead)'];

    // Structure sections directly from evaluation criteria (Part B #5)
    const criteriaSections = tender.tor.evaluationCriteria.map((crit, idx) => ({
      id: `sec-${idx + 2}`,
      title: `${idx + 2}. ${crit.name} (Weight: ${crit.weight}%)`,
      content: `In response to TOR Criterion "${crit.name}" (evaluated at ${crit.weight} points):\n\n${user.firmName} provides comprehensive technical coverage addressing all stated benchmarks. Our approach utilizes verified past methodologies and certified personnel deployable within the stated timeline.`,
      citations: [
        {
          sourceDoc: documents[0]?.name || 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
          excerpt: 'Verified past delivery on comparable bilateral contracts.',
          pageRef: 'Section 3',
        },
      ],
    }));

    const newProp: GeneratedProposal = {
      id: `prop-${Date.now()}`,
      tenderId: tender.id,
      tenderTitle: tender.title,
      agency: tender.agency,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Draft',
      templateType,
      version: `v1.0 (${templateType === 'technical' ? 'Technical Proposal' : 'EOI'})`,
      team,
      checksAcknowledged: false,
      claims: [
        {
          id: 'claim-1',
          claimText: `${user.firmName} has completed 42 high-impact advisory contracts in East Africa.`,
          isSupported: true,
          sourceDoc: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
          excerpt: '42 advisory contracts completed with UN Secretariat, World Bank, and USAID since 2018.',
          pageRef: 'Page 3',
        },
        {
          id: 'claim-2',
          claimText: `${team[0]} brings over 12 years of verified enterprise systems experience.`,
          isSupported: true,
          sourceDoc: documents[0]?.name || 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
          excerpt: 'Over 12 years verifiable technical assistance experience in public sector modernization.',
          pageRef: 'Summary',
        },
        {
          id: 'claim-3',
          claimText: 'Proposed local data center replication offers zero latency across all district clinics.',
          isSupported: false,
        },
      ],
      compliance: tender.tor.eligibility.map((req, i) => ({
        id: `comp-${i}`,
        requirement: req,
        status: i === 0 ? 'met' : 'needs_review',
        notes: i === 0 ? 'Verified against firm registration records.' : 'Requires team acknowledgment.',
      })),
      sections: [
        {
          id: 'sec-1',
          title: '1. Executive Summary & Assignment Understanding',
          content: `${user.firmName} submits this proposal in response to ${tender.agency} for ${tender.title}.\n\nWe provide verified technical coverage across ${tender.sector} in ${tender.region}. Our methodology addresses the complete Terms of Reference while ensuring full compliance with ${tender.source} procurement rules.`,
          citations: [
            {
              sourceDoc: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
              excerpt: 'Established advisory track record in East Africa.',
              pageRef: 'Executive Overview',
            },
          ],
        },
        ...criteriaSections,
      ],
    };

    setProposals((prev) => [newProp, ...prev]);
    setActiveProposal(newProp);
    updateTenderStage(tender.id, 'drafted');

    addAuditLog({
      actor: 'system',
      actorName: 'Proposal Generator',
      event: 'draft_generated',
      tenderId: tender.id,
      tenderTitle: tender.title,
      source: `${templateType.toUpperCase()} Template`,
      details: `Generated proposal draft with ${newProp.sections.length} sections structured from evaluation criteria.`,
    });

    return newProp;
  };

  const updateProposalContent = (proposalId: string, sectionId: string, newContent: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          sections: p.sections.map((s) => (s.id === sectionId ? { ...s, content: newContent } : s)),
        };
      })
    );

    setActiveProposal((prev) => {
      if (!prev || prev.id !== proposalId) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, content: newContent } : s)),
      };
    });

    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'edited',
      source: 'Proposal Studio',
      details: `Edited section in proposal "${proposalId}".`,
    });
  };

  const acknowledgeProposalChecks = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, checksAcknowledged: true, status: 'Under Review' } : p))
    );

    setActiveProposal((prev) => {
      if (!prev || prev.id !== proposalId) return prev;
      return { ...prev, checksAcknowledged: true, status: 'Under Review' };
    });

    const prop = proposals.find((p) => p.id === proposalId);
    if (prop) {
      updateTenderStage(prop.tenderId, 'checked');
      addAuditLog({
        actor: 'user',
        actorName: user.name,
        event: 'check_run',
        tenderId: prop.tenderId,
        source: 'Checks Panel',
        details: 'User acknowledged grounding citations and compliance checklist.',
      });
    }
  };

  const sendReviewPackForTender = (tenderId: string, recipients: string[]) => {
    updateTenderStage(tenderId, 'review_sent');
    const tender = tenders.find((t) => t.id === tenderId);

    addAuditLog({
      actor: 'user',
      actorName: user.name,
      event: 'review_sent',
      tenderId,
      tenderTitle: tender?.title,
      source: 'Review Pack Mailer',
      details: `Dispatched review pack email to ${recipients.join(', ')}.`,
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        documents,
        addDocument,
        deleteDocument,
        tenders,
        addTenderFromTOR,
        addImportedTender,
        addIndexedDocument,
        updateTenderStage,
        recordDecision,
        recordOutcome,
        markSubmittedByHuman,
        swapConsultantOnTender,
        removeConsultantFromTender,
        proposals,
        createProposalForTender,
        updateProposalContent,
        acknowledgeProposalChecks,
        sendReviewPackForTender,
        activeProposal,
        setActiveProposal,
        auditLogs,
        addAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
