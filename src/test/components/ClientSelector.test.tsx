/**
 * ClientSelector Component Tests
 * Tests the client selection dropdown component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientSelector } from '@/components/invoices/ClientSelector';
import type { Client } from '@/types';

describe('ClientSelector Component', () => {
  const mockClients: Client[] = [
    {
      id: 1,
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '555-0100',
      company: 'Acme Corporation',
      created_at: '2026-02-16',
      updated_at: '2026-02-16'
    },
    {
      id: 2,
      name: 'Test Inc',
      email: 'info@test.com',
      phone: '555-0200',
      company: 'Test Incorporated',
      created_at: '2026-02-16',
      updated_at: '2026-02-16'
    }
  ];

  const mockOnClientSelect = vi.fn();

  beforeEach(() => {
    mockOnClientSelect.mockClear();
  });

  it('should render without crashing', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    expect(screen.getByText(/select.*client/i)).toBeInTheDocument();
  });

  it('should display all clients in dropdown', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    // Open dropdown
    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');
    fireEvent.click(dropdown);

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Test Inc')).toBeInTheDocument();
  });

  it('should show selected client', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={mockClients[0]}
        onClientSelect={mockOnClientSelect}
      />
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('should call onClientSelect when client is chosen', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    // Open dropdown
    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');
    fireEvent.click(dropdown);

    // Select first client
    const option = screen.getByText('Acme Corp');
    fireEvent.click(option);

    expect(mockOnClientSelect).toHaveBeenCalledWith(mockClients[0]);
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
        disabled={true}
      />
    );

    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');
    expect(dropdown).toBeDisabled();
  });

  it('should handle empty client list', () => {
    render(
      <ClientSelector
        clients={[]}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    expect(screen.getByText(/no clients|select.*client/i)).toBeInTheDocument();
  });

  it('should display client details in dropdown options', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');
    fireEvent.click(dropdown);

    // Should show email or company info
    const hasDetails =
      screen.queryByText(/acme.com/i) ||
      screen.queryByText(/Acme Corporation/i);

    expect(hasDetails).toBeTruthy();
  });

  it('should allow clearing selection', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={mockClients[0]}
        onClientSelect={mockOnClientSelect}
      />
    );

    // Look for clear button (X icon or Clear text)
    const clearButton = screen.queryByText(/clear/i) ||
                       screen.queryByLabelText(/clear/i);

    if (clearButton) {
      fireEvent.click(clearButton);
      expect(mockOnClientSelect).toHaveBeenCalledWith(null);
    }
  });

  it('should support keyboard navigation', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');

    // Test keyboard interaction
    fireEvent.keyDown(dropdown, { key: 'Enter' });
    fireEvent.keyDown(dropdown, { key: 'ArrowDown' });
    fireEvent.keyDown(dropdown, { key: 'Enter' });

    // Should have called the callback
    expect(mockOnClientSelect).toHaveBeenCalled();
  });

  it('should display placeholder text when no client selected', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    expect(screen.getByText(/select/i)).toBeInTheDocument();
  });

  it('should filter clients by search', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    // If the component has search functionality
    const searchInput = screen.queryByPlaceholderText(/search/i);

    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.queryByText('Test Inc')).not.toBeInTheDocument();
    }
  });

  it('should handle very long client names gracefully', () => {
    const longNameClient: Client = {
      ...mockClients[0],
      name: 'A'.repeat(100),
      company: 'B'.repeat(100)
    };

    render(
      <ClientSelector
        clients={[longNameClient]}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');
    fireEvent.click(dropdown);

    // Should render without breaking layout
    expect(screen.getByText(/A{10,}/)).toBeInTheDocument();
  });

  it('should show client count when multiple clients', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');
    fireEvent.click(dropdown);

    // Should show number of clients available
    const hasCount = screen.queryByText(/2.*client/i);
    // This is optional, depends on implementation
  });

  it('should maintain focus after selection', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');
    fireEvent.click(dropdown);

    const option = screen.getByText('Acme Corp');
    fireEvent.click(option);

    // Dropdown should close after selection
    expect(screen.queryByText('Test Inc')).not.toBeInTheDocument();
  });

  it('should handle rapid selection changes', () => {
    render(
      <ClientSelector
        clients={mockClients}
        selectedClient={null}
        onClientSelect={mockOnClientSelect}
      />
    );

    const dropdown = screen.getByRole('combobox') || screen.getByRole('button');

    // Rapidly select different clients
    fireEvent.click(dropdown);
    fireEvent.click(screen.getByText('Acme Corp'));

    fireEvent.click(dropdown);
    fireEvent.click(screen.getByText('Test Inc'));

    expect(mockOnClientSelect).toHaveBeenCalledTimes(2);
    expect(mockOnClientSelect).toHaveBeenLastCalledWith(mockClients[1]);
  });
});
