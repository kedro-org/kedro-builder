import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { FileTree } from './FileTree';
import type { RootState } from '@/store';

const baseUi = {
  showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
  showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
  showProjectSetup: false, hasActiveProject: true,
  selectedComponent: null, showConfigPanel: false,
  showCodePreview: false, showValidationPanel: false,
  canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
  showExportWizard: false, showCodeViewer: false,
  selectedCodeFile: null, pendingComponentId: null,
};

describe('FileTree', () => {
  it('shows empty state when no project exists', () => {
    renderWithProviders(<FileTree />, {
      preloadedState: {
        ui: { ...baseUi, hasActiveProject: false },
        project: { current: null, savedList: [], lastSaved: null },
        nodes: { byId: {}, allIds: [], selected: [], hovered: null },
        datasets: { byId: {}, allIds: [], selected: [] },
        connections: { byId: {}, allIds: [], selected: [] },
      } as Partial<RootState>,
    });

    expect(screen.getByText('Failed to load file tree')).toBeInTheDocument();
  });

  it('renders project folder structure when project exists', () => {
    renderWithProviders(<FileTree />, {
      preloadedState: {
        ui: { ...baseUi, hasActiveProject: true },
        project: {
          current: {
            id: 'p1', name: 'demo_project', pythonPackage: 'demo_project',
            pipelineName: 'default', description: '', createdAt: 1, updatedAt: 1,
          },
          savedList: [], lastSaved: null,
        },
        nodes: { byId: {}, allIds: [], selected: [], hovered: null },
        datasets: { byId: {}, allIds: [], selected: [] },
        connections: { byId: {}, allIds: [], selected: [] },
      } as Partial<RootState>,
    });

    // Project name appears in root folder and under src/
    expect(screen.getAllByText('demo_project').length).toBeGreaterThanOrEqual(1);
    // File tree should contain folder elements
    const folders = document.querySelectorAll('.file-tree__folder');
    expect(folders.length).toBeGreaterThan(0);
  });
});
