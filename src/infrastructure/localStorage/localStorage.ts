/**
 * localStorage utility functions for persisting project state
 * Includes graceful degradation, quota handling, and Zod validation
 */

import type { RootState } from '../../store';
import type { KedroProject, KedroNode, KedroDataset, KedroConnection } from '../../types/kedro';
import { STORAGE_KEYS } from '../../constants';
import { logger } from '../../utils/logger';
import toast from 'react-hot-toast';
import { parseStoredProjectState, getValidationErrors } from './schemas';

const STORAGE_KEY = STORAGE_KEYS.CURRENT_PROJECT;

// Approximate max size for localStorage (5MB in most browsers, we use 4MB to be safe)
const MAX_STORAGE_SIZE_BYTES = 4 * 1024 * 1024;

export interface StoredProjectState {
  project: KedroProject;
  nodes: KedroNode[];
  datasets: KedroDataset[];
  connections: KedroConnection[];
}

let _localStorageAvailable: boolean | null = null;

/**
 * Check if localStorage is available (result cached after first call)
 */
export const isLocalStorageAvailable = (): boolean => {
  if (_localStorageAvailable !== null) return _localStorageAvailable;
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    _localStorageAvailable = true;
  } catch {
    _localStorageAvailable = false;
  }
  return _localStorageAvailable;
};

/**
 * Check if the data would exceed storage limits
 */
const wouldExceedStorageLimit = (data: string): boolean => {
  return new Blob([data]).size > MAX_STORAGE_SIZE_BYTES;
};

/**
 * Handle storage quota exceeded error
 */
const handleQuotaExceeded = (): void => {
  logger.error('localStorage quota exceeded');
  toast.error(
    'Storage limit reached. Your project is too large to save locally. Consider exporting it.',
    { duration: 5000, position: 'bottom-right' }
  );
};

/**
 * Notify user of storage unavailability (shown only once per session)
 */
let storageUnavailableNotified = false;
const notifyStorageUnavailable = (): void => {
  if (!storageUnavailableNotified) {
    storageUnavailableNotified = true;
    toast.error(
      'Local storage is unavailable. Your changes will not be saved automatically.',
      { duration: 5000, position: 'bottom-right' }
    );
  }
};

/**
 * Save current project state to localStorage
 * @returns true if save was successful, false otherwise
 */
export const saveProjectToLocalStorage = (state: RootState): boolean => {
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    notifyStorageUnavailable();
    return false;
  }

  try {
    if (!state.project.current) {
      // No project to save
      return true;
    }

    const projectData: StoredProjectState = {
      project: {
        ...state.project.current,
      },
      nodes: state.nodes.allIds.map(id => state.nodes.byId[id]),
      datasets: state.datasets.allIds.map(id => state.datasets.byId[id]),
      connections: state.connections.allIds.map(id => state.connections.byId[id]),
    };

    const serializedData = JSON.stringify(projectData);

    // Check if data would exceed storage limit
    if (wouldExceedStorageLimit(serializedData)) {
      handleQuotaExceeded();
      return false;
    }

    localStorage.setItem(STORAGE_KEY, serializedData);
    return true;
  } catch (error) {
    // Check for quota exceeded error
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      handleQuotaExceeded();
    } else {
      logger.error('Failed to save project to localStorage:', error);
      toast.error('Failed to save project. Please try again.', {
        duration: 3000,
        position: 'bottom-right',
      });
    }
    return false;
  }
};

/**
 * Load project state from localStorage
 * Uses Zod schema validation for runtime type safety
 * Returns null if no project exists, validation fails, or loading fails
 */
export const loadProjectFromLocalStorage = (): StoredProjectState | null => {
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    notifyStorageUnavailable();
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const rawData = JSON.parse(stored);

    // Validate data structure using Zod schema
    const validatedData = parseStoredProjectState(rawData);

    if (!validatedData) {
      // Get detailed validation errors for debugging
      const errors = getValidationErrors(rawData);
      logger.error('Invalid project data in localStorage:', errors);
      toast.error('Project data format is invalid. Starting fresh.', {
        duration: 4000,
        position: 'bottom-right',
      });
      // Clear invalid data
      clearProjectFromLocalStorage();
      return null;
    }

    return validatedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.error('Corrupted project data in localStorage:', error);
      toast.error('Project data appears to be corrupted. Starting fresh.', {
        duration: 4000,
        position: 'bottom-right',
      });
      // Clear corrupted data
      clearProjectFromLocalStorage();
    } else {
      logger.error('Failed to load project from localStorage:', error);
    }
    return null;
  }
};

/**
 * Clear project from localStorage
 */
export const clearProjectFromLocalStorage = (): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to clear project from localStorage:', error);
  }
};

/**
 * Check if a project exists in localStorage
 */
export const hasStoredProject = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    logger.error('Failed to check localStorage:', error);
    return false;
  }
};

/**
 * Get storage usage information (for debugging)
 */
export const getStorageInfo = (): { size: string; itemCount: number } => {
  try {
    const json = JSON.stringify(localStorage);
    const sizeInKB = (new Blob([json]).size / 1024).toFixed(2);
    const itemCount = localStorage.length;

    return {
      size: `${sizeInKB} KB`,
      itemCount,
    };
  } catch (error) {
    logger.error('Failed to get storage info:', error);
    return { size: 'Unknown', itemCount: 0 };
  }
};
