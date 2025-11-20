import { useCallback, useState } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { clearSelection, deleteNodes } from '../../../features/nodes/nodesSlice';
import { deleteDataset } from '../../../features/datasets/datasetsSlice';
import { clearConnectionSelection, deleteConnections } from '../../../features/connections/connectionsSlice';
import { logger } from '../../../utils/logger';

// Types for delete confirmation state
export interface DeleteConfirmation {
  type: 'bulk' | 'edges';
  count: number;
  nodeIds?: string[];
  edgeIds?: string[];
}

/**
 * Hook for managing delete confirmation dialogs
 * Handles both bulk deletion (nodes + datasets) and edge deletion
 */
export const useDeleteConfirmation = () => {
  const dispatch = useAppDispatch();
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);

  // Show bulk delete confirmation
  const showBulkDeleteConfirmation = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      const totalCount = nodeIds.length + edgeIds.length;
      if (totalCount > 1) {
        setDeleteConfirmation({
          type: 'bulk',
          count: totalCount,
          nodeIds,
          edgeIds,
        });
        return true; // Confirmation required
      }
      return false; // No confirmation needed
    },
    []
  );

  // Show edges delete confirmation
  const showEdgesDeleteConfirmation = useCallback((edgeIds: string[]) => {
    if (edgeIds.length > 1) {
      setDeleteConfirmation({
        type: 'edges',
        count: edgeIds.length,
        edgeIds,
      });
      return true; // Confirmation required
    }
    return false; // No confirmation needed
  }, []);

  // Execute the actual deletion after confirmation
  const confirmDelete = useCallback(() => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'bulk') {
      // Delete nodes and datasets
      if (deleteConfirmation.nodeIds && deleteConfirmation.nodeIds.length > 0) {
        deleteConfirmation.nodeIds.forEach((id) => {
          if (id.startsWith('node-')) {
            dispatch(deleteNodes([id]));
          } else if (id.startsWith('dataset-')) {
            dispatch(deleteDataset(id));
          }
        });
        dispatch(clearSelection());
      }
      // Delete edges
      if (deleteConfirmation.edgeIds && deleteConfirmation.edgeIds.length > 0) {
        dispatch(deleteConnections(deleteConfirmation.edgeIds));
        dispatch(clearConnectionSelection());
      }
    } else if (deleteConfirmation.type === 'edges') {
      // Delete only edges
      if (deleteConfirmation.edgeIds && deleteConfirmation.edgeIds.length > 0) {
        dispatch(deleteConnections(deleteConfirmation.edgeIds));
        dispatch(clearConnectionSelection());
      }
    }

    logger.debug('Delete confirmed and executed');
    setDeleteConfirmation(null);
  }, [deleteConfirmation, dispatch]);

  // Cancel delete action
  const cancelDelete = useCallback(() => {
    logger.debug('Delete cancelled');
    setDeleteConfirmation(null);
  }, []);

  return {
    deleteConfirmation,
    showBulkDeleteConfirmation,
    showEdgesDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  };
};
