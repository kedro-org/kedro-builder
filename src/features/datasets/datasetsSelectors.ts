import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selectors (not memoized - simple property access)
const selectDatasetsById = (state: RootState) => state.datasets.byId;
const selectDatasetsAllIds = (state: RootState) => state.datasets.allIds;
export const selectSelectedDatasetIds = (state: RootState) => state.datasets.selected;

// Memoized selectors
export const selectAllDatasets = createSelector(
  [selectDatasetsById, selectDatasetsAllIds],
  (byId, allIds) => allIds.map((id) => byId[id]).filter(Boolean)
);

export const selectDatasetById = createSelector(
  [selectDatasetsById, (_state: RootState, datasetId: string) => datasetId],
  (byId, datasetId) => byId[datasetId]
);

// Get all selected datasets as array
export const selectSelectedDatasets = createSelector(
  [selectDatasetsById, selectSelectedDatasetIds],
  (byId, selectedIds) => selectedIds.map((id) => byId[id]).filter(Boolean)
);

// Get first selected dataset (for backward compatibility with single-select UI)
export const selectSelectedDataset = createSelector(
  [selectDatasetsById, selectSelectedDatasetIds],
  (byId, selectedIds) => (selectedIds.length > 0 ? byId[selectedIds[0]] : null)
);

// Check if a specific dataset is selected
export const selectIsDatasetSelected = createSelector(
  [selectSelectedDatasetIds, (_state: RootState, datasetId: string) => datasetId],
  (selectedIds, datasetId) => selectedIds.includes(datasetId)
);

export const selectDatasetsCount = createSelector(
  [selectDatasetsAllIds],
  (allIds) => allIds.length
);
