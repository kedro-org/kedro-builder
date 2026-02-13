import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepIndicator } from './StepIndicator';

describe('StepIndicator', () => {
  it('marks step 1 as active and step 2 as pending on validation step', () => {
    const { container } = render(
      <StepIndicator currentStep="validation" validationPassed={false} />,
    );

    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Review & Export')).toBeInTheDocument();

    // Step 1 should be active
    const step1 = container.querySelector('.export-wizard__step--active');
    expect(step1).not.toBeNull();

    // Step 2 should be pending
    const step2 = container.querySelector('.export-wizard__step--pending');
    expect(step2).not.toBeNull();

    // No "Passed" badge yet
    expect(screen.queryByText('Passed')).toBeNull();
  });

  it('shows "Passed" badge on step 1 when on configure step with validation passed', () => {
    render(
      <StepIndicator currentStep="configure" validationPassed={true} />,
    );

    // Validation step should show completion badge
    expect(screen.getByText('Passed')).toBeInTheDocument();

    // Step 2 (configure) is now active
    expect(screen.getByText('Review & Export')).toBeInTheDocument();
  });
});
