import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { ValidationStepContent } from './ValidationStepContent';
import type { ValidationResult } from '@/validation';
import type { RootState } from '@/store';

const preloadedState = {
  nodes: { byId: {}, allIds: [], selected: [], hovered: null },
  datasets: { byId: {}, allIds: [], selected: [] },
} as Partial<RootState>;

describe('ValidationStepContent', () => {
  it('shows success message and enabled Continue when validation is clean', () => {
    const result: ValidationResult = { errors: [], warnings: [], isValid: true };

    renderWithProviders(
      <ValidationStepContent validationResult={result} onContinue={vi.fn()} onClose={vi.fn()} />,
      { preloadedState },
    );

    expect(screen.getByText('Validation Passed!')).toBeInTheDocument();
    expect(screen.getByText('Continue')).not.toBeDisabled();
  });

  it('disables Continue when there are errors and shows error count', async () => {
    const result: ValidationResult = {
      errors: [
        { id: 'e1', code: 'missing-code', severity: 'error', message: 'Missing code', componentId: 'n1', componentType: 'node', suggestion: 'Add code' },
      ],
      warnings: [
        { id: 'w1', code: 'orphaned-dataset', severity: 'warning', message: 'Orphaned ds', componentId: 'd1', componentType: 'dataset', suggestion: 'Connect it' },
      ],
      isValid: false,
    };

    const onContinue = vi.fn();
    renderWithProviders(
      <ValidationStepContent validationResult={result} onContinue={onContinue} onClose={vi.fn()} />,
      { preloadedState },
    );

    // Error tab should be shown with count
    expect(screen.getByText(/Errors \(1\)/)).toBeInTheDocument();
    // Continue should be disabled
    expect(screen.getByText('Continue')).toBeDisabled();

    // Clicking Continue should NOT call the handler
    await userEvent.click(screen.getByText('Continue'));
    expect(onContinue).not.toHaveBeenCalled();
  });
});
