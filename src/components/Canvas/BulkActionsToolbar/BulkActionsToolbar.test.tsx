import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActionsToolbar } from './BulkActionsToolbar';

describe('BulkActionsToolbar', () => {
  it('returns null when nothing is selected', () => {
    const { container } = render(
      <BulkActionsToolbar
        selectedCount={0}
        selectedType="nodes"
        onDelete={vi.fn()}
        onClear={vi.fn()}
      />
    );

    expect(container.querySelector('.bulk-actions-toolbar')).toBeNull();
  });

  it('shows count, delete button, and calls onDelete on click', () => {
    const onDelete = vi.fn();

    render(
      <BulkActionsToolbar
        selectedCount={3}
        selectedType="nodes"
        onDelete={onDelete}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/nodes selected/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
