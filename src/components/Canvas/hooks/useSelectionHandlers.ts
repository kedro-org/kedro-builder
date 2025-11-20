import { useCallback, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Edge, EdgeMouseHandler, OnSelectionChangeParams } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import { clearSelection, deleteNodes, selectNodes } from '../../../features/nodes/nodesSlice';
import { deleteDataset } from '../../../features/datasets/datasetsSlice';
import {
  selectConnection,
  clearConnectionSelection,
  deleteConnections,
} from '../../../features/connections/connectionsSlice';
import { closeConfigPanel } from '../../../features/ui/uiSlice';
import { logger } from '../../../utils/logger';
import type { KedroNode, KedroDataset } from '../../../types/kedro';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useCopyPaste } from './useCopyPaste';
import { useCanvasKeyboardShortcuts } from './useCanvasKeyboardShortcuts';

interface SelectionHandlersProps {
  reduxNodes: KedroNode[];
  reduxDatasets: KedroDataset[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  isPanMode: boolean;
  setIsPanMode: React.Dispatch<React.SetStateAction<boolean>>;
  exportWizardOpen: boolean;
}

/**
 * Main hook for handling selection-related events and user interactions
 * Orchestrates sub-hooks for delete confirmation, copy/paste, and keyboard shortcuts
 */
export const useSelectionHandlers = ({
  reduxNodes,
  reduxDatasets,
  selectedNodeIds,
  selectedEdgeIds,
  isPanMode,
  setIsPanMode,
  exportWizardOpen,
}: SelectionHandlersProps) => {
  const dispatch = useAppDispatch();
  const { fitView, getNode } = useReactFlow();

  // Delete confirmation sub-hook
  const {
    deleteConfirmation,
    showBulkDeleteConfirmation,
    showEdgesDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation();

  // Copy/paste sub-hook
  const { handleCopy, handlePaste } = useCopyPaste(selectedNodeIds, reduxNodes, reduxDatasets);

  // Keyboard shortcuts sub-hook
  useCanvasKeyboardShortcuts({
    reduxNodes,
    reduxDatasets,
    isPanMode,
    setIsPanMode,
    onCopy: handleCopy,
    onPaste: handlePaste,
  });

  // ===== Selection Handlers =====

  // Handle edge click - select edge to show BulkActionsToolbar
  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.stopPropagation();

      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        // Multi-select edge (adds to selection)
        dispatch(selectConnection(edge.id));
      } else {
        // Single select edge (clears other selections and closes config panel)
        dispatch(clearSelection());
        dispatch(closeConfigPanel());
        dispatch(selectConnection(edge.id));
      }
      // BulkActionsToolbar will automatically show when edge is selected
    },
    [dispatch]
  );

  // Handle canvas click (clear selection and close config panel)
  const handlePaneClick = useCallback(() => {
    logger.click('Clearing selection and closing config panel');
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());
    dispatch(closeConfigPanel());
  }, [dispatch]);

  // Handle selection change from ReactFlow (box selection)
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      // Disable selection when export wizard is open
      if (exportWizardOpen) {
        return;
      }

      const nodeIds = selectedNodes.map((n) => n.id);

      if (nodeIds.length > 0) {
        dispatch(selectNodes(nodeIds));
      }
      // Don't clear selection here - let pane click handle it
    },
    [dispatch, exportWizardOpen]
  );

  // ===== Bulk Action Handlers =====

  // Bulk delete with confirmation for multiple items
  const handleBulkDelete = useCallback(() => {
    const needsConfirmation = showBulkDeleteConfirmation(selectedNodeIds, selectedEdgeIds);

    // If no confirmation needed (single item), delete immediately
    if (!needsConfirmation) {
      if (selectedNodeIds.length > 0) {
        selectedNodeIds.forEach((id) => {
          if (id.startsWith('node-')) {
            dispatch(deleteNodes([id]));
          } else if (id.startsWith('dataset-')) {
            dispatch(deleteDataset(id));
          }
        });
        dispatch(clearSelection());
      }
      if (selectedEdgeIds.length > 0) {
        dispatch(deleteConnections(selectedEdgeIds));
        dispatch(clearConnectionSelection());
      }
    }
  }, [dispatch, selectedNodeIds, selectedEdgeIds, showBulkDeleteConfirmation]);

  // Clear selection
  const handleBulkClear = useCallback(() => {
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());
  }, [dispatch]);

  // Handle ReactFlow edge deletion (triggered by Delete key via ReactFlow)
  const handleEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      logger.delete('Edges to delete:', edgesToDelete.map((e) => e.id));

      const edgeIds = edgesToDelete.map((edge) => edge.id);
      const needsConfirmation = showEdgesDeleteConfirmation(edgeIds);

      // If no confirmation needed (single edge), delete immediately
      if (!needsConfirmation && edgeIds.length > 0) {
        dispatch(deleteConnections(edgeIds));
        dispatch(clearConnectionSelection());
      }
    },
    [dispatch, showEdgesDeleteConfirmation]
  );

  // ===== Focus Node Event Listener =====

  // Listen for focus node event from validation panel
  useEffect(() => {
    const handleFocusNode = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string }>;
      const { nodeId } = customEvent.detail;
      const node = getNode(nodeId);
      if (node) {
        // Center the node in view with animation
        fitView({
          nodes: [node],
          duration: 800,
          padding: 0.3,
        });
      }
    };

    window.addEventListener('focusNode', handleFocusNode);
    return () => {
      window.removeEventListener('focusNode', handleFocusNode);
    };
  }, [fitView, getNode]);

  // ===== Return Public API =====

  return {
    // Selection handlers
    handleEdgeClick,
    handlePaneClick,
    handleSelectionChange,

    // Bulk actions
    handleBulkDelete,
    handleBulkClear,
    handleEdgesDelete,

    // Delete confirmation
    deleteConfirmation,
    confirmDelete,
    cancelDelete,
  };
};
