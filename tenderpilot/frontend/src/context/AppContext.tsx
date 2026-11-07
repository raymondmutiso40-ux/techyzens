import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Tender,
  KBDocument,
  GeneratedProposal,
} from '../data/mockData';
import {
  initialDocuments,
  initialTenders,
  initialProposals,
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
  proposals: GeneratedProposal[];
  createProposalForTender: (tenderId: string) => GeneratedProposal;
  updateProposalContent: (proposalId: string, sectionId: string, newContent: string) => void;
  activeProposal: GeneratedProposal | null;
  setActiveProposal: (prop: GeneratedProposal | null) => void;
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
      role: 'Director of Business Development',
      isLoggedIn: true,
    };
  });

  const [documents, setDocuments] = useState<KBDocument[]>(() => {
    const saved = localStorage.getItem('tp_documents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialDocuments;
  });

  const [tenders] = useState<Tender[]>(initialTenders);

  const [proposals, setProposals] = useState<GeneratedProposal[]>(() => {
    const saved = localStorage.getItem('tp_proposals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialProposals;
  });

  const [activeProposal, setActiveProposal] = useState<GeneratedProposal | null>(
    initialProposals[0] || null
  );

  useEffect(() => {
    localStorage.setItem('tp_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tp_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('tp_proposals', JSON.stringify(proposals));
  }, [proposals]);

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

  const addDocument = (docData: Omit<KBDocument, 'id' | 'uploadedAt' | 'status'>) => {
    const newDoc: KBDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadedAt: 'Just now',
      status: 'Parsed & Indexed',
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const createProposalForTender = (tenderId: string): GeneratedProposal => {
    const tender = tenders.find((t) => t.id === tenderId) || tenders[0];
    
    // Check if one already exists
    const existing = proposals.find((p) => p.tenderId === tenderId);
    if (existing) {
      setActiveProposal(existing);
      return existing;
    }

    const newProp: GeneratedProposal = {
      id: `prop-${Date.now()}`,
      tenderId: tender.id,
      tenderTitle: tender.title,
      agency: tender.agency,
      createdAt: 'Just now',
      status: 'Draft',
      version: 'v1.0 (AI Draft)',
      team: tender.matchedConsultants.length > 0 ? tender.matchedConsultants : ['Dr. Sarah Chen (Lead)'],
      sections: [
        {
          id: 'sec-1',
          title: '1. Executive Summary & Understanding of Assignment',
          content: `${user.firmName} is pleased to submit this Technical Proposal in response to ${tender.agency} for ${tender.title}. We demonstrate proven delivery across ${tender.sector} in ${tender.region}. Our methodology addresses the complete Terms of Reference while ensuring full compliance with ${tender.source} standards.`,
          citations: [
            {
              sourceDoc: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
              excerpt: 'Track record in donor-funded technical assistance in East Africa.',
              pageRef: 'Executive Summary',
            },
          ],
        },
        {
          id: 'sec-2',
          title: '2. Proposed Methodology & Work Plan',
          content: `Our proposed methodology encompasses four structured phases: \n\n1. Inception and Technical Scoping: Aligning stakeholders and establishing baseline metrics.\n2. Architecture & Solution Formulation: Formulating standards-aligned frameworks.\n3. Pilot Validation & Stress Testing: Validating feasibility with counterpart agencies.\n4. Institutional Knowledge Transfer: Handover workshops and institutional capacity building.`,
          citations: [
            {
              sourceDoc: 'UNOPS PFM & Financial Reporting Automation - Final Technical Proposal.docx',
              excerpt: 'Four-phase standard technical assistance workflow.',
              pageRef: 'Page 12',
            },
          ],
        },
        {
          id: 'sec-3',
          title: '3. Key Personnel Qualifications',
          content: `Our proposed team brings extensive verifiable credentials matching this assignment: \n\n${tender.matchedConsultants.map((c) => `- ${c}`).join('\n')}`,
          citations: [
            {
              sourceDoc: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
              excerpt: '14+ years experience with UN and bilateral agencies.',
              pageRef: 'Page 1',
            },
          ],
        },
      ],
    };

    setProposals((prev) => [newProp, ...prev]);
    setActiveProposal(newProp);
    return newProp;
  };

  const updateProposalContent = (proposalId: string, sectionId: string, newContent: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          sections: p.sections.map((s) =>
            s.id === sectionId ? { ...s, content: newContent } : s
          ),
        };
      })
    );

    setActiveProposal((prev) => {
      if (!prev || prev.id !== proposalId) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, content: newContent } : s
        ),
      };
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
        proposals,
        createProposalForTender,
        updateProposalContent,
        activeProposal,
        setActiveProposal,
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
