import { useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useAppSelector } from '../../../store/hooks';
import {
  selectCanvasDataWithSets,
  selectSelectionType,
  selectTotalSelected,
} from '../../../features/canvas/canvasSelectors';

// Constants for edge styling (extracted to prevent recreation)
const MARKER_END_DEFAULT = {
  type: 'arrowclosed' as const,
  width: 12,
  height: 12,
  color: 'var(--color-connection)',
};

const MARKER_END_SELECTED = {
  type: 'arrowclosed' as const,
  width: 12,
  height: 12,
  color: 'var(--color-primary)',
};

const EDGE_STYLE_DEFAULT = {
  strokeWidth: 3,
  stroke: 'var(--color-connection)',
  strokeDasharray: '5, 5',
};

const EDGE_STYLE_SELECTED = {
  strokeWidth: 4,
  stroke: 'var(--color-primary)',
  strokeDasharray: '5, 5',
};

// Node color map for minimap (constant outside component)
const NODE_COLOR_MAP = {
  data_ingestion: 'var(--color-node-data-ingestion)',
  data_processing: 'var(--color-node-data-processing)',
  model_training: 'var(--color-node-model-training)',
  model_evaluation: 'var(--color-node-model-evaluation)',
  custom: 'var(--color-node-custom)',
} as const;

/**
 * Custom hook to manage canvas state including nodes, edges, and UI states
 */
export const useCanvasState = () => {
  // Get data from Redux using combined selector for better performance
  const {
    nodes: reduxNodes,
    datasets: reduxDatasets,
    connections: reduxConnections,
    selectedNodeIds,
    selectedEdgeIds,
    selectedNodeIdsSet,
    selectedEdgeIdsSet,
    theme,
  } = useAppSelector(selectCanvasDataWithSets);

  // Use memoized selectors for computed values
  const selectionType = useAppSelector(selectSelectionType);
  const totalSelected = useAppSelector(selectTotalSelected);

  // Check if canvas is empty
  const isEmpty = reduxNodes.length === 0 && reduxDatasets.length === 0;

  // Track dragging state for empty canvas visual feedback
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Track spacebar press for pan mode (like Figma)
  const [isPanMode, setIsPanMode] = useState(false);

  // Track connection state for visual feedback
  const [connectionState, setConnectionState] = useState<{
    source: string | null;
    target: string | null;
    isValid: boolean;
  }>({ source: null, target: null, isValid: true });

  // Convert Redux nodes to ReactFlow nodes with selection state
  // Uses Set for O(1) lookup instead of O(n) array.includes()
  const initialNodes = useMemo(
    () => {
      const nodes = reduxNodes.map((node) => ({
        id: node.id,
        type: 'kedroNode' as const,
        position: node.position,
        data: node,
        selected: selectedNodeIdsSet.has(node.id),
        draggable: true,
      }));

      const datasets = reduxDatasets.map((dataset) => ({
        id: dataset.id,
        type: 'datasetNode' as const,
        position: dataset.position,
        data: dataset,
        selected: selectedNodeIdsSet.has(dataset.id),
        draggable: true,
      }));

      return [...nodes, ...datasets];
    },
    [reduxNodes, reduxDatasets, selectedNodeIdsSet]
  );

  // Convert Redux connections to ReactFlow edges with selection state
  // Uses pre-computed constants for styling to prevent object recreation
  const initialEdges = useMemo(
    () =>
      reduxConnections.map((conn) => {
        const isSelected = selectedEdgeIdsSet.has(conn.id);
        return {
          id: conn.id,
          source: conn.source,
          target: conn.target,
          sourceHandle: conn.sourceHandle,
          targetHandle: conn.targetHandle,
          type: 'kedroEdge',
          animated: true,
          data: conn,
          selected: isSelected,
          markerEnd: isSelected ? MARKER_END_SELECTED : MARKER_END_DEFAULT,
          style: isSelected ? EDGE_STYLE_SELECTED : EDGE_STYLE_DEFAULT,
        };
      }),
    [reduxConnections, selectedEdgeIdsSet]
  );

  // Local ReactFlow state (for performance)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync Redux nodes to ReactFlow when Redux changes
  // Use useLayoutEffect to ensure sync happens before paint
  useLayoutEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Sync Redux edges to ReactFlow when Redux changes
  useLayoutEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Get node color for minimap - memoized to prevent child re-renders
  const getNodeColor = useCallback((node: Node) => {
    if (node.type === 'datasetNode') {
      return 'var(--color-dataset)';
    }
    return NODE_COLOR_MAP[node.data?.type as keyof typeof NODE_COLOR_MAP] || 'var(--color-node-fallback)';
  }, []);

  return {
    // Redux state
    reduxNodes,
    reduxDatasets,
    selectedNodeIds,
    selectedEdgeIds,
    theme,

    // Canvas state
    isEmpty,
    isDraggingOver,
    setIsDraggingOver,
    isPanMode,
    setIsPanMode,
    connectionState,
    setConnectionState,

    // ReactFlow state
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,

    // Computed values
    selectionType,
    totalSelected,
    getNodeColor,
  };
};
