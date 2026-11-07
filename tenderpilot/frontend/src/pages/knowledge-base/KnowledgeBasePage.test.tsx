import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { KnowledgeBasePage } from './KnowledgeBasePage';

const renderPage = () =>
  render(
    <AppProvider>
      <MemoryRouter>
        <KnowledgeBasePage />
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

describe('KnowledgeBasePage – upload', () => {
  it('uploads a CV file with its details and lists it', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'kb-1',
          name: 'Jane_Doe_CV.pdf',
          type: 'CV',
          size: '120 KB',
          uploadedAt: 'Just now',
          status: 'Parsed & Indexed',
          consultantName: 'Jane Doe',
          keySkills: ['Health informatics'],
          summary: 'Health informatics lead.',
        }),
        { status: 200 }
      )
    );
    renderPage();

    await user.click(screen.getAllByRole('button', { name: /upload document/i })[0]);
    const dialog = screen.getByRole('dialog');
    await user.upload(within(dialog).getByLabelText(/^document$/i), new File(['cv'], 'Jane_Doe_CV.pdf'));
    await user.type(within(dialog).getByLabelText(/consultant name/i), 'Jane Doe');
    await user.type(within(dialog).getByLabelText(/skills/i), 'Health informatics');
    await user.click(within(dialog).getByRole('button', { name: /upload and index/i }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/intake/knowledge');
    const form = init.body as FormData;
    expect(form.get('doc_type')).toBe('CV');
    expect(form.get('consultant_name')).toBe('Jane Doe');
    expect(form.get('skills')).toBe('Health informatics');
    expect(form.get('file')).toBeInstanceOf(File);

    expect(await screen.findByText('Jane_Doe_CV.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('requires a consultant name for CVs', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getAllByRole('button', { name: /upload document/i })[0]);
    const dialog = screen.getByRole('dialog');
    await user.upload(within(dialog).getByLabelText(/^document$/i), new File(['cv'], 'cv.docx'));
    await user.click(within(dialog).getByRole('button', { name: /upload and index/i }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/consultant's name/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server error when the upload fails', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: 'File is larger than 15 MB.' }), { status: 413 }));
    renderPage();
    await user.click(screen.getAllByRole('button', { name: /upload document/i })[0]);
    const dialog = screen.getByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText(/document type/i), 'Past Proposal');
    await user.upload(within(dialog).getByLabelText(/^document$/i), new File(['p'], 'proposal.pdf'));
    await user.click(within(dialog).getByRole('button', { name: /upload and index/i }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('File is larger than 15 MB.');
  });
});
