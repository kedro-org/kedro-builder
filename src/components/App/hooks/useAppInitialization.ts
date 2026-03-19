import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setHasActiveProject } from '@/features/ui/uiSlice';
import { setShowTutorial, startWalkthrough } from '@/features/onboarding/onboardingSlice';
import { loadProject } from '@/features/project/projectSlice';
import { addNode, clearNodes } from '@/features/nodes/nodesSlice';
import { addDataset, clearDatasets } from '@/features/datasets/datasetsSlice';
import { addConnection, clearConnections } from '@/features/connections/connectionsSlice';
import { loadProjectFromLocalStorage } from '@/infrastructure/localStorage';
import { STORAGE_KEYS, safeGetItem } from '@/constants';
import { logger } from '@/utils/logger';
import toast from 'react-hot-toast';

/**
 * Custom hook to initialize app state from localStorage
 * Runs once on mount to set up tutorial, walkthrough, or load saved project
 */
export const useAppInitialization = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const tutorialCompleted = safeGetItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
    const walkthroughCompleted = safeGetItem(STORAGE_KEYS.WALKTHROUGH_COMPLETED);

    // Try to load saved project
    const loadResult = loadProjectFromLocalStorage();

    // Notify user of load errors
    if (loadResult.error === 'storage_unavailable') {
      toast.error('Local storage is unavailable. Your changes will not be saved automatically.', { duration: 5000, position: 'bottom-right' });
    } else if (loadResult.error === 'invalid_data') {
      toast.error('Project data format is invalid. A backup was saved. Starting fresh.', { duration: 4000, position: 'bottom-right' });
    } else if (loadResult.error === 'corrupted_json') {
      toast.error('Project data appears to be corrupted. A backup was saved. Starting fresh.', { duration: 4000, position: 'bottom-right' });
    }

    // Determine initial flow state
    if (!tutorialCompleted) {
      // Show tutorial for first-time users
      dispatch(setShowTutorial(true));
    } else if (!walkthroughCompleted) {
      // Show walkthrough after tutorial
      dispatch(startWalkthrough());
    } else if (loadResult.data) {
      // Clear any existing state first (in case of hot reload during development)
      dispatch(clearNodes());
      dispatch(clearDatasets());
      dispatch(clearConnections());

      // Load the saved project into Redux
      dispatch(loadProject(loadResult.data.project));

      // Load nodes
      loadResult.data.nodes.forEach((node) => {
        dispatch(addNode(node));
      });

      // Load datasets
      loadResult.data.datasets.forEach((dataset) => {
        dispatch(addDataset(dataset));
      });

      // Load connections
      loadResult.data.connections.forEach((connection) => {
        dispatch(addConnection(connection));
      });

      dispatch(setHasActiveProject(true));
      logger.load('Project loaded from localStorage');
    } else {
      // Walkthrough done but no project created
      dispatch(setHasActiveProject(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount
};
