import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { LoginPage } from './LoginPage';

const renderLogin = () =>
  render(
    <AppProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>Landing Content</div>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>
  );

describe('LoginPage', () => {
  it('shows the background video panel and a link back to the landing page', async () => {
    const { container } = renderLogin();
    expect(container.querySelector('video source')).toHaveAttribute('src', expect.stringContaining('.mp4'));

    await userEvent.click(screen.getByRole('link', { name: /back to site/i }));
    expect(screen.getByText('Landing Content')).toBeInTheDocument();
  });

  it('logs in with phone number and the 6-digit demo code', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /send verification code/i }));
    // Code step: use the demo helper to enter 123456
    await user.click(await screen.findByRole('button', { name: /fill 123456/i }, { timeout: 3000 }));

    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('Dashboard Content', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
