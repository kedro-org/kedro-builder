/**
 * localStorage utility functions for persisting project state
 * Includes graceful degradation, quota handling, and Zod validation
 *
 * NOTE: This module is UI-agnostic — it returns structured results
 * and never calls toast/UI directly. Callers decide how to notify users.
 */

import type { RootState } from '../../store';
import type { KedroProject, KedroNode, KedroDataset, KedroConnection } from '../../types/kedro';
import { STORAGE_KEYS } from '../../constants';
import { logger } from '../../utils/logger';
import { parseStoredProjectState } from './schemas';

const STORAGE_KEY = STORAGE_KEYS.CURRENT_PROJECT;
const BACKUP_KEY = `${STORAGE_KEY}__backup`;

// App-scoped key prefixes for getStorageInfo
const APP_KEY_PREFIXES = ['kedro_builder_', 'kedro-builder-'];

// Approximate max size for localStorage (5MB in most browsers, we use 4MB to be safe)
const MAX_STORAGE_SIZE_BYTES = 4 * 1024 * 1024;

export interface StoredProjectState {
  project: KedroProject;
  nodes: KedroNode[];
  datasets: KedroDataset[];
  connections: KedroConnection[];
}

/** Error types returned by save/load functions */
export type SaveError = 'storage_unavailable' | 'quota_exceeded' | 'save_failed';
export type LoadError = 'storage_unavailable' | 'invalid_data' | 'corrupted_json' | 'load_failed';

export interface SaveResult {
  success: boolean;
  error?: SaveError;
}

export interface LoadResult {
  data: StoredProjectState | null;
  error?: LoadError;
  validationErrors?: string[];
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
 * Save current project state to localStorage
 */
export const saveProjectToLocalStorage = (state: RootState): SaveResult => {
  if (!isLocalStorageAvailable()) {
    logger.error('localStorage is unavailable');
    return { success: false, error: 'storage_unavailable' };
  }

  try {
    if (!state.project.current) {
      return { success: true };
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

    if (wouldExceedStorageLimit(serializedData)) {
      logger.error('localStorage quota exceeded');
      return { success: false, error: 'quota_exceeded' };
    }

    localStorage.setItem(STORAGE_KEY, serializedData);
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      logger.error('localStorage quota exceeded');
      return { success: false, error: 'quota_exceeded' };
    }
    logger.error('Failed to save project to localStorage:', error);
    return { success: false, error: 'save_failed' };
  }
};

/**
 * Load project state from localStorage
 * Uses Zod schema validation for runtime type safety.
 * On invalid/corrupted data, backs up the raw value before clearing.
 */
export const loadProjectFromLocalStorage = (): LoadResult => {
  if (!isLocalStorageAvailable()) {
    logger.error('localStorage is unavailable');
    return { data: null, error: 'storage_unavailable' };
  }

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { data: null };
    }

    const rawData = JSON.parse(stored);

    // Single parse — extract both data and errors from SafeParseResult
    const result = parseStoredProjectState(rawData);

    if (result.success) {
      return { data: result.data };
    }

    // Validation failed — backup raw data, then clear
    const validationErrors = result.error.issues.map((issue: { path: PropertyKey[]; message: string }) => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    });
    logger.error('Invalid project data in localStorage:', validationErrors);
    backupAndClear(stored);
    return { data: null, error: 'invalid_data', validationErrors };
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.error('Corrupted project data in localStorage:', error);
      // Backup the raw string we already read, then clear
      if (stored) {
        backupAndClear(stored);
      } else {
        clearProjectFromLocalStorage();
      }
      return { data: null, error: 'corrupted_json' };
    }
    logger.error('Failed to load project from localStorage:', error);
    return { data: null, error: 'load_failed' };
  }
};

/**
 * Backup raw data to a separate key before clearing the main key.
 * Allows manual recovery of data that failed validation.
 */
const backupAndClear = (rawData: string): void => {
  try {
    localStorage.setItem(BACKUP_KEY, rawData);
    logger.warn(`Backed up invalid project data to "${BACKUP_KEY}"`);
  } catch {
    logger.error('Failed to backup invalid project data');
  }
  clearProjectFromLocalStorage();
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
 * Get storage usage information scoped to kedro-builder keys only.
 * Does not include third-party data stored on the same origin.
 */
export const getStorageInfo = (): { size: string; itemCount: number } => {
  try {
    let totalSize = 0;
    let itemCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && APP_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) {
        const value = localStorage.getItem(key) ?? '';
        totalSize += new Blob([key, value]).size;
        itemCount++;
      }
    }

    const sizeInKB = (totalSize / 1024).toFixed(2);
    return { size: `${sizeInKB} KB`, itemCount };
  } catch (error) {
    logger.error('Failed to get storage info:', error);
    return { size: 'Unknown', itemCount: 0 };
  }
};
