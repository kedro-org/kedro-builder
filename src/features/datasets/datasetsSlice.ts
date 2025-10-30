import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DatasetsState } from '../../types/redux';
import type { KedroDataset } from '../../types/kedro';

const initialState: DatasetsState = {
  byId: {},
  allIds: [],
  selected: null,
};

const datasetsSlice = createSlice({
  name: 'datasets',
  initialState,
  reducers: {
    addDataset: {
      reducer: (state, action: PayloadAction<KedroDataset>) => {
        const dataset = action.payload;
        state.byId[dataset.id] = dataset;
        if (!state.allIds.includes(dataset.id)) {
          state.allIds.push(dataset.id);
        }
      },
      prepare: (payload: KedroDataset | Omit<KedroDataset, 'id'>) => {
        // If it has an id, use it directly
        if ('id' in payload && payload.id) {
          return { payload: payload as KedroDataset };
        }
        // Otherwise, create a new dataset with generated id
        const id = `dataset-${Date.now()}`;
        const newDataset: KedroDataset = {
          ...payload,
          id,
        } as KedroDataset;
        return { payload: newDataset };
      },
    },
    updateDataset: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<KedroDataset> }>
    ) => {
      const { id, changes } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = {
          ...state.byId[id],
          ...changes,
        };
      }
    },
    updateDatasetPosition: (
      state,
      action: PayloadAction<{ id: string; position: { x: number; y: number } }>
    ) => {
      const { id, position } = action.payload;
      if (state.byId[id]) {
        state.byId[id].position = position;
      }
    },
    deleteDataset: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter((datasetId) => datasetId !== id);
      if (state.selected === id) {
        state.selected = null;
      }
    },
    selectDataset: (state, action: PayloadAction<string | null>) => {
      state.selected = action.payload;
    },
    clearDatasets: (state) => {
      state.byId = {};
      state.allIds = [];
      state.selected = null;
    },
  },
});

export const {
  addDataset,
  updateDataset,
  updateDatasetPosition,
  deleteDataset,
  selectDataset,
  clearDatasets,
} = datasetsSlice.actions;

export default datasetsSlice.reducer;
