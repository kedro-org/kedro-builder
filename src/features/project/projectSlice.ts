import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ProjectState } from '../../types/redux';
import type { KedroProject } from '../../types/kedro';

const initialState: ProjectState = {
  current: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    createProject: (state, action: PayloadAction<Omit<KedroProject, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = Date.now();
      state.current = {
        ...action.payload,
        id: `project-${now}`,
        createdAt: now,
        updatedAt: now,
      };
    },
    loadProject: (state, action: PayloadAction<KedroProject>) => {
      state.current = action.payload;
    },
    updateProject: (state, action: PayloadAction<Partial<KedroProject>>) => {
      if (state.current) {
        state.current = {
          ...state.current,
          ...action.payload,
          updatedAt: Date.now(),
        };
      }
    },
    clearProject: (state) => {
      state.current = null;
    },
  },
});

export const {
  createProject,
  loadProject,
  updateProject,
  clearProject,
} = projectSlice.actions;

export default projectSlice.reducer;
