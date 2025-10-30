import { configureStore } from '@reduxjs/toolkit';
import projectReducer from '../features/project/projectSlice';
import nodesReducer from '../features/nodes/nodesSlice';
import datasetsReducer from '../features/datasets/datasetsSlice';
import connectionsReducer from '../features/connections/connectionsSlice';
import uiReducer from '../features/ui/uiSlice';
import validationReducer from '../features/validation/validationSlice';
import themeReducer from '../features/theme/themeSlice';
import { autoSaveMiddleware } from './middleware/autoSaveMiddleware';

export const store = configureStore({
  reducer: {
    project: projectReducer,
    nodes: nodesReducer,
    datasets: datasetsReducer,
    connections: connectionsReducer,
    ui: uiReducer,
    validation: validationReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(autoSaveMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
