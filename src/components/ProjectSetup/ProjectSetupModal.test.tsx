import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { ProjectSetupModal } from './ProjectSetupModal';

// Mock telemetry + localStorage persistence (not what we're testing)
vi.mock('@/infrastructure/telemetry', () => ({ trackEvent: vi.fn() }));
vi.mock('@/infrastructure/localStorage', () => ({ clearProjectFromLocalStorage: vi.fn() }));

describe('ProjectSetupModal', () => {
  it('renders "Set up your project" form with default name', () => {
    renderWithProviders(<ProjectSetupModal />);

    expect(screen.getByText('Set up your project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('my-first-project')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  it('creates project and updates Redux on submit', async () => {
    const { store } = renderWithProviders(<ProjectSetupModal />);

    const nameInput = screen.getByDisplayValue('my-first-project');
    fireEvent.change(nameInput, { target: { value: 'test-pipeline' } });

    fireEvent.click(screen.getByText('Create Project'));

    await waitFor(() => {
      const state = store.getState();
      expect(state.project.current).not.toBeNull();
      expect(state.project.current!.name).toBe('test-pipeline');
      expect(state.project.current!.pythonPackage).toBe('test_pipeline');
      expect(state.ui.hasActiveProject).toBe(true);
    });
  });
});
