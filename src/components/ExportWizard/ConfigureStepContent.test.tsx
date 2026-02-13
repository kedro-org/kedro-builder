import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigureStepContent } from './ConfigureStepContent';

describe('ConfigureStepContent', () => {
  const defaultProps = {
    projectName: 'my_project',
    description: 'A pipeline',
    nodesCount: 3,
    datasetsCount: 5,
    hasWarnings: false,
    warningsCount: 0,
    onProjectNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onBack: vi.fn(),
    onExport: vi.fn(),
  };

  it('renders summary cards with correct counts and pre-filled form', () => {
    render(<ConfigureStepContent {...defaultProps} />);

    // Summary cards
    expect(screen.getByText('5')).toBeInTheDocument(); // datasets
    expect(screen.getByText('3')).toBeInTheDocument(); // nodes

    // Form pre-filled
    const nameInput = screen.getByLabelText(/Kedro project name/);
    expect(nameInput).toHaveValue('my_project');

    // Export button enabled for valid name
    expect(screen.getByText(/Download ZIP/)).not.toBeDisabled();
  });

  it('disables export when project name is invalid', async () => {
    const onExport = vi.fn();
    render(
      <ConfigureStepContent
        {...defaultProps}
        projectName="invalid name!!"
        onExport={onExport}
      />,
    );

    // Export should be disabled due to invalid characters
    expect(screen.getByText(/Download ZIP/)).toBeDisabled();

    // Validation error message should appear
    expect(screen.getByText(/Only letters, numbers, hyphens, and underscores allowed/)).toBeInTheDocument();

    // Clicking should not fire
    await userEvent.click(screen.getByText(/Download ZIP/));
    expect(onExport).not.toHaveBeenCalled();
  });
});
