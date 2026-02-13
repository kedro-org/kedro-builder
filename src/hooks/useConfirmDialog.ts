import { useState, useCallback } from 'react';

/**
 * Hook for managing confirmation dialog state.
 * Use with ConfirmDialog component for delete/destructive actions.
 *
 * @param onConfirm - Callback to execute when user confirms
 * @returns Dialog state and control functions (isOpen, open, close, confirm)
 */
export function useConfirmDialog(onConfirm: () => void) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = useCallback(() => {
    onConfirm();
    setIsOpen(false);
  }, [onConfirm]);

  return {
    isOpen,
    open,
    close,
    confirm,
  };
}
