import type { AuditLogEntry } from '../data/mockData';

// Signatures match planned REST endpoints:
// GET /api/audit-logs
// POST /api/audit-logs

export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };
  return Promise.resolve(newEntry);
}
