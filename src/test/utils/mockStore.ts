import { configureStore } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import nodesReducer from '../../features/nodes/nodesSlice';
import datasetsReducer from '../../features/datasets/datasetsSlice';
import connectionsReducer from '../../features/connections/connectionsSlice';
import uiReducer from '../../features/ui/uiSlice';
import projectReducer from '../../features/project/projectSlice';
import validationReducer from '../../features/validation/validationSlice';
import themeReducer from '../../features/theme/themeSlice';

/**
 * Creates a mock Redux store for testing
 * @param preloadedState - Initial state to populate the store
 * @returns Configured Redux store
 */
export function createMockStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      nodes: nodesReducer,
      datasets: datasetsReducer,
      connections: connectionsReducer,
      ui: uiReducer,
      project: projectReducer,
      validation: validationReducer,
      theme: themeReducer,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

/**
 * Creates a minimal valid state for testing
 */
export function createMockState(overrides?: Partial<RootState>): Partial<RootState> {
  return {
    nodes: {
      byId: {},
      allIds: [],
      selected: [],
      hovered: null,
    },
    datasets: {
      byId: {},
      allIds: [],
      selected: null,
    },
    connections: {
      byId: {},
      allIds: [],
      selected: [],
    },
    ui: {
      showTutorial: false,
      tutorialStep: 0,
      tutorialCompleted: false,
      showWalkthrough: false,
      walkthroughStep: 0,
      walkthroughCompleted: false,
      showProjectSetup: false,
      hasActiveProject: false,
      selectedComponent: null,
      showConfigPanel: false,
      showCodePreview: false,
      showValidationPanel: false,
      canvasZoom: 1,
      canvasPosition: { x: 0, y: 0 },
      showCodeViewer: false,
      selectedCodeFile: null,
      showExportWizard: false,
      pendingComponentId: null,
    },
    project: {
      current: null,
      savedList: [],
      lastSaved: null,
    },
    validation: {
      errors: [],
      warnings: [],
      isValid: true,
      lastChecked: null,
    },
    theme: {
      theme: 'light',
    },
    ...overrides,
  };
}
