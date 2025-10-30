import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selectors (not memoized - simple property access)
const selectConnectionsById = (state: RootState) => state.connections.byId;
const selectConnectionsAllIds = (state: RootState) => state.connections.allIds;

// Memoized selectors
export const selectAllConnections = createSelector(
  [selectConnectionsById, selectConnectionsAllIds],
  (byId, allIds) => allIds.map((id) => byId[id])
);

export const selectConnectionById = createSelector(
  [selectConnectionsById, (_state: RootState, connectionId: string) => connectionId],
  (byId, connectionId) => byId[connectionId]
);

export const selectConnectionsCount = createSelector(
  [selectConnectionsAllIds],
  (allIds) => allIds.length
);
