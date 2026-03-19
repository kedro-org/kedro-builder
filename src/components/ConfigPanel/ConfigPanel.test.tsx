import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { ConfigPanel } from './ConfigPanel';
import type { RootState } from '@/store';

// Mock dispatchConfigUpdated (used by sub-forms)
vi.mock('@/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants')>();
  return { ...actual, dispatchConfigUpdated: vi.fn() };
});

const mockNode = {
  id: 'node-1', name: 'clean_data', type: 'data_processing' as const,
  inputs: [], outputs: [], position: { x: 0, y: 0 },
};

describe('ConfigPanel', () => {
  it('returns null when panel is closed', () => {
    const { container } = renderWithProviders(<ConfigPanel />, {
      preloadedState: {
        onboarding: {
          showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
          showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
        },
        ui: {
          showConfigPanel: false, selectedComponent: null,
          showProjectSetup: false, hasActiveProject: true,
          showValidationPanel: false,
          canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
          showCodeViewer: false, selectedCodeFile: null,
          showExportWizard: false, pendingComponentId: null,
        },
      } as Partial<RootState>,
    });

    expect(container.querySelector('.config-panel')).toBeNull();
  });

  it('shows "Configure Node" title when a node is selected', () => {
    renderWithProviders(<ConfigPanel />, {
      preloadedState: {
        nodes: { byId: { 'node-1': mockNode }, allIds: ['node-1'], selected: [], hovered: null },
        onboarding: {
          showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
          showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
        },
        ui: {
          showConfigPanel: true,
          selectedComponent: { type: 'node', id: 'node-1' },
          showProjectSetup: false, hasActiveProject: true,
          showValidationPanel: false,
          canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
          showCodeViewer: false, selectedCodeFile: null,
          showExportWizard: false, pendingComponentId: null,
        },
        validation: { errors: [], warnings: [], isValid: true, lastChecked: null },
      } as Partial<RootState>,
    });

    expect(screen.getByText('Configure Node')).toBeInTheDocument();
  });
});
