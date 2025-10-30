import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionsState } from '../../types/redux';
import type { KedroConnection } from '../../types/kedro';

const initialState: ConnectionsState = {
  byId: {},
  allIds: [],
  selected: [],  // Array for multi-select
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    addConnection: (state, action: PayloadAction<KedroConnection>) => {
      const connection = action.payload;
      state.byId[connection.id] = connection;
      // Only add to allIds if it doesn't already exist
      if (!state.allIds.includes(connection.id)) {
        state.allIds.push(connection.id);
      }
    },
    updateConnection: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<KedroConnection> }>
    ) => {
      const { id, changes } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = {
          ...state.byId[id],
          ...changes,
        };
      }
    },
    deleteConnection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter((connId) => connId !== id);
      state.selected = state.selected.filter((connId) => connId !== id);
    },
    deleteConnections: (state, action: PayloadAction<string[]>) => {
      const idsToDelete = new Set(action.payload);

      // Delete from byId
      idsToDelete.forEach((id) => delete state.byId[id]);

      // Single pass filter for allIds - O(n) instead of O(n²)
      state.allIds = state.allIds.filter((id) => !idsToDelete.has(id));

      // Single pass filter for selected - O(n) instead of O(n²)
      state.selected = state.selected.filter((id) => !idsToDelete.has(id));
    },
    selectConnection: (state, action: PayloadAction<string>) => {
      // Single selection
      state.selected = [action.payload];
    },
    toggleConnectionSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selected.includes(id)) {
        state.selected = state.selected.filter((connId) => connId !== id);
      } else {
        state.selected.push(id);
      }
    },
    clearConnectionSelection: (state) => {
      state.selected = [];
    },
    clearConnections: (state) => {
      state.byId = {};
      state.allIds = [];
      state.selected = [];
    },
  },
});

export const {
  addConnection,
  updateConnection,
  deleteConnection,
  deleteConnections,
  selectConnection,
  toggleConnectionSelection,
  clearConnectionSelection,
  clearConnections,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
