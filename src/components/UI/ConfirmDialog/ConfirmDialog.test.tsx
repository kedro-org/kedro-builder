import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Node',
    message: 'Are you sure you want to delete this node?',
  };

  it('renders title, message, and action buttons when open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Delete Node')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this node?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

    fireEvent.click(screen.getByText('Delete'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
