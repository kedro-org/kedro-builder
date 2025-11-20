import { useCallback, useState, useEffect, useRef } from 'react';
import { addEdge, useReactFlow } from '@xyflow/react';
import type { Connection, Edge, Node, OnConnect, OnConnectStart, OnConnectEnd } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import { addConnection } from '../../../features/connections/connectionsSlice';
import { addNode } from '../../../features/nodes/nodesSlice';
import { addDataset } from '../../../features/datasets/datasetsSlice';
import { openConfigPanel, setPendingComponent } from '../../../features/ui/uiSlice';
import { store } from '../../../store';
import toast from 'react-hot-toast';
import { TIMING } from '../../../constants/timing';
import { trackEvent } from '../../../utils/telemetry';
import type { KedroNode, KedroDataset } from '../../../types/kedro';

// Type for ghost preview state
export interface GhostPreviewState {
  sourceId: string;
  sourceType: 'node' | 'dataset';
  position: { x: number; y: number };
}

/**
 * Check if adding a new connection would create a cycle
 * Uses DFS to detect cycles in the graph
 */
function wouldCreateCycle(
  newSource: string,
  newTarget: string,
  existingConnections: Array<{ source: string; target: string }>,
  nodeIds: string[],
  datasetIds: string[]
): boolean {
  // Build dependency graph including the new connection
  // We need to trace: node → dataset → node paths

  // Map of dataset inputs and outputs
  const datasetInputs = new Map<string, string[]>(); // dataset -> nodes that produce it
  const datasetOutputs = new Map<string, string[]>(); // dataset -> nodes that consume it

  // Add existing connections
  existingConnections.forEach((conn) => {
    // node → dataset
    if (conn.source.startsWith('node-') && conn.target.startsWith('dataset-')) {
      if (!datasetInputs.has(conn.target)) datasetInputs.set(conn.target, []);
      datasetInputs.get(conn.target)!.push(conn.source);
    }
    // dataset → node
    else if (conn.source.startsWith('dataset-') && conn.target.startsWith('node-')) {
      if (!datasetOutputs.has(conn.source)) datasetOutputs.set(conn.source, []);
      datasetOutputs.get(conn.source)!.push(conn.target);
    }
  });

  // Add the new connection
  if (newSource.startsWith('node-') && newTarget.startsWith('dataset-')) {
    if (!datasetInputs.has(newTarget)) datasetInputs.set(newTarget, []);
    datasetInputs.get(newTarget)!.push(newSource);
  } else if (newSource.startsWith('dataset-') && newTarget.startsWith('node-')) {
    if (!datasetOutputs.has(newSource)) datasetOutputs.set(newSource, []);
    datasetOutputs.get(newSource)!.push(newTarget);
  }

  // Build node-to-node graph through datasets
  const graph = new Map<string, Set<string>>();
  nodeIds.forEach((nodeId) => graph.set(nodeId, new Set()));

  datasetIds.forEach((datasetId) => {
    const producers = datasetInputs.get(datasetId) || [];
    const consumers = datasetOutputs.get(datasetId) || [];

    producers.forEach((producerNode) => {
      consumers.forEach((consumerNode) => {
        if (!graph.has(producerNode)) graph.set(producerNode, new Set());
        graph.get(producerNode)!.add(consumerNode);
      });
    });
  });

  // DFS to detect cycle
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  // Check all nodes for cycles
  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) return true;
    }
  }

  return false;
}

interface ConnectionHandlersProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge<any>[]>>;
  connectionState: {
    source: string | null;
    target: string | null;
    isValid: boolean;
  };
  setConnectionState: React.Dispatch<
    React.SetStateAction<{
      source: string | null;
      target: string | null;
      isValid: boolean;
    }>
  >;
}

/**
 * Custom hook for handling connection-related events
 */
