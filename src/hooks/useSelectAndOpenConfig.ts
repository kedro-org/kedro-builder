import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { selectNode } from '../features/nodes/nodesSlice';
import { selectDataset } from '../features/datasets/datasetsSlice';
import { openConfigPanel } from '../features/ui/uiSlice';
import { TIMING } from '../constants/timing';

type ComponentType = 'node' | 'dataset';

/**
 * Hook that provides a function to select a component and open its config panel.
 * Commonly used after creating a new node/dataset for immediate configuration.
 * Uses a small delay to ensure the component is rendered before selection.
 *
 * @returns Function to select a component and open its config panel
 */
export function useSelectAndOpenConfig() {
  const dispatch = useAppDispatch();

  const selectAndOpenConfig = useCallback(
    (type: ComponentType, id: string, delay: number = TIMING.UI_UPDATE_DELAY) => {
      setTimeout(() => {
        if (type === 'node') {
          dispatch(selectNode(id));
        } else {
          dispatch(selectDataset(id));
        }
        dispatch(openConfigPanel({ type, id }));
      }, delay);
    },
    [dispatch]
  );

  return selectAndOpenConfig;
}
