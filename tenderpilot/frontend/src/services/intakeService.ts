import type { KBDocument, Tender } from '../data/mockData';
import { apiRequest, ApiError, fromApiTender, type ApiTender } from './apiTender';

const API_BASE = '/api/v1/intake';

export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',');
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Client-side check before uploading. Returns an error message, or null when the file is OK. */
export function validateUploadFile(file: File): string | null {
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  if (!ACCEPTED_EXTENSIONS.includes(ext)) return 'Upload a PDF, Word (.docx), .txt or .md file.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return 'This file is larger than 15 MB.';
  return null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Upload a TOR document. The backend extracts and scores it and returns the new tender. */
export async function uploadTorFile(file: File): Promise<Tender> {
  const problem = validateUploadFile(file);
  if (problem) throw new ApiError(problem, 400);
  const form = new FormData();
  form.append('file', file);
  const api = await apiRequest<ApiTender>(`${API_BASE}/tor-file`, { method: 'POST', body: form });
  return fromApiTender(api);
}

/** Ask the agent to fetch a tender notice from a web link, then extract and score it. */
export async function importTenderFromUrl(url: string): Promise<Tender> {
  const trimmed = url.trim();
  if (!trimmed) throw new ApiError('Enter a web address.', 400);
  const api = await apiRequest<ApiTender>(`${API_BASE}/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: trimmed }),
  });
  return fromApiTender(api);
}

export interface KnowledgeUploadMeta {
  type: KBDocument['type'];
  consultantName?: string;
  skills?: string;
  summary?: string;
}

/** Upload a CV, past proposal or capability statement into the knowledge base. */
export async function uploadKnowledgeDocument(file: File, meta: KnowledgeUploadMeta): Promise<KBDocument> {
  const problem = validateUploadFile(file);
  if (problem) throw new ApiError(problem, 400);
  const form = new FormData();
  form.append('file', file);
  form.append('doc_type', meta.type);
  if (meta.consultantName) form.append('consultant_name', meta.consultantName);
  if (meta.skills) form.append('skills', meta.skills);
  if (meta.summary) form.append('summary', meta.summary);
  const doc = await apiRequest<KBDocument>(`${API_BASE}/knowledge`, { method: 'POST', body: form });
  return { ...doc, consultantName: doc.consultantName ?? undefined };
}
