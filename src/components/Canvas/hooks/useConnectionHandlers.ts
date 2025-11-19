import { useCallback } from 'react';
import { addEdge } from '@xyflow/react';
import type { Connection, Edge, Node, OnConnect, OnConnectStart, OnConnectEnd } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import { addConnection } from '../../../features/connections/connectionsSlice';
import { store } from '../../../store';
import toast from 'react-hot-toast';

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

  // Handle connection start - track source node
  const handleConnectStart: OnConnectStart = useCallback(
    (_event, params) => {
      if (params.nodeId) {
        setConnectionState({
          source: params.nodeId,
          target: null,
          isValid: true,
        });
      }
    },
    [setConnectionState]
  );

  // Handle connection end - reset state
  const handleConnectEnd: OnConnectEnd = useCallback(() => {
    setConnectionState({ source: null, target: null, isValid: true });
  }, [setConnectionState]);

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
  };
};
