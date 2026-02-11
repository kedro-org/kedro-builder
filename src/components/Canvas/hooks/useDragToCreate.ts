import { useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { OnConnectStart, OnConnectEnd } from '@xyflow/react';
import { useAppDispatch } from '@/store/hooks';
import { addNode } from '@/features/nodes/nodesSlice';
import { addDataset } from '@/features/datasets/datasetsSlice';
import { openConfigPanel, setPendingComponent } from '@/features/ui/uiSlice';
import { generateId, isDatasetId } from '@/domain/IdGenerator';
import { TIMING } from '@/constants/timing';
import { trackEvent } from '@/infrastructure/telemetry';
import type { KedroNode, KedroDataset } from '@/types/kedro';

// Connection edge creation delay (ms) - allows ReactFlow to process the new node first
const CONNECTION_CREATION_DELAY = 100;

interface UseDragToCreateProps {
  setConnectionState: (state: { source: string | null; target: string | null; isValid: boolean }) => void;
  createConnectionEdge: (sourceId: string, targetId: string) => void;
  connectionMadeRef: { current: boolean };
}

/**
 * Custom hook for handling drag-from-handle to create new components
 * Allows users to drag from a connection handle and drop on empty canvas to create and auto-connect a component
 */
export const useDragToCreate = ({ setConnectionState, createConnectionEdge, connectionMadeRef }: UseDragToCreateProps) => {
  const dispatch = useAppDispatch();
  const { screenToFlowPosition } = useReactFlow();

  // Use ref to persist source across state resets
  const connectionSourceRef = useRef<string | null>(null);

  // Track pending timeouts for cleanup to prevent memory leaks
  const pendingTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup function to clear all pending timeouts
  const clearPendingTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingTimeoutsRef.current.clear();
  }, []);

  // Helper to create a tracked timeout that auto-removes itself when complete
  const createTrackedTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback();
      pendingTimeoutsRef.current.delete(timeoutId);
    }, delay);
    pendingTimeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeouts();
    };
  }, [clearPendingTimeouts]);

  // Handle connection start - track source
  const handleConnectStart: OnConnectStart = useCallback(
    (_event, params) => {
      if (params.nodeId) {
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

  // Handle connection end - create component if dropped on empty canvas
  const handleConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const source = connectionSourceRef.current;

      // Reset state
      setConnectionState({ source: null, target: null, isValid: true });
      connectionSourceRef.current = null;

      // Early exit if no source or event
      if (!source || !event) return;

      // If a connection was just made via onConnect, don't create a new component
      if (connectionMadeRef.current) {
        connectionMadeRef.current = false;
        return;
      }

      // Check if dropped on empty canvas (not on an existing component or handle)
      const target = event.target as HTMLElement;
      const isDropOnNode = target.closest('.react-flow__node') || target.classList?.contains('react-flow__node');
      const isDropOnHandle = target.closest('.react-flow__handle') || target.classList?.contains('react-flow__handle');
      const isCanvasDrop = !isDropOnNode && !isDropOnHandle;

      // Create new component only if dropped on empty canvas (not on node or handle)
      if (isCanvasDrop && event instanceof MouseEvent) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const isSourceDataset = isDatasetId(source);

        if (isSourceDataset) {
          // Dataset → Create Node
          const newId = generateId('node');
          const newNode: KedroNode = {
            id: newId,
            name: '',
            type: 'custom',
            inputs: [],
            outputs: [],
            position,
          };

          dispatch(addNode(newNode));
          createTrackedTimeout(() => createConnectionEdge(source, newId), CONNECTION_CREATION_DELAY);
          dispatch(setPendingComponent({ type: 'node', id: newId }));
          createTrackedTimeout(() => dispatch(openConfigPanel({ type: 'node', id: newId })), TIMING.UI_UPDATE_DELAY);
          trackEvent('node_created_from_drag', { nodeType: 'custom' });
        } else {
          // Node → Create Dataset
          const newId = generateId('dataset');
          const newDataset: KedroDataset = {
            id: newId,
            name: '',
            type: 'csv',
            position,
          };

          dispatch(addDataset(newDataset));
          createTrackedTimeout(() => createConnectionEdge(source, newId), CONNECTION_CREATION_DELAY);
          dispatch(setPendingComponent({ type: 'dataset', id: newId }));
          createTrackedTimeout(() => dispatch(openConfigPanel({ type: 'dataset', id: newId })), TIMING.UI_UPDATE_DELAY);
          trackEvent('dataset_created_from_drag', { datasetType: 'csv' });
        }
      }
    },
    [setConnectionState, screenToFlowPosition, dispatch, createConnectionEdge, connectionMadeRef, createTrackedTimeout]
  );

  return {
    handleConnectStart,
    handleConnectEnd,
  };
};
