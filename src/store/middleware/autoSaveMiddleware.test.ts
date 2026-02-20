/**
 * @vitest-environment node
 */
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import projectReducer from '../../features/project/projectSlice';
import nodesReducer, { addNode } from '../../features/nodes/nodesSlice';
import datasetsReducer, { addDataset } from '../../features/datasets/datasetsSlice';
import connectionsReducer from '../../features/connections/connectionsSlice';
import uiReducer, { openConfigPanel } from '../../features/ui/uiSlice';
import validationReducer from '../../features/validation/validationSlice';
import themeReducer from '../../features/theme/themeSlice';
import * as localStorageModule from '../../infrastructure/localStorage';
import { autoSaveMiddleware } from './autoSaveMiddleware';

// Mock the save function -- we test that it's CALLED, not what it writes
vi.mock('../../infrastructure/localStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../infrastructure/localStorage')>();
  return {
    ...actual,
    saveProjectToLocalStorage: vi.fn().mockReturnValue(true),
  };
});

const createTestStore = () =>
  configureStore({
    reducer: {
      project: projectReducer,
      nodes: nodesReducer,
      datasets: datasetsReducer,
      connections: connectionsReducer,
      ui: uiReducer,
      validation: validationReducer,
      theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(autoSaveMiddleware),
  });

describe('autoSaveMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers save after node/dataset/connection actions (debounced)', () => {
    const store = createTestStore();
    const saveSpy = vi.mocked(localStorageModule.saveProjectToLocalStorage);

    store.dispatch(addNode({
      id: 'node-1',
      name: 'test',
      type: 'data_processing',
      inputs: [],
      outputs: [],
      position: { x: 0, y: 0 },
    }));

    // Save should NOT have fired yet (debounced)
    expect(saveSpy).not.toHaveBeenCalled();

    // Advance past the 500ms debounce
    vi.advanceTimersByTime(500);

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger save for unrelated actions', () => {
    const store = createTestStore();
    const saveSpy = vi.mocked(localStorageModule.saveProjectToLocalStorage);

    store.dispatch(openConfigPanel({ type: 'node', id: 'node-1' }));

    vi.advanceTimersByTime(1000);

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('debounces rapid actions into a single save', () => {
    const store = createTestStore();
    const saveSpy = vi.mocked(localStorageModule.saveProjectToLocalStorage);

    // Dispatch 3 actions rapidly
    store.dispatch(addNode({
      id: 'node-1', name: 'a', type: 'data_processing',
      inputs: [], outputs: [], position: { x: 0, y: 0 },
    }));
    store.dispatch(addNode({
      id: 'node-2', name: 'b', type: 'data_processing',
      inputs: [], outputs: [], position: { x: 0, y: 0 },
    }));
    store.dispatch(addDataset({
      id: 'ds-1', name: 'c', type: 'csv', position: { x: 0, y: 0 },
    }));

    // Advance past debounce
    vi.advanceTimersByTime(500);

    // Should save exactly ONCE, not 3 times
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
