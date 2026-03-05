import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selectors (not memoized - simple property access)
const selectNodesById = (state: RootState) => state.nodes.byId;
const selectNodesAllIds = (state: RootState) => state.nodes.allIds;
const selectNodesSelected = (state: RootState) => state.nodes.selected;

// Memoized selectors
export const selectAllNodes = createSelector(
  [selectNodesById, selectNodesAllIds],
  (byId, allIds) => allIds.map((id) => byId[id]).filter(Boolean)
);

export const selectNodeById = (state: RootState, nodeId: string) =>
  state.nodes.byId[nodeId];

export const selectSelectedNode = createSelector(
  [selectNodesById, selectNodesSelected],
  (byId, selectedIds) => (selectedIds.length > 0 ? byId[selectedIds[0]] : null)
);

export const selectNodesCount = createSelector(
  [selectNodesAllIds],
  (allIds) => allIds.length
);
