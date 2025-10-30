import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selectors (not memoized - simple property access)
const selectDatasetsById = (state: RootState) => state.datasets.byId;
const selectDatasetsAllIds = (state: RootState) => state.datasets.allIds;
const selectDatasetsSelected = (state: RootState) => state.datasets.selected;

// Memoized selectors
export const selectAllDatasets = createSelector(
  [selectDatasetsById, selectDatasetsAllIds],
  (byId, allIds) => allIds.map((id) => byId[id])
);

export const selectDatasetById = createSelector(
  [selectDatasetsById, (_state: RootState, datasetId: string) => datasetId],
  (byId, datasetId) => byId[datasetId]
);

export const selectSelectedDataset = createSelector(
  [selectDatasetsById, selectDatasetsSelected],
  (byId, selectedId) => (selectedId ? byId[selectedId] : null)
);

export const selectDatasetsCount = createSelector(
  [selectDatasetsAllIds],
  (allIds) => allIds.length
);
