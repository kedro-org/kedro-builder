import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { clearSelection, deleteNodes } from '@/features/nodes/nodesSlice';
import { deleteDataset } from '@/features/datasets/datasetsSlice';
import { clearConnectionSelection, deleteConnections } from '@/features/connections/connectionsSlice';
import { closeConfigPanel } from '@/features/ui/uiSlice';
import { isNodeId, isDatasetId } from '@/domain/IdGenerator';

/**
 * Shared hook for executing delete operations on pipeline components.
 * Returns a function that classifies IDs by type and dispatches the appropriate delete actions.
 */
export function useDeleteItems() {
  const dispatch = useAppDispatch();

  return useCallback(
    (componentIds: string[], edgeIds: string[] = []) => {
      const nodeIds = componentIds.filter(isNodeId);
      const datasetIds = componentIds.filter(isDatasetId);

      if (nodeIds.length > 0) dispatch(deleteNodes(nodeIds));
      datasetIds.forEach((id) => dispatch(deleteDataset(id)));
      if (componentIds.length > 0) dispatch(clearSelection());

      if (edgeIds.length > 0) {
        dispatch(deleteConnections(edgeIds));
        dispatch(clearConnectionSelection());
      }

      dispatch(closeConfigPanel());
    },
    [dispatch]
  );
}
