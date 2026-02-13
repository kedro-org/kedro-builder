import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { DatasetConfigForm } from './DatasetConfigForm';
import type { KedroDataset } from '@/types/kedro';

// Mock only dispatchConfigUpdated, keep all other exports
vi.mock('@/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants')>();
  return { ...actual, dispatchConfigUpdated: vi.fn() };
});

const csvDataset: KedroDataset = {
  id: 'ds-1', name: 'raw_companies', type: 'csv',
  filepath: 'data/01_raw/companies.csv', position: { x: 0, y: 0 },
};

const memoryDataset: KedroDataset = {
  id: 'ds-2', name: 'temp_buffer', type: 'memory',
  position: { x: 0, y: 0 },
};

const defaultState = {
  datasets: {
    byId: { 'ds-1': csvDataset, 'ds-2': memoryDataset },
    allIds: ['ds-1', 'ds-2'],
    selected: [],
  },
  ui: {
    showTutorial: false, tutorialStep: 1, tutorialCompleted: false,
    showWalkthrough: false, walkthroughStep: 1, walkthroughCompleted: false,
    showProjectSetup: false, hasActiveProject: true,
    selectedComponent: { type: 'dataset' as const, id: 'ds-1' },
    showConfigPanel: true, showCodePreview: false, showValidationPanel: false,
    canvasZoom: 1, canvasPosition: { x: 0, y: 0 },
    showCodeViewer: false, selectedCodeFile: null,
    showExportWizard: false, pendingComponentId: null,
  },
};

describe('DatasetConfigForm', () => {
  const onClose = vi.fn();

  beforeEach(() => onClose.mockClear());

  it('pre-fills the form with dataset name', () => {
    renderWithProviders(
      <DatasetConfigForm dataset={csvDataset} onClose={onClose} />,
      { preloadedState: defaultState },
    );

    expect(screen.getByDisplayValue('raw_companies')).toBeInTheDocument();
  });

  it('Save button is disabled when form has not been modified', () => {
    renderWithProviders(
      <DatasetConfigForm dataset={csvDataset} onClose={onClose} />,
      { preloadedState: defaultState },
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it('hides filepath section when type is memory', () => {
    renderWithProviders(
      <DatasetConfigForm dataset={memoryDataset} onClose={onClose} />,
      { preloadedState: defaultState },
    );

    // Memory datasets should not show filepath builder
    expect(screen.queryByText(/Enable versioning/)).not.toBeInTheDocument();
  });
});
