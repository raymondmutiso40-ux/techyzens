import React, { useState } from 'react';
import {
  PageHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  EmptyState
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import type { AuditLogEntry } from '../../data/mockData';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useApp();
  const [filterEvent, setFilterEvent] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterEvent === 'ALL') return true;
    return log.event === filterEvent;
  });

  const getEventBadge = (event: AuditLogEntry['event']) => {
    const map: Record<AuditLogEntry['event'], { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
      found: { label: 'Notice Found', variant: 'neutral' },
      extracted: { label: 'TOR Extracted', variant: 'info' },
      scored: { label: 'Fit Scored', variant: 'info' },
      team_matched: { label: 'Team Matched', variant: 'info' },
      draft_generated: { label: 'Draft Generated', variant: 'neutral' },
      edited: { label: 'Section Edited', variant: 'neutral' },
      check_run: { label: 'Checks Verified', variant: 'warning' },
      decision_made: { label: 'Human Decision', variant: 'success' },
      review_sent: { label: 'Review Pack Sent', variant: 'warning' },
      submitted_by_human: { label: 'Submitted (Human)', variant: 'success' },
      outcome_recorded: { label: 'Outcome Logged', variant: 'neutral' },
    };
    const e = map[event] || { label: event, variant: 'neutral' };
    return <Badge variant={e.variant}>{e.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        category="Governance & Compliance"
        title="Audit Trail"
        description="Immutable record of system automations, human bid decisions, and submission events."
      >
        <span className="text-xs text-slate-500">{auditLogs.length} total events logged</span>
      </PageHeader>

      <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Filter by event:</span>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700"
          >
            <option value="ALL">All events ({auditLogs.length})</option>
            <option value="decision_made">Human Decisions</option>
            <option value="draft_generated">Draft Generations</option>
            <option value="check_run">Checks & Verifications</option>
            <option value="submitted_by_human">Human Submissions</option>
            <option value="outcome_recorded">Outcomes</option>
          </select>
        </div>
      </div>

      {filteredLogs.length > 0 ? (
        <Table>
          <Thead>
            <Tr>
              <Th>Timestamp</Th>
              <Th>Actor</Th>
              <Th>Event</Th>
              <Th>Source</Th>
              <Th>Details</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredLogs.map((log) => (
              <Tr key={log.id}>
                <Td className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {log.timestamp}
                </Td>
                <Td className="text-xs whitespace-nowrap">
                  <div className="font-medium text-slate-900">{log.actorName}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{log.actor}</div>
                </Td>
                <Td className="whitespace-nowrap">{getEventBadge(log.event)}</Td>
                <Td className="text-xs text-slate-600 whitespace-nowrap">{log.source}</Td>
                <Td className="text-xs text-slate-800 max-w-md">
                  <div>{log.details}</div>
                  {log.tenderTitle && (
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Tender: {log.tenderTitle}
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <EmptyState
          title="No audit entries found"
          description="Actions such as scoring, team matching, and human decisions will be logged here."
        />
      )}
    </div>
  );
};
