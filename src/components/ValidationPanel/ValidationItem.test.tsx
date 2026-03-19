import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { ValidationItem } from './ValidationItem';
import type { ValidationError } from '@/validation/types';
import type { RootState } from '@/store';

const mockNode = {
  id: 'node-1', name: 'clean_data', type: 'data_processing' as const,
  inputs: [], outputs: [], position: { x: 0, y: 0 },
};

const errorIssue: ValidationError = {
  id: 'err-1',
  code: 'empty-name',
  severity: 'error',
  componentId: 'node-1',
  componentType: 'node',
  message: 'Node name is empty',
  suggestion: 'Add a descriptive name',
};

const state: Partial<RootState> = {
  nodes: { byId: { 'node-1': mockNode }, allIds: ['node-1'], selected: [], hovered: null },
  datasets: { byId: {}, allIds: [], selected: [] },
};

describe('ValidationItem', () => {
  it('renders error message, component name, and suggestion', () => {
    renderWithProviders(<ValidationItem issue={errorIssue} />, { preloadedState: state });

    expect(screen.getByText('Node name is empty')).toBeInTheDocument();
    expect(screen.getByText('clean_data')).toBeInTheDocument();
    expect(screen.getByText('Add a descriptive name')).toBeInTheDocument();
  });

  it('shows "Unknown Node" when the referenced node does not exist', () => {
    const orphanIssue: ValidationError = {
      ...errorIssue,
      componentId: 'node-deleted',
    };

    renderWithProviders(<ValidationItem issue={orphanIssue} />, {
      preloadedState: { nodes: { byId: {}, allIds: [], selected: [], hovered: null }, datasets: { byId: {}, allIds: [], selected: [] } },
    });

    expect(screen.getByText('Unknown Node')).toBeInTheDocument();
  });
});
