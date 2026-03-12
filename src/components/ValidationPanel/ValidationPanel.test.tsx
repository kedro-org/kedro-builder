import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { ValidationPanel } from './ValidationPanel';
import type { RootState } from '@/store';

const baseUi = {
  showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
  showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
  showProjectSetup: false, hasActiveProject: true,
  selectedComponent: null, showConfigPanel: false,
  canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
  showCodeViewer: false, selectedCodeFile: null,
  showExportWizard: false, pendingComponentId: null,
};

describe('ValidationPanel', () => {
  it('returns null when panel is hidden', () => {
    const { container } = renderWithProviders(<ValidationPanel />, {
      preloadedState: {
        ui: { ...baseUi, showValidationPanel: false },
        validation: { errors: [], warnings: [], isValid: true, lastChecked: null },
      } as Partial<RootState>,
    });

    expect(container.querySelector('.validation-panel')).toBeNull();
  });

  it('shows error and warning counts when panel is open', () => {
    renderWithProviders(<ValidationPanel />, {
      preloadedState: {
        ui: { ...baseUi, showValidationPanel: true },
        nodes: { byId: {}, allIds: [], selected: [], hovered: null },
        datasets: { byId: {}, allIds: [], selected: [] },
        validation: {
          errors: [
            { id: 'e1', severity: 'error' as const, componentId: 'n1', componentType: 'node' as const, message: 'Bad' },
            { id: 'e2', severity: 'error' as const, componentId: 'n2', componentType: 'node' as const, message: 'Bad2' },
          ],
          warnings: [
            { id: 'w1', severity: 'warning' as const, componentId: 'd1', componentType: 'dataset' as const, message: 'Meh' },
          ],
          isValid: false,
          lastChecked: Date.now(),
        },
      } as Partial<RootState>,
    });

    expect(screen.getByText('Validation Results')).toBeInTheDocument();
    expect(screen.getByText('3 issues')).toBeInTheDocument();
    expect(screen.getByText(/2 errors/)).toBeInTheDocument();
    expect(screen.getByText(/1 warning/)).toBeInTheDocument();
  });
});
