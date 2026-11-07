import type { GeneratedProposal, ProposalChecks } from '../data/mockData';

// Signatures match planned REST endpoints:
// POST /api/proposals/generate
// POST /api/proposals/:id/checks
// POST /api/proposals/:id/send-review-pack

export interface SendReviewPackPayload {
  tenderId: string;
  recipients: string[];
  note?: string;
}

export async function sendReviewPack(payload: SendReviewPackPayload): Promise<{ sent: boolean; timestamp: string }> {
  return Promise.resolve({
    sent: true,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });
}
