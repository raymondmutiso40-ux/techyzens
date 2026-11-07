import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferencesPage } from './PreferencesPage';

describe('PreferencesPage Component', () => {
  it('renders preference form sections and inputs', () => {
    render(<PreferencesPage />);

    expect(screen.getByText(/Tender Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Tender Sources to Monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Sectors/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Regions/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /keywords/i })).toBeInTheDocument();

    // Check UNGM source option
    expect(screen.getByLabelText(/United Nations Global Marketplace/i)).toBeInTheDocument();

    // Save button
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
  });

  it('allows adding and removing keywords', async () => {
    const user = userEvent.setup();
    render(<PreferencesPage />);

    const keywordInput = screen.getByPlaceholderText(/Add keyword/i);
    const addBtn = screen.getByRole('button', { name: /add/i });

    await user.type(keywordInput, 'AI Agent');
    await user.click(addBtn);

    expect(screen.getByText('AI Agent')).toBeInTheDocument();

    // Remove keyword
    const removeBtn = screen.getByRole('button', { name: /remove ai agent/i });
    await user.click(removeBtn);

    expect(screen.queryByText('AI Agent')).not.toBeInTheDocument();
  });

  it('submits preferences and shows success feedback', async () => {
    const user = userEvent.setup();
    render(<PreferencesPage />);

    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);

    expect(await screen.findByText(/Preferences saved successfully/i)).toBeInTheDocument();
  });
});
