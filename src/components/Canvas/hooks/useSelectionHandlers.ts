import { useCallback, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Edge, EdgeMouseHandler, OnSelectionChangeParams } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import {
  clearSelection,
  deleteNodes,
  selectNodes,
} from '../../../features/nodes/nodesSlice';
import { deleteDataset } from '../../../features/datasets/datasetsSlice';
import {
  selectConnection,
  clearConnectionSelection,
  deleteConnections,
} from '../../../features/connections/connectionsSlice';
import { closeConfigPanel } from '../../../features/ui/uiSlice';
import { logger } from '../../../utils/logger';
import type { KedroNode, KedroDataset } from '../../../types/kedro';

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
 * Custom hook for handling selection-related events and keyboard shortcuts
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

  // Bulk actions handlers
  const handleBulkDelete = useCallback(() => {
    const totalSelected = selectedNodeIds.length + selectedEdgeIds.length;

    // Show confirmation dialog for bulk delete
    if (totalSelected > 1) {
      const confirmMessage = `Delete ${totalSelected} selected items? This cannot be undone.`;
      if (!window.confirm(confirmMessage)) {
        return; // User cancelled
      }
    }

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
  }, [dispatch, selectedNodeIds, selectedEdgeIds]);

  const handleBulkClear = useCallback(() => {
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());
  }, [dispatch]);

  // Handle ReactFlow edge deletion (triggered by Delete key via ReactFlow)
  const handleEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      logger.delete('Edges to delete:', edgesToDelete.map((e) => e.id));

      // Show confirmation dialog for multi-delete
      if (edgesToDelete.length > 1) {
        const confirmMessage = `Delete ${edgesToDelete.length} selected connections? This cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
          return; // User cancelled
        }
      }

      const edgeIds = edgesToDelete.map((edge) => edge.id);
      if (edgeIds.length > 0) {
        dispatch(deleteConnections(edgeIds));
        dispatch(clearConnectionSelection());
      }
    },
    [dispatch]
  );

  // Handle keyboard shortcuts (Escape, Cmd+A, and Spacebar for pan mode)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contentEditable element
      const target = event.target as HTMLElement;
      const isEditableElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Spacebar - enable pan mode (like Figma)
      // BUT: Don't intercept if user is typing in an editable field
      if (event.code === 'Space' && !isPanMode && !isEditableElement) {
        event.preventDefault();
        setIsPanMode(true);
      }

      // Escape key - clear selection and close config panel
      if (event.key === 'Escape') {
        dispatch(clearSelection());
        dispatch(clearConnectionSelection());
        dispatch(closeConfigPanel());
      }

      // Cmd/Ctrl + A - select all
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        const allNodeIds = [...reduxNodes.map((n) => n.id), ...reduxDatasets.map((d) => d.id)];
        dispatch(selectNodes(allNodeIds));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Spacebar released - disable pan mode
      if (event.code === 'Space' && isPanMode) {
        setIsPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch, reduxNodes, reduxDatasets, isPanMode, setIsPanMode]);

  // Listen for focus node event from validation panel
  useEffect(() => {
    const handleFocusNode = (event: any) => {
      const { nodeId } = event.detail;
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

  return {
    handleEdgeClick,
    handlePaneClick,
    handleSelectionChange,
    handleBulkDelete,
    handleBulkClear,
    handleEdgesDelete,
  };
};
