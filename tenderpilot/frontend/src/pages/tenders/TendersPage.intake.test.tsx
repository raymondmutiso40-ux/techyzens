import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { TendersPage } from './TendersPage';

const apiTender = (over: Record<string, unknown> = {}) => ({
  id: 'api-tender-1',
  reference_code: 'UPL-ABC12345',
  title: 'WB Health Data Portal TOR',
  source_name: 'Manual TOR Upload',
  donor: 'World Bank',
  deadline: '2026-12-20',
  budget: 'USD 400,000',
  country: 'Kenya',
  stage: 'scored',
  fitScore: 77,
  recommendation: 'bid',
  strengths: ['Strong team'],
  risks: [],
  tor: {
    donor: 'World Bank',
    deadline: '2026-12-20',
    budget: 'USD 400,000',
    eligibility: ['Registered firm'],
    evaluationCriteria: [{ name: 'Technical approach', weight: 60 }],
    requiredExpertise: ['Data engineering'],
    deliverables: [{ title: 'Inception report', dueWeek: 2 }],
  },
  matchedTeam: [],
  missingExpertise: [],
  ...over,
});

const renderPage = () =>
  render(
    <AppProvider>
      <MemoryRouter>
        <TendersPage />
      </MemoryRouter>
    </AppProvider>
  );

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('TendersPage – add tender', () => {
  it('uploads a real TOR file as multipart form data and opens the new tender', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(JSON.stringify(apiTender()), { status: 200 }));
    renderPage();

    await user.click(screen.getByRole('button', { name: /upload tor/i }));
    const dialog = screen.getByRole('dialog');
    const file = new File(['Terms of reference...'], 'WB_Health_Data_Portal_TOR.docx');
    await user.upload(within(dialog).getByLabelText(/tor document/i), file);
    expect(within(dialog).getByText('WB_Health_Data_Portal_TOR.docx')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /upload & extract/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/intake/tor-file');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);

    // Detail modal for the new tender, on the extracted TOR tab
    expect(await screen.findByRole('heading', { name: 'WB Health Data Portal TOR' })).toBeInTheDocument();
    expect(screen.getByText(/technical approach/i)).toBeInTheDocument();
  });

  it('rejects unsupported file types before uploading', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();
    await user.click(screen.getByRole('button', { name: /upload tor/i }));
    const dialog = screen.getByRole('dialog');
    await user.upload(within(dialog).getByLabelText(/tor document/i), new File(['x'], 'photo.png'));
    expect(within(dialog).getByText(/upload a pdf, word/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /upload & extract/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for a file when none is chosen', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /upload tor/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /upload & extract/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/choose a tor file/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('imports a tender from a link', async () => {
    const user = userEvent.setup();
    const link = 'https://procurement-notices.undp.org/view_notice.cfm?notice_id=1';
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          apiTender({
            id: 'api-tender-2',
            title: 'UNDP Climate Early Warning Consultancy',
            source_name: 'Web link (procurement-notices.undp.org)',
            source_url: link,
          })
        ),
        { status: 200 }
      )
    );
    renderPage();

    await user.click(screen.getByRole('button', { name: /add from link/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/link to the tender notice/i), link);
    await user.click(within(dialog).getByRole('button', { name: /fetch & extract/i }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/intake/url');
    expect(JSON.parse(init.body)).toEqual({ url: link });
    expect(await screen.findByRole('heading', { name: /UNDP Climate Early Warning Consultancy/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open original notice/i })).toHaveAttribute('href', link);
    // The new tender is also in the table behind the modal
    expect(screen.getAllByText('UNDP Climate Early Warning Consultancy').length).toBeGreaterThan(1);
  });

  it('shows the server error and keeps the modal open when the link fails', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'That address points to a private network and cannot be fetched.' }), {
        status: 400,
      })
    );
    renderPage();
    await user.click(screen.getByRole('button', { name: /add from link/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/link to the tender notice/i), 'http://127.0.0.1/admin');
    await user.click(within(dialog).getByRole('button', { name: /fetch & extract/i }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/private network/i);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('explains when the backend is not running', async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    renderPage();
    await user.click(screen.getByRole('button', { name: /upload tor/i }));
    const dialog = screen.getByRole('dialog');
    await user.upload(within(dialog).getByLabelText(/tor document/i), new File(['tor'], 'tor.pdf'));
    await user.click(within(dialog).getByRole('button', { name: /upload & extract/i }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/reach the tenderpilot server/i);
  });
});
