import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Plain selectors — no memoization needed for simple property access
export const selectSelectedCodeFile = (state: RootState) => state.ui.selectedCodeFile;

/**
 * Memoized selector for file tree generation dependencies.
 * Creates a new object, so memoization prevents unnecessary re-renders.
 */
export const selectFileTreeDependencies = createSelector(
  [
    (state: RootState) => state.project.current,
    (state: RootState) => state.nodes.allIds,
    (state: RootState) => state.datasets.allIds,
    (state: RootState) => state.connections.allIds,
  ],
  (projectCurrent, nodeIds, datasetIds, connectionIds) => ({
    projectCurrent,
    nodeIds,
    datasetIds,
    connectionIds,
  })
);
