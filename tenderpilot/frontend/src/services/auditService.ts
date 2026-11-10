import type { AuditLogEntry } from '../data/mockData';
import { apiUrl, API_V1_BASE } from './apiBase';

const API_BASE = API_V1_BASE;

export async function fetchAuditLogsFromApi(): Promise<any[]> {
  try {
    const res = await fetch(apiUrl(`${API_BASE}/audit`));
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend audit logs fallback:', err);
  }
  return [];
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };
  return Promise.resolve(newEntry);
}
