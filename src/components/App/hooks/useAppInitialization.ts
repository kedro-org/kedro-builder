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
    const savedProject = loadProjectFromLocalStorage();

    // Determine initial flow state
    if (!tutorialCompleted) {
      // Show tutorial for first-time users
      dispatch(setShowTutorial(true));
    } else if (!walkthroughCompleted) {
      // Show walkthrough after tutorial
      dispatch(startWalkthrough());
    } else if (savedProject) {
      // Clear any existing state first (in case of hot reload during development)
      dispatch(clearNodes());
      dispatch(clearDatasets());
      dispatch(clearConnections());

      // Load the saved project into Redux
      dispatch(loadProject(savedProject.project));

      // Load nodes
      savedProject.nodes.forEach((node) => {
        dispatch(addNode(node));
      });

      // Load datasets
      savedProject.datasets.forEach((dataset) => {
        dispatch(addDataset(dataset));
      });

      // Load connections
      savedProject.connections.forEach((connection) => {
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
