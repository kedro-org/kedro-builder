import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { CodeDisplay } from './CodeDisplay';
import type { RootState } from '@/store';

// Mock highlight.js — we don't need real syntax highlighting in tests
vi.mock('highlight.js/lib/core', () => ({
  default: {
    registerLanguage: vi.fn(),
    highlightElement: vi.fn(),
  },
}));

const baseUi = {
  showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
  showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
  showProjectSetup: false, hasActiveProject: true,
  selectedComponent: null, showConfigPanel: false,
  showValidationPanel: false,
  canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
  showExportWizard: false, showCodeViewer: false,
  pendingComponentId: null,
};

describe('CodeDisplay', () => {
  it('shows placeholder when no file is selected', () => {
    renderWithProviders(<CodeDisplay />, {
      preloadedState: {
        ui: { ...baseUi, selectedCodeFile: null },
        project: {
          current: {
            id: 'p1', name: 'test_project', pythonPackage: 'test_project',
            pipelineName: 'default', description: '', createdAt: 1, updatedAt: 1,
          },
        },
        nodes: { byId: {}, allIds: [], selected: [], hovered: null },
        datasets: { byId: {}, allIds: [], selected: [] },
        connections: { byId: {}, allIds: [], selected: [] },
      } as Partial<RootState>,
    });

    expect(screen.getByText('Select a file to view its contents')).toBeInTheDocument();
  });

  it('renders file path and copy button when a file is selected', () => {
    renderWithProviders(<CodeDisplay />, {
      preloadedState: {
        ui: { ...baseUi, selectedCodeFile: 'conf/base/catalog.yml' },
        project: {
          current: {
            id: 'p1', name: 'test_project', pythonPackage: 'test_project',
            pipelineName: 'default', description: '', createdAt: 1, updatedAt: 1,
          },
        },
        nodes: { byId: {}, allIds: [], selected: [], hovered: null },
        datasets: { byId: {}, allIds: [], selected: [] },
        connections: { byId: {}, allIds: [], selected: [] },
      } as Partial<RootState>,
    });

    // The file path should be displayed in the header
    expect(screen.getByText('conf/base/catalog.yml')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });
});
