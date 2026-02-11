import { useCallback, useState } from 'react';
import { logger } from '@/utils/logger';
import { useDeleteItems } from './useDeleteItems';

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
  const deleteItems = useDeleteItems();
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);

  // Show bulk delete confirmation
  const showBulkDeleteConfirmation = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      const totalCount = nodeIds.length + edgeIds.length;
      if (totalCount >= 1) {
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
    if (edgeIds.length >= 1) {
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

    deleteItems(
      deleteConfirmation.nodeIds ?? [],
      deleteConfirmation.edgeIds ?? [],
    );

    logger.debug('Delete confirmed and executed');
    setDeleteConfirmation(null);
  }, [deleteConfirmation, deleteItems]);

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
