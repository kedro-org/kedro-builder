import { useCallback, useRef } from 'react';
import { addEdge } from '@xyflow/react';
import type { Connection, Edge, Node, OnConnect } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import { addConnection } from '../../../features/connections/connectionsSlice';
import { store } from '../../../store';
import toast from 'react-hot-toast';
import { wouldCreateCycle } from './utils/cycleDetection';
import { useGhostPreview } from './useGhostPreview';
import { useDragToCreate } from './useDragToCreate';
import { isNodeId, isDatasetId, generateConnectionId } from '../../../domain';

// Re-export GhostPreviewState for backwards compatibility
export type { GhostPreviewState } from './useGhostPreview';

// Constants for edge configuration (extracted to prevent recreation)
const EDGE_MARKER_END = {
  type: 'arrowclosed' as const,
  width: 12,
  height: 12,
};

const EDGE_STYLE = {
  strokeDasharray: '5, 5',
};

interface ConnectionHandlersProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
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
 * Main hook for handling all connection-related events in the pipeline canvas
 * Coordinates connection validation, creation, and drag-to-create functionality
 */
export const useConnectionHandlers = ({
  setEdges,
  connectionState,
  setConnectionState,
}: ConnectionHandlersProps) => {
  const dispatch = useAppDispatch();

  // Track when a connection is made via onConnect to prevent duplicate component creation
  const connectionMadeRef = useRef(false);

  // Helper: Create edge and connection between two components
  const createConnectionEdge = useCallback(
    (sourceId: string, targetId: string) => {
      const edgeId = generateConnectionId(sourceId, targetId);
      const newEdge: Edge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        sourceHandle: 'output',
        targetHandle: 'input',
        type: 'kedroEdge',
        animated: true,
        markerEnd: EDGE_MARKER_END,
        style: EDGE_STYLE,
      };

      setEdges((eds) => addEdge(newEdge, eds) as Edge[]);
      dispatch(
        addConnection({
          id: edgeId,
          source: sourceId,
          target: targetId,
          sourceHandle: 'output',
          targetHandle: 'input',
        })
      );
    },
    [dispatch, setEdges]
  );

  // Use ghost preview hook for visual feedback
  const ghostPreview = useGhostPreview(connectionState.source);

  // Use drag-to-create hook for creating components from connection handles
  const { handleConnectStart, handleConnectEnd } = useDragToCreate({
    setConnectionState,
    createConnectionEdge,
    connectionMadeRef,
  });

  // Validate connections in real-time
  // Uses centralized ID type detection from domain layer
  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false;

    if (connection.sourceHandle && connection.sourceHandle !== 'output') return false;
    if (connection.targetHandle && connection.targetHandle !== 'input') return false;

    const isSourceNode = isNodeId(connection.source);
    const isSourceDataset = isDatasetId(connection.source);
    const isTargetNode = isNodeId(connection.target);
    const isTargetDataset = isDatasetId(connection.target);

    // Only allow: node → dataset OR dataset → node
    // Block: node → node OR dataset → dataset
    return (isSourceNode && isTargetDataset) || (isSourceDataset && isTargetNode);
  }, []);

  // Handle node mouse enter - show connection validity
  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (connectionState.source && node.id !== connectionState.source) {
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

  // Handle new connections with cycle detection
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      // Get current state
      const state = store.getState();
      const existingConnections = state.connections.allIds.map((id) => state.connections.byId[id]);
      const nodeIds = state.nodes.allIds;
      const datasetIds = state.datasets.allIds;

      // Check for cycles
      if (wouldCreateCycle(connection.source, connection.target, existingConnections, nodeIds, datasetIds)) {
        toast.error('Cannot create connection: This would create a circular dependency', {
          duration: 4000,
          position: 'bottom-right',
        });
        return;
      }

      // Mark that a connection was made to prevent duplicate component creation in onConnectEnd
      connectionMadeRef.current = true;

      // Create the connection using centralized ID generator
      const edgeId = generateConnectionId(connection.source, connection.target);
      const sourceHandle = connection.sourceHandle || 'output';
      const targetHandle = connection.targetHandle || 'input';

      const newEdge: Edge = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle,
        targetHandle,
        type: 'kedroEdge',
        animated: true,
        markerEnd: EDGE_MARKER_END,
        style: EDGE_STYLE,
      };

      setEdges((eds) => addEdge(newEdge, eds) as Edge[]);

      dispatch(
        addConnection({
          id: edgeId,
          source: connection.source,
          target: connection.target,
          sourceHandle,
          targetHandle,
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
