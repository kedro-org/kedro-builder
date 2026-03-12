import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { NodeConfigForm } from './NodeConfigForm';
import type { KedroNode } from '@/types/kedro';

// Mock only dispatchConfigUpdated, keep all other exports from @/constants
vi.mock('@/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants')>();
  return {
    ...actual,
    dispatchConfigUpdated: vi.fn(),
  };
});

const mockNode: KedroNode = {
  id: 'node-1',
  name: 'process_data',
  type: 'data_processing',
  inputs: ['raw_data'],
  outputs: ['clean_data'],
  position: { x: 0, y: 0 },
  functionCode: 'def process_data(raw_data):\n    return raw_data',
};

const defaultState = {
  nodes: {
    byId: { 'node-1': mockNode },
    allIds: ['node-1'],
    selected: [],
    hovered: null,
  },
  ui: {
    showTutorial: false,
    tutorialStep: 1,
    tutorialCompleted: false,
    showWalkthrough: false,
    walkthroughStep: 1,
    walkthroughCompleted: false,
    showProjectSetup: false,
    hasActiveProject: true,
    selectedComponent: { type: 'node' as const, id: 'node-1' },
    showConfigPanel: true,
    showValidationPanel: false,
    canvasZoom: 1,
    canvasPosition: { x: 0, y: 0 },
    showCodeViewer: false,
    selectedCodeFile: null,
    showExportWizard: false,
    pendingComponentId: null,
  },
};

describe('NodeConfigForm', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('pre-fills the form with the existing node name', () => {
    renderWithProviders(
      <NodeConfigForm node={mockNode} onClose={onClose} />,
      { preloadedState: defaultState }
    );

    const nameInput = screen.getByPlaceholderText('e.g., process_raw_data');
    expect(nameInput).toHaveValue('process_data');
  });

  it('Save button is disabled when form has not been modified', () => {
    renderWithProviders(
      <NodeConfigForm node={mockNode} onClose={onClose} />,
      { preloadedState: defaultState }
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it('submitting with a changed name dispatches updateNode and calls onClose', async () => {
    const user = userEvent.setup();

    const { store } = renderWithProviders(
      <NodeConfigForm node={mockNode} onClose={onClose} />,
      { preloadedState: defaultState }
    );

    const nameInput = screen.getByPlaceholderText('e.g., process_raw_data');

    // Change the name
    await user.clear(nameInput);
    await user.type(nameInput, 'clean_data');

    // Save should now be enabled
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();

    // Submit the form
    await user.click(saveButton);

    // Verify the Redux store was updated
    await waitFor(() => {
      const updatedNode = store.getState().nodes.byId['node-1'];
      expect(updatedNode.name).toBe('clean_data');
    });

    // onClose should have been called
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
