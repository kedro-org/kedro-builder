import { useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { OnConnectStart, OnConnectEnd } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import { addNode } from '../../../features/nodes/nodesSlice';
import { addDataset } from '../../../features/datasets/datasetsSlice';
import { openConfigPanel, setPendingComponent } from '../../../features/ui/uiSlice';
import { TIMING } from '../../../constants/timing';
import { trackEvent } from '../../../utils/telemetry';
import type { KedroNode, KedroDataset } from '../../../types/kedro';

interface UseDragToCreateProps {
  setConnectionState: (state: { source: string | null; target: string | null; isValid: boolean }) => void;
  createConnectionEdge: (sourceId: string, targetId: string) => void;
}

/**
 * Custom hook for handling drag-from-handle to create new components
 * Allows users to drag from a connection handle and drop on empty canvas to create and auto-connect a component
 */
export const useDragToCreate = ({ setConnectionState, createConnectionEdge }: UseDragToCreateProps) => {
  const dispatch = useAppDispatch();
  const { screenToFlowPosition } = useReactFlow();

  // Use ref to persist source across state resets
  const connectionSourceRef = useRef<string | null>(null);

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

      // Check if dropped on empty canvas (not on an existing component)
      const target = event.target as HTMLElement;
      const isDropOnNode = target.closest('.react-flow__node') || target.classList?.contains('react-flow__node');
      const isCanvasDrop = !isDropOnNode;

      // Create new component if dropped on empty canvas
      if (isCanvasDrop && event instanceof MouseEvent) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

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

  return {
    handleConnectStart,
    handleConnectEnd,
  };
};
