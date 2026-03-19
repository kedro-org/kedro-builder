import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node, NodeMouseHandler, OnNodesChange, NodeChange } from '@xyflow/react';
import { useAppDispatch } from '@/store/hooks';
import {
  addNode,
  updateNodePosition,
  selectNode,
  toggleNodeSelection,
  clearSelection,
} from '@/features/nodes/nodesSlice';
import {
  addDataset,
  updateDatasetPosition,
} from '@/features/datasets/datasetsSlice';
import { openConfigPanel, setPendingComponent } from '@/features/ui/uiSlice';
import { clearConnectionSelection } from '@/features/connections/connectionsSlice';
import { generateId, isNodeId, isDatasetId } from '@/domain/IdGenerator';
import { useSelectAndOpenConfig } from '@/hooks/useSelectAndOpenConfig';
import { useDeleteItems } from './useDeleteItems';
import { logger } from '@/utils/logger';
import { trackEvent } from '@/infrastructure/telemetry';
import { DND_TYPES } from '@/constants';
import type { DatasetType } from '@/types/kedro';

// Type for node delete confirmation state
export interface NodeDeleteConfirmation {
  count: number;
  nodeIds: string[];
  datasetIds: string[];
}

interface NodeHandlersProps {
  onNodesChange: OnNodesChange;
  setIsDraggingOver: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingOver: boolean;
  isEmpty: boolean;
}

/**
 * Custom hook for handling node-related events (CRUD operations)
 */
export const useNodeHandlers = ({ onNodesChange, setIsDraggingOver, isDraggingOver, isEmpty }: NodeHandlersProps) => {
  const dispatch = useAppDispatch();
  const { screenToFlowPosition } = useReactFlow();
  const selectAndOpenConfig = useSelectAndOpenConfig();
  const deleteItems = useDeleteItems();

  // State for custom delete confirmation dialog
  const [nodeDeleteConfirmation, setNodeDeleteConfirmation] = useState<NodeDeleteConfirmation | null>(null);

  // Handle ReactFlow node deletion (triggered by Delete key via ReactFlow)
  const handleNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      logger.delete('Nodes to delete:', nodesToDelete.map((n) => n.id));

      // Separate nodes and datasets
      const nodeIdsToDelete: string[] = [];
      const datasetIdsToDelete: string[] = [];

      nodesToDelete.forEach((node) => {
        if (isNodeId(node.id)) {
          nodeIdsToDelete.push(node.id);
        } else if (isDatasetId(node.id)) {
          datasetIdsToDelete.push(node.id);
        }
      });

      // Show custom confirmation dialog for all deletions
      if (nodesToDelete.length >= 1) {
        setNodeDeleteConfirmation({
          count: nodesToDelete.length,
          nodeIds: nodeIdsToDelete,
          datasetIds: datasetIdsToDelete,
        });
        return; // Wait for confirmation
      }
    },
    []
  );

  // Confirm node delete action
  const confirmNodeDelete = useCallback(() => {
    if (!nodeDeleteConfirmation) return;

    deleteItems([
      ...nodeDeleteConfirmation.nodeIds,
      ...nodeDeleteConfirmation.datasetIds,
    ]);
    setNodeDeleteConfirmation(null);
  }, [nodeDeleteConfirmation, deleteItems]);

  // Cancel node delete action
  const cancelNodeDelete = useCallback(() => {
    setNodeDeleteConfirmation(null);
  }, []);

  // Sync position changes to Redux (immediate for smooth edges)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Update Redux immediately during and after dragging for smooth edge rendering
      changes.forEach((change: NodeChange) => {
        if (change.type === 'position' && change.position) {
          // Determine if it's a node or dataset using type guards
          if (isNodeId(change.id)) {
            dispatch(
              updateNodePosition({
                id: change.id,
                position: change.position,
              })
            );
          } else if (isDatasetId(change.id)) {
            dispatch(
              updateDatasetPosition({
                id: change.id,
                position: change.position,
              })
            );
          }
        }
      });
    },
    [onNodesChange, dispatch]
  );

  // Handle drop from sidebar (both nodes and datasets)
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Reset dragging state
      setIsDraggingOver(false);

      // Check for node drop using centralized DnD constants
      const nodeType = event.dataTransfer.getData(DND_TYPES.NODE);
      const datasetType = event.dataTransfer.getData(DND_TYPES.DATASET);

      if (!nodeType && !datasetType) return;

      // Clear any existing selection before adding new component
      dispatch(clearSelection());
      dispatch(clearConnectionSelection());

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (nodeType) {
        // Generate ID first and pass it to addNode to ensure consistency
        const newNodeId = generateId('node');
        dispatch(
          addNode({
            id: newNodeId,
            name: '',
            type: nodeType,
            inputs: [],
            outputs: [],
            position,
          })
        );

        // Track node addition
        trackEvent('node_added', {
          type: nodeType,
        });

        dispatch(setPendingComponent({ type: 'node', id: newNodeId }));
        selectAndOpenConfig('node', newNodeId);
      } else if (datasetType) {
        // Generate ID first and pass it to addDataset to ensure consistency
        const newDatasetId = generateId('dataset');
        dispatch(
          addDataset({
            id: newDatasetId,
            name: '',
            type: datasetType as DatasetType,
            position,
          })
        );

        // Track dataset addition
        trackEvent('dataset_added', {
          type: datasetType,
        });

        dispatch(setPendingComponent({ type: 'dataset', id: newDatasetId }));
        selectAndOpenConfig('dataset', newDatasetId);
      }
    },
    [screenToFlowPosition, dispatch, setIsDraggingOver, selectAndOpenConfig]
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      // Only reset if leaving the main canvas container
      if (event.currentTarget === event.target) {
        setIsDraggingOver(false);
      }
    },
    [setIsDraggingOver]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      // Set dragging state for visual feedback on empty canvas
      if (isEmpty && !isDraggingOver) {
        setIsDraggingOver(true);
      }
    },
    [isEmpty, isDraggingOver, setIsDraggingOver]
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      logger.click('Clicked on node:', node.id);

      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        event.stopPropagation();
        dispatch(toggleNodeSelection(node.id));
      } else {
        dispatch(selectNode(node.id));
        logger.debug('Dispatched selectNode for:', node.id);

        if (node.type === 'kedroNode') {
          logger.debug('Opening node config panel');
          dispatch(openConfigPanel({ type: 'node', id: node.id }));
        } else if (node.type === 'datasetNode') {
          logger.debug('Opening dataset config panel');
          dispatch(openConfigPanel({ type: 'dataset', id: node.id }));
        }
      }
    },
    [dispatch]
  );

  return {
    handleNodesDelete,
    handleNodesChange,
    handleDrop,
    handleDragLeave,
    handleDragOver,
    handleNodeClick,
    nodeDeleteConfirmation,
    confirmNodeDelete,
    cancelNodeDelete,
  };
};
