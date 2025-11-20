import { useCallback } from 'react';
import { addEdge } from '@xyflow/react';
import type { Connection, Edge, Node, OnConnect } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import { addConnection } from '../../../features/connections/connectionsSlice';
import { store } from '../../../store';
import toast from 'react-hot-toast';
import { wouldCreateCycle } from './utils/cycleDetection';
import { useGhostPreview } from './useGhostPreview';
import { useDragToCreate } from './useDragToCreate';

// Re-export GhostPreviewState for backwards compatibility
export type { GhostPreviewState } from './useGhostPreview';

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

  // Helper: Create edge and connection between two components
  const createConnectionEdge = useCallback(
    (sourceId: string, targetId: string) => {
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
    },
    [dispatch, setEdges]
  );

  // Use ghost preview hook for visual feedback
  const ghostPreview = useGhostPreview(connectionState.source);

  // Use drag-to-create hook for creating components from connection handles
  const { handleConnectStart, handleConnectEnd } = useDragToCreate({
    setConnectionState,
    createConnectionEdge,
  });

  // Validate connections in real-time
  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false;

    const isSourceNode = connection.source.startsWith('node-');
    const isSourceDataset = connection.source.startsWith('dataset-');
    const isTargetNode = connection.target.startsWith('node-');
    const isTargetDataset = connection.target.startsWith('dataset-');

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

      // Create the connection
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
