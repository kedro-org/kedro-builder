import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { ExportWizard } from './ExportWizard';
import type { ValidationResult } from '@/utils/validation';
import type { RootState } from '@/store';

const cleanValidation: ValidationResult = {
  errors: [],
  warnings: [],
  isValid: true,
};

const preloadedState = {
  project: {
    current: {
      id: 'p1', name: 'my_project', pythonPackage: 'my_project',
      pipelineName: 'default', description: 'A test', createdAt: 1, updatedAt: 1,
    },
  },
  nodes: { byId: {}, allIds: ['n1'], selected: [], hovered: null },
  datasets: { byId: {}, allIds: ['d1', 'd2'], selected: [] },
  connections: { byId: {}, allIds: [], selected: [] },
} as Partial<RootState>;

describe('ExportWizard', () => {
  it('returns null when isOpen is false', () => {
    const { container } = renderWithProviders(
      <ExportWizard isOpen={false} onClose={vi.fn()} validationResult={cleanValidation} onExport={vi.fn()} />,
      { preloadedState },
    );

    expect(container.querySelector('.export-wizard')).toBeNull();
  });

  it('renders title and validation step when open with clean validation', () => {
    renderWithProviders(
      <ExportWizard isOpen={true} onClose={vi.fn()} validationResult={cleanValidation} onExport={vi.fn()} />,
      { preloadedState },
    );

    expect(screen.getByText('Export Kedro Project')).toBeInTheDocument();
    expect(screen.getByText('Validation Passed!')).toBeInTheDocument();
    expect(screen.getByText('Continue')).not.toBeDisabled();
  });
});
