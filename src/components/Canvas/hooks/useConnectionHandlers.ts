import { useCallback } from 'react';
import { addEdge } from '@xyflow/react';
import type { Connection, Edge, Node, OnConnect, OnConnectStart, OnConnectEnd } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import { addConnection } from '../../../features/connections/connectionsSlice';

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
