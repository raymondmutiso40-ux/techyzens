import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';

describe('AppLayout Component', () => {
  const renderLayout = (initialRoute = '/tenders') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/tenders" element={<div>Tenders Page Content</div>} />
            <Route path="/knowledge-base" element={<div>Knowledge Base Page Content</div>} />
            <Route path="/proposals" element={<div>Proposals Page Content</div>} />
            <Route path="/settings/preferences" element={<div>Preferences Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders branding and main navigation links', () => {
    renderLayout();

    // Brand
    expect(screen.getAllByText('TenderPilot')[0]).toBeInTheDocument();

    // Navigation links
    expect(screen.getByRole('link', { name: /tenders/i })).toHaveAttribute('href', '/tenders');
    expect(screen.getByRole('link', { name: /knowledge base/i })).toHaveAttribute('href', '/knowledge-base');
    expect(screen.getByRole('link', { name: /proposals/i })).toHaveAttribute('href', '/proposals');
    expect(screen.getByRole('link', { name: /preferences/i })).toHaveAttribute('href', '/settings/preferences');
  });

  it('renders firm and user profile badge', () => {
    renderLayout();

    expect(screen.getByText(/Apex Advisors/i)).toBeInTheDocument();
    expect(screen.getByText(/\+254 7\d{2} \d{3} \d{3}/i)).toBeInTheDocument();
  });

  it('renders the child route content in the outlet', () => {
    renderLayout('/tenders');
    expect(screen.getByText('Tenders Page Content')).toBeInTheDocument();
  });

  it('navigates to another page when clicking nav links', async () => {
    const user = userEvent.setup();
    renderLayout('/tenders');

    expect(screen.getByText('Tenders Page Content')).toBeInTheDocument();

    const kbLink = screen.getByRole('link', { name: /knowledge base/i });
    await user.click(kbLink);

    expect(screen.getByText('Knowledge Base Page Content')).toBeInTheDocument();
  });

  it('toggles mobile menu when toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderLayout();

    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleButton).toBeInTheDocument();

    // Clicking toggle expands/collapses mobile sidebar
    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
