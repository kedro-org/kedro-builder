import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { clearSelection } from '../features/nodes/nodesSlice';
import { clearConnectionSelection } from '../features/connections/connectionsSlice';

/**
 * Hook that provides a function to clear all selections (nodes and connections)
 * This pattern is commonly needed across the canvas when:
 * - User clicks empty canvas area
 * - User presses Escape
 * - After paste operation
 * - After delete operation
 */
export function useClearSelections() {
  const dispatch = useAppDispatch();

  const clearAllSelections = useCallback(() => {
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());
  }, [dispatch]);

  return clearAllSelections;
}