export const useConnectionHandlers = ({
  setEdges,
  connectionState,
  setConnectionState,
}: ConnectionHandlersProps) => {
  const dispatch = useAppDispatch();
  const { screenToFlowPosition } = useReactFlow();

  // Use ref to store connection source - persists across renders and doesn't get reset by state updates
  const connectionSourceRef = useRef<string | null>(null);

  // State for ghost preview during connection drag
  const [ghostPreview, setGhostPreview] = useState<GhostPreviewState | null>(null);

  // Helper: Create edge and connection between two components
  const createConnectionEdge = useCallback((sourceId: string, targetId: string) => {
    const newEdge: Edge = {
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'kedroEdge',
      animated: true,
      markerEnd: {
        type: 'arrowclosed',
        width: 12,
        height: 12,
      },
      style: {
        strokeDasharray: '5, 5',
      },
    };

    setEdges((eds) => addEdge(newEdge, eds) as any);
    dispatch(
      addConnection({
        id: newEdge.id,
        source: sourceId,
        target: targetId,
        sourceHandle: 'output',
        targetHandle: 'input',
      })
    );
  }, [dispatch, setEdges]);

  // Helper: Check if cursor is near any existing component
  const isNearExistingComponent = useCallback((clientX: number, clientY: number): boolean => {
    const PROXIMITY_THRESHOLD = 80; // pixels
    const nodeElements = document.querySelectorAll('.react-flow__node');

    for (const nodeElement of nodeElements) {
      const rect = nodeElement.getBoundingClientRect();

      // Calculate distance from cursor to closest edge of node's bounding box
      const closestX = Math.max(rect.left, Math.min(clientX, rect.right));
      const closestY = Math.max(rect.top, Math.min(clientY, rect.bottom));
      const distanceX = clientX - closestX;
      const distanceY = clientY - closestY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < PROXIMITY_THRESHOLD) {
        return true;
      }
    }

    return false;
  }, []);

  // Track mouse movement during connection drag to show/hide ghost preview
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connectionState.source) {
        // Hide ghost preview when cursor is near existing components
        if (isNearExistingComponent(e.clientX, e.clientY)) {
          setGhostPreview(null);
          return;
        }

        // Show ghost preview at cursor position
        const sourceType = connectionState.source.startsWith('node-') ? 'node' : 'dataset';
        setGhostPreview({
          sourceId: connectionState.source,
          sourceType,
          position: { x: e.clientX, y: e.clientY },
        });
      }
    };

    if (connectionState.source) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    } else {
      setGhostPreview(null);
    }
  }, [connectionState.source, isNearExistingComponent]);

  // Validate connections in real-time (prevent invalid connections)
  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false;

    const isSourceNode = connection.source.startsWith('node-');
    const isSourceDataset = connection.source.startsWith('dataset-');
    const isTargetNode = connection.target.startsWith('node-');
    const isTargetDataset = connection.target.startsWith('dataset-');

    // Only allow: node → dataset OR dataset → node
    // Block: node → node OR dataset → dataset
    if (isSourceNode && isTargetDataset) return true;
    if (isSourceDataset && isTargetNode) return true;

    return false;
  }, []);

  // Handle connection start - track source node/dataset
  const handleConnectStart: OnConnectStart = useCallback(
    (_event, params) => {
      if (params.nodeId) {
        // Store in ref to persist across state resets
        connectionSourceRef.current = params.nodeId;
        setConnectionState({
          source: params.nodeId,
          target: null,
          isValid: true,
        });
      }
    },
    [setConnectionState]
  );

  // Handle connection end - create new component if dropped on empty canvas
  const handleConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const source = connectionSourceRef.current;

      // Reset state
      setConnectionState({ source: null, target: null, isValid: true });
      setGhostPreview(null);
      connectionSourceRef.current = null;

      // Early exit if no source or event
      if (!source || !event) return;

      // Check if dropped on empty canvas (not on an existing component)
      const target = event.target as HTMLElement;
      const isDropOnNode = target.closest('.react-flow__node') || target.classList?.contains('react-flow__node');
      const isCanvasDrop = !isDropOnNode;

      // Create new component if dropped on empty canvas
      if (isCanvasDrop && event instanceof MouseEvent) {
        // Get flow position from screen coordinates
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Determine source type and create appropriate component
        const isSourceDataset = source.startsWith('dataset-');

        if (isSourceDataset) {
          // Dataset → Create Node
          const newId = `node-${Date.now()}`;
          const newNode: KedroNode = {
            id: newId,
            name: '',
            type: 'custom',
            inputs: [],
            outputs: [],
            position,
          };

          dispatch(addNode(newNode));
          setTimeout(() => createConnectionEdge(source, newId), 100);
          dispatch(setPendingComponent({ type: 'node', id: newId }));
          setTimeout(() => dispatch(openConfigPanel({ type: 'node', id: newId })), TIMING.UI_UPDATE_DELAY);
          trackEvent('node_created_from_drag', { nodeType: 'custom' });
        } else {
          // Node → Create Dataset
          const newId = `dataset-${Date.now()}`;
          const newDataset: KedroDataset = {
            id: newId,
            name: '',
            type: 'csv',
            position,
          };

          dispatch(addDataset(newDataset));
          setTimeout(() => createConnectionEdge(source, newId), 100);
          dispatch(setPendingComponent({ type: 'dataset', id: newId }));
          setTimeout(() => dispatch(openConfigPanel({ type: 'dataset', id: newId })), TIMING.UI_UPDATE_DELAY);
          trackEvent('dataset_created_from_drag', { datasetType: 'csv' });
        }
      }
    },
    [setConnectionState, screenToFlowPosition, dispatch, createConnectionEdge]
  );

  // Handle node mouse enter - check if connection would be valid
  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (connectionState.source && node.id !== connectionState.source) {
        // Check if this connection would be valid
        const valid = isValidConnection({
          source: connectionState.source,
          target: node.id,
          sourceHandle: null,
          targetHandle: null,
        });

        setConnectionState({
          source: connectionState.source,
          target: node.id,
          isValid: valid,
        });
      }
    },
    [connectionState.source, isValidConnection, setConnectionState]
  );

  // Handle node mouse leave - reset target
  const handleNodeMouseLeave = useCallback(() => {
    if (connectionState.source) {
      setConnectionState({
        source: connectionState.source,
        target: null,
        isValid: true,
      });
    }
  }, [connectionState.source, setConnectionState]);

  // Handle new connections
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      // Get current state to check for cycles
      const state = store.getState();
      const existingConnections = state.connections.allIds.map(
        (id) => state.connections.byId[id]
      );
      const nodeIds = state.nodes.allIds;
      const datasetIds = state.datasets.allIds;

      // Check if this connection would create a cycle
      if (wouldCreateCycle(connection.source, connection.target, existingConnections, nodeIds, datasetIds)) {
        toast.error('Cannot create connection: This would create a circular dependency', {
          duration: 4000,
          position: 'bottom-right',
        });
        return;
      }

      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || 'output',
        targetHandle: connection.targetHandle || 'input',
        type: 'kedroEdge',
        animated: true,
        markerEnd: {
          type: 'arrowclosed',
          width: 12,
          height: 12,
        },
        style: {
          strokeDasharray: '5, 5',
        },
      };

      setEdges((eds) => addEdge(newEdge, eds) as any);

      // Save to Redux
      dispatch(
        addConnection({
          id: newEdge.id,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || 'output',
          targetHandle: connection.targetHandle || 'input',
        })
      );
    },
    [setEdges, dispatch]
  );

  return {
    isValidConnection,
    handleConnectStart,
    handleConnectEnd,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    handleConnect,
    ghostPreview,
  };
};
