/**
 * Redux middleware for auto-saving project state to localStorage
 */

import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../../types/redux';
import { saveProjectToLocalStorage } from '../../infrastructure/localStorage';
import { logger } from '../../utils/logger';
import { TIMING } from '../../constants/timing';

let saveTimeout: NodeJS.Timeout | null = null;

/**
 * Actions that trigger auto-save
 */
const SAVE_TRIGGER_ACTIONS = [
  // Project actions
  'project/createProject',
  'project/updateProject',

  // Node actions
  'nodes/addNode',
  'nodes/updateNode',
  'nodes/updateNodePosition',
  'nodes/deleteNode',
  'nodes/deleteNodes',

  // Dataset actions
  'datasets/addDataset',
  'datasets/updateDataset',
  'datasets/updateDatasetPosition',
  'datasets/deleteDataset',
  'datasets/deleteDatasets',

  // Connection actions
  'connections/addConnection',
  'connections/deleteConnection',
  'connections/deleteConnections',
];

/**
 * Auto-save middleware
 * Debounces saves to avoid excessive localStorage writes
 */
export const autoSaveMiddleware: Middleware<object, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  // Check if this action should trigger a save
  const shouldSave = SAVE_TRIGGER_ACTIONS.some(trigger =>
    (action as { type: string }).type.startsWith(trigger)
  );

  if (shouldSave) {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      const state = store.getState();
      saveProjectToLocalStorage(state);
      logger.save('Project auto-saved to localStorage');
    }, TIMING.AUTO_SAVE_DEBOUNCE);
  }

  return result;
};
