/**
 * localStorage utility functions for persisting project state
 */

import type { RootState } from '../types/redux';
import type { KedroProject, KedroNode, KedroDataset, KedroConnection } from '../types/kedro';
import { logger } from './logger';

const STORAGE_KEY = 'kedro_builder_current_project';

export interface StoredProjectState {
  project: KedroProject;
  nodes: KedroNode[];
  datasets: KedroDataset[];
  connections: KedroConnection[];
}

/**
 * Save current project state to localStorage
 */
export const saveProjectToLocalStorage = (state: RootState): void => {
  try {
    if (!state.project.current) {
      // No project to save
      return;
    }

    const projectData: StoredProjectState = {
      project: {
        ...state.project.current,
        updatedAt: Date.now(), // Update timestamp on save
      },
      nodes: state.nodes.allIds.map(id => state.nodes.byId[id]),
      datasets: state.datasets.allIds.map(id => state.datasets.byId[id]),
      connections: state.connections.allIds.map(id => state.connections.byId[id]),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
  } catch (error) {
    logger.error('Failed to save project to localStorage:', error);
  }
};

/**
 * Load project state from localStorage
 */
export const loadProjectFromLocalStorage = (): StoredProjectState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const projectData = JSON.parse(stored) as StoredProjectState;
    return projectData;
  } catch (error) {
    logger.error('Failed to load project from localStorage:', error);
    return null;
  }
};

/**
 * Clear project from localStorage
 */
export const clearProjectFromLocalStorage = (): void => {
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
