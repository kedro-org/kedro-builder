/**
 * Redux middleware for auto-saving project state to localStorage
 */

import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../../types/redux';
import { saveProjectToLocalStorage } from '../../infrastructure/localStorage';
import type { SaveError } from '../../infrastructure/localStorage';
import { logger } from '../../utils/logger';
import { TIMING } from '../../constants/timing';
import toast from 'react-hot-toast';

let saveTimeout: NodeJS.Timeout | null = null;
let storageUnavailableNotified = false;

const SAVE_ERROR_MESSAGES: Record<SaveError, string> = {
  storage_unavailable: 'Local storage is unavailable. Your changes will not be saved automatically.',
  quota_exceeded: 'Storage limit reached. Your project is too large to save locally. Consider exporting it.',
  save_failed: 'Failed to save project. Please try again.',
};

const notifySaveError = (error: SaveError): void => {
  // Only show storage_unavailable once per session
  if (error === 'storage_unavailable') {
    if (storageUnavailableNotified) return;
    storageUnavailableNotified = true;
  }
  toast.error(SAVE_ERROR_MESSAGES[error], { duration: 5000, position: 'bottom-right' });
};

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
      const saveResult = saveProjectToLocalStorage(state);
      if (saveResult.success) {
        logger.save('Project auto-saved to localStorage');
      } else {
        notifySaveError(saveResult.error!);
      }
    }, TIMING.AUTO_SAVE_DEBOUNCE);
  }

  return result;
};
