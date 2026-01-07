import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selectors
const selectUIState = (state: RootState) => state.ui;
const selectProjectCurrent = (state: RootState) => state.project.current;
const selectNodesAllIds = (state: RootState) => state.nodes.allIds;
const selectDatasetsAllIds = (state: RootState) => state.datasets.allIds;
const selectConnectionsAllIds = (state: RootState) => state.connections.allIds;

/**
 * Selector for code file selection state
 */
export const selectSelectedCodeFile = createSelector(
  [selectUIState],
  (ui) => ui.selectedCodeFile
);

/**
 * Selector for file tree generation dependencies
 * Only re-computes when the specific state slices change
 */
export const selectFileTreeDependencies = createSelector(
  [selectProjectCurrent, selectNodesAllIds, selectDatasetsAllIds, selectConnectionsAllIds],
  (projectCurrent, nodeIds, datasetIds, connectionIds) => ({
    projectCurrent,
    nodeIds,
    datasetIds,
    connectionIds,
  })
);

/**
 * Selector for config panel visibility
 */
export const selectShowConfigPanel = createSelector(
  [selectUIState],
  (ui) => ui.showConfigPanel
);

/**
 * Selector for selected component
 */
export const selectSelectedComponent = createSelector(
  [selectUIState],
  (ui) => ui.selectedComponent
);

/**
 * Selector for pending component
 */
export const selectPendingComponentId = createSelector(
  [selectUIState],
  (ui) => ui.pendingComponentId
);

/**
 * Selector for export wizard visibility
 */
export const selectShowExportWizard = createSelector(
  [selectUIState],
  (ui) => ui.showExportWizard
);

/**
 * Selector for validation panel visibility
 */
export const selectShowValidationPanel = createSelector(
  [selectUIState],
  (ui) => ui.showValidationPanel
);

/**
 * Selector for code viewer visibility
 */
export const selectShowCodeViewer = createSelector(
  [selectUIState],
  (ui) => ui.showCodeViewer
);
