import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { EmptyState } from './EmptyState';
import type { RootState } from '@/types/redux';

const baseUi = {
  showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
  showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
  showProjectSetup: false, selectedComponent: null, showConfigPanel: false,
  showCodePreview: false, showValidationPanel: false,
  canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
  showCodeViewer: false, selectedCodeFile: null,
  showExportWizard: false, pendingComponentId: null,
};

describe('EmptyState', () => {
  it('shows "Create New Project" button when no active project', () => {
    renderWithProviders(<EmptyState />, {
      preloadedState: { ui: { ...baseUi, hasActiveProject: false } } as Partial<RootState>,
    });

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to Kedro/)).toBeInTheDocument();
  });

  it('shows Dataset + Function Node buttons when project is active', () => {
    renderWithProviders(<EmptyState />, {
      preloadedState: { ui: { ...baseUi, hasActiveProject: true } } as Partial<RootState>,
    });

    expect(screen.getByText('Dataset')).toBeInTheDocument();
    expect(screen.getByText('Function Node')).toBeInTheDocument();
    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });
});
