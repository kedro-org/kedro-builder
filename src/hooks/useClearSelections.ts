import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { clearSelection } from '../features/nodes/nodesSlice';
import { clearConnectionSelection } from '../features/connections/connectionsSlice';

/**
 * Hook that provides a function to clear all selections (nodes and connections).
 * Use when user clicks canvas, presses Escape, or after paste/delete operations.
 *
 * @returns Function to clear all selections
 */
export function useClearSelections() {
  const dispatch = useAppDispatch();

  const clearAllSelections = useCallback(() => {
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());
  }, [dispatch]);

  return clearAllSelections;
}
