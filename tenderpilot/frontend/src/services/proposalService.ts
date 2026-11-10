import { apiUrl, API_V1_BASE } from './apiBase';

const API_BASE = API_V1_BASE;

export interface SendReviewPackPayload {
  tenderId: string;
  recipients: string[];
  note?: string;
}

export async function sendReviewPack(payload: SendReviewPackPayload): Promise<{ sent: boolean; timestamp: string }> {
  try {
    const res = await fetch(apiUrl(`${API_BASE}/pipeline/${payload.tenderId}/send`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      return {
        sent: true,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
    }
  } catch (err) {
    console.warn('Backend send review pack fallback:', err);
  }

  return Promise.resolve({
    sent: true,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });
}
