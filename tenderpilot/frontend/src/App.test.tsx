import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Router Integration', () => {
  it('renders TenderPilot layout and default route', () => {
    window.history.pushState({}, 'Test', '/');
    render(<App />);

    expect(screen.getAllByText('TenderPilot')[0]).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Tender Discovery/i })).toBeInTheDocument();
  });

  it('renders Preferences page at /settings/preferences', () => {
    window.history.pushState({}, 'Test', '/settings/preferences');
    render(<App />);

    expect(screen.getByRole('heading', { name: /Tender Preferences/i })).toBeInTheDocument();
  });

  it('renders Knowledge Base placeholder at /knowledge-base', () => {
    window.history.pushState({}, 'Test', '/knowledge-base');
    render(<App />);

    expect(screen.getByRole('heading', { name: /Knowledge Base: CVs & Proposals/i })).toBeInTheDocument();
  });

  it('renders Proposals placeholder at /proposals', () => {
    window.history.pushState({}, 'Test', '/proposals');
    render(<App />);

    expect(screen.getByRole('heading', { name: /Proposals Studio/i })).toBeInTheDocument();
  });

  it('renders standalone Login page at /login', () => {
    window.history.pushState({}, 'Test', '/login');
    render(<App />);

    expect(screen.getByRole('heading', { name: /Sign in to TenderPilot/i })).toBeInTheDocument();
    // Layout sidebar should not be in login view
    expect(screen.queryByText(/Main Menu/i)).not.toBeInTheDocument();
  });
});
