import { configureStore } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { KedroNode, KedroDataset, KedroConnection } from '../../types/kedro';
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
 * Creates a minimal valid Partial<RootState> for preloading into createMockStore().
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
      selected: [],
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

/**
 * Creates a full RootState from arrays of domain objects.
 *
 * Builds the normalized byId/allIds shape automatically. Use this when you
 * need a complete RootState to pass directly to validators, generators, or
 * other pure functions that expect the full state tree.
 *
 * @param nodes      - Array of KedroNode objects
 * @param datasets   - Array of KedroDataset objects
 * @param connections - Array of KedroConnection objects
 * @param projectOverrides - When provided, populates project.current with
 *   defaults (id, name, etc.) merged with your overrides, and sets
 *   hasActiveProject to true. When omitted, project.current is null.
 */
export function createTestState(
  nodes: KedroNode[] = [],
  datasets: KedroDataset[] = [],
  connections: KedroConnection[] = [],
  projectOverrides?: Partial<NonNullable<RootState['project']['current']>>
): RootState {
  const hasProject = projectOverrides !== undefined;

  return {
    nodes: {
      byId: Object.fromEntries(nodes.map((n) => [n.id, n])),
      allIds: nodes.map((n) => n.id),
      selected: [],
      hovered: null,
    },
    datasets: {
      byId: Object.fromEntries(datasets.map((d) => [d.id, d])),
      allIds: datasets.map((d) => d.id),
      selected: [],
    },
    connections: {
      byId: Object.fromEntries(connections.map((c) => [c.id, c])),
      allIds: connections.map((c) => c.id),
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
      hasActiveProject: hasProject,
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
      current: hasProject
        ? {
            id: 'project-1',
            name: 'test_project',
            pythonPackage: 'test_project',
            pipelineName: 'default',
            description: 'Test project description',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...projectOverrides,
          }
        : null,
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
  };
}
