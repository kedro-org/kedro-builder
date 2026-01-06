import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { selectNode } from '../features/nodes/nodesSlice';
import { openConfigPanel } from '../features/ui/uiSlice';
import { TIMING } from '../constants/timing';

type ComponentType = 'node' | 'dataset';

/**
 * Hook that provides a function to select a component and open its config panel
 * This pattern is commonly used after creating a new node/dataset to:
 * 1. Select the newly created component
 * 2. Open the config panel for immediate configuration
 *
 * Uses a small delay to ensure the component is rendered before selection
 */
export function useSelectAndOpenConfig() {
  const dispatch = useAppDispatch();

  const selectAndOpenConfig = useCallback(
    (type: ComponentType, id: string, delay: number = TIMING.UI_UPDATE_DELAY) => {
      setTimeout(() => {
        dispatch(selectNode(id));
        dispatch(openConfigPanel({ type, id }));
      }, delay);
    },
    [dispatch]
  );

  return selectAndOpenConfig;
}
