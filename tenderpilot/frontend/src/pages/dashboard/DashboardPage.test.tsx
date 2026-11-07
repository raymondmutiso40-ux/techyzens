import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { DashboardPage } from './DashboardPage';

const renderDashboard = () =>
  render(
    <AppProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AppProvider>
  );

const awaitingCard = () =>
  screen.getByRole('heading', { name: /tenders awaiting go \/ no-go decision/i }).closest('section')!;

describe('DashboardPage', () => {
  beforeEach(() => localStorage.clear());

  it('renders the overview header, KPI cards and charts', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { level: 1, name: /operational overview/i })).toBeInTheDocument();
    expect(screen.getAllByText(/awaiting decision/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/average fit score/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /pipeline by stage/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /deadline calendar/i })).toBeInTheDocument();
  });

  it('shows the UNICEF tender title and reference and includes WHO AFRO in the deadline calendar', () => {
    renderDashboard();
    expect(screen.getByText('UNICEF-HQ-2026-119')).toBeInTheDocument();
    expect(screen.getAllByText('Modernization of Sub-National Supply Chain Tracking & Variance Analytics').length).toBeGreaterThan(0);
    expect(screen.getByText(/no outcomes logged yet/i)).toBeInTheDocument();
    const whoDeadlineCell = document.querySelector('td[title*="Technical Advisory for Disease Surveillance"]');
    expect(whoDeadlineCell).toBeInTheDocument();
  });

  it('removes a tender from the go/no-go list once a decision is recorded', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const before = within(awaitingCard()).getAllByRole('button', { name: /approve bid/i }).length;
    expect(before).toBeGreaterThan(0);

    await user.click(within(awaitingCard()).getAllByRole('button', { name: /approve bid/i })[0]);

    const after = within(awaitingCard()).queryAllByRole('button', { name: /approve bid/i }).length;
    expect(after).toBe(before - 1);

    const deadlineCard = screen.getByRole('heading', { name: /upcoming submission deadlines/i }).closest('section')!;
    const logButtons = within(deadlineCard).getAllByRole('button', { name: /log outcome/i });
    expect(JSON.parse(localStorage.getItem('tp_tenders_v2')!).find((t: { id: string }) => t.id === 'tender-2')).toMatchObject({ stage: 'bid', decision: { decision: 'bid' } });
    await user.click(logButtons[2]);
    await user.type(screen.getByLabelText(/debrief notes/i), 'Strong team match');
    await user.click(screen.getByRole('button', { name: /save outcome/i }));

    const saved = JSON.parse(localStorage.getItem('tp_tenders_v2')!).find((t: { id: string }) => t.id === 'tender-2');
    expect(saved.outcome).toMatchObject({ outcome: 'won', learningNote: 'Strong team match' });
    expect(within(deadlineCard).queryAllByRole('button', { name: /log outcome/i })).toHaveLength(logButtons.length - 1);
  });

  it('filters the dashboard by tender source', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const group = screen.getByRole('group', { name: /filter by source/i });
    const buttons = within(group).getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');

    await user.click(buttons[buttons.length - 1]);
    expect(buttons[buttons.length - 1]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
  });
});
