import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { CodeViewerModal } from './CodeViewerModal';
import type { RootState } from '@/store';

const baseUi = {
  showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
  showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
  showProjectSetup: false, hasActiveProject: true,
  selectedComponent: null, showConfigPanel: false,
  showCodePreview: false, showValidationPanel: false,
  canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
  showExportWizard: false, pendingComponentId: null,
};

describe('CodeViewerModal', () => {
  it('returns null when showCodeViewer is false', () => {
    const { container } = renderWithProviders(<CodeViewerModal />, {
      preloadedState: {
        ui: { ...baseUi, showCodeViewer: false, selectedCodeFile: null },
      } as Partial<RootState>,
    });

    expect(container.querySelector('.code-viewer-modal')).toBeNull();
  });

  it('renders title with project name when open', () => {
    renderWithProviders(<CodeViewerModal />, {
      preloadedState: {
        ui: { ...baseUi, showCodeViewer: true, selectedCodeFile: 'conf/base/catalog.yml' },
        project: {
          current: {
            id: 'p1', name: 'demo_pipeline', pythonPackage: 'demo_pipeline',
            pipelineName: 'default', description: '', createdAt: 1000, updatedAt: 1000,
          },
          savedList: [], lastSaved: null,
        },
        nodes: { byId: {}, allIds: [], selected: [], hovered: null },
        datasets: { byId: {}, allIds: [], selected: [] },
        connections: { byId: {}, allIds: [], selected: [] },
      } as Partial<RootState>,
    });

    expect(screen.getByText('Kedro Project Directory')).toBeInTheDocument();
    // Project name may appear in multiple sub-components (header + file tree)
    expect(screen.getAllByText(/demo_pipeline/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Close/ })).toBeInTheDocument();
  });
});
