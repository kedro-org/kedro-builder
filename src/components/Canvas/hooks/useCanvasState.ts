import { useState, useMemo, useEffect } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useAppSelector } from '../../../store/hooks';
import { selectAllNodes } from '../../../features/nodes/nodesSelectors';
import { selectAllDatasets } from '../../../features/datasets/datasetsSelectors';
import { selectAllConnections } from '../../../features/connections/connectionsSelectors';

/**
 * Custom hook to manage canvas state including nodes, edges, and UI states
 */
export const useCanvasState = () => {
  // Get data from Redux
  const reduxNodes = useAppSelector(selectAllNodes);
  const reduxDatasets = useAppSelector(selectAllDatasets);
  const reduxConnections = useAppSelector(selectAllConnections);
  const selectedNodeIds = useAppSelector((state) => state.nodes.selected);
  const selectedEdgeIds = useAppSelector((state) => state.connections.selected);
  const theme = useAppSelector((state) => state.theme.theme);

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
  const initialNodes = useMemo(
    () => {
      const nodes = reduxNodes.map((node) => ({
        id: node.id,
        type: 'kedroNode' as const,
        position: node.position,
        data: node,
        selected: selectedNodeIds.includes(node.id),
        draggable: true,
      }));

      const datasets = reduxDatasets.map((dataset) => ({
        id: dataset.id,
        type: 'datasetNode' as const,
        position: dataset.position,
        data: dataset,
        selected: selectedNodeIds.includes(dataset.id),
        draggable: true,
      }));

      return [...nodes, ...datasets];
    },
    [reduxNodes, reduxDatasets, selectedNodeIds]
  );

  // Convert Redux connections to ReactFlow edges with selection state
  const initialEdges = useMemo(
    () =>
      reduxConnections.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        type: 'kedroEdge',
        animated: true,
        data: conn,
        selected: selectedEdgeIds.includes(conn.id),
        markerEnd: {
          type: 'arrowclosed' as const,
          width: 12,
          height: 12,
          color: selectedEdgeIds.includes(conn.id) ? 'var(--color-primary)' : 'var(--color-connection)',
        },
        style: {
          strokeWidth: selectedEdgeIds.includes(conn.id) ? 4 : 3,
          stroke: selectedEdgeIds.includes(conn.id) ? 'var(--color-primary)' : 'var(--color-connection)',
          strokeDasharray: '5, 5',
        },
      })),
    [reduxConnections, selectedEdgeIds]
  );

  // Local ReactFlow state (for performance)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync Redux nodes to ReactFlow when Redux changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Sync Redux edges to ReactFlow when Redux changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Determine selection type for bulk actions
  const selectionType: 'nodes' | 'edges' | 'mixed' = useMemo(() => {
    if (selectedNodeIds.length > 0 && selectedEdgeIds.length > 0) return 'mixed';
    if (selectedNodeIds.length > 0) return 'nodes';
    if (selectedEdgeIds.length > 0) return 'edges';
    return 'nodes';
  }, [selectedNodeIds, selectedEdgeIds]);

  const totalSelected = selectedNodeIds.length + selectedEdgeIds.length;

  // Get node color for minimap
  const getNodeColor = (node: Node) => {
    if (node.type === 'datasetNode') {
      return 'var(--color-dataset)';
    }

    const colors = {
      data_ingestion: 'var(--color-node-data-ingestion)',
      data_processing: 'var(--color-node-data-processing)',
      model_training: 'var(--color-node-model-training)',
      model_evaluation: 'var(--color-node-model-evaluation)',
      custom: 'var(--color-node-custom)',
    };
    return colors[node.data?.type as keyof typeof colors] || 'var(--color-node-fallback)';
  };

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
