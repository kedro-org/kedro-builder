import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import projectReducer from '../../features/project/projectSlice';
import nodesReducer from '../../features/nodes/nodesSlice';
import datasetsReducer from '../../features/datasets/datasetsSlice';
import connectionsReducer from '../../features/connections/connectionsSlice';
import onboardingReducer, {
  completeTutorial,
  completeWalkthrough,
  skipWalkthrough,
} from '../../features/onboarding/onboardingSlice';
import uiReducer, { openConfigPanel } from '../../features/ui/uiSlice';
import validationReducer from '../../features/validation/validationSlice';
import themeReducer, { setTheme, toggleTheme } from '../../features/theme/themeSlice';
import * as constants from '../../constants';
import { logger } from '../../utils/logger';
import { preferencesMiddleware } from './preferencesMiddleware';

const createTestStore = () =>
  configureStore({
    reducer: {
      project: projectReducer,
      nodes: nodesReducer,
      datasets: datasetsReducer,
      connections: connectionsReducer,
      onboarding: onboardingReducer,
      ui: uiReducer,
      validation: validationReducer,
      theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(preferencesMiddleware),
  });

describe('preferencesMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists theme when setTheme is dispatched', () => {
    const safeSetItemSpy = vi.spyOn(constants, 'safeSetItem').mockReturnValue(true);
    const store = createTestStore();

    store.dispatch(setTheme('dark'));

    expect(safeSetItemSpy).toHaveBeenCalledWith(constants.STORAGE_KEYS.THEME, 'dark');
  });

  it('persists toggled theme value on toggleTheme', () => {
    const safeSetItemSpy = vi.spyOn(constants, 'safeSetItem').mockReturnValue(true);
    const store = createTestStore();

    store.dispatch(setTheme('light'));
    store.dispatch(toggleTheme());

    expect(safeSetItemSpy).toHaveBeenLastCalledWith(constants.STORAGE_KEYS.THEME, 'dark');
  });

  it('persists tutorial and walkthrough completion flags', () => {
    const safeSetItemSpy = vi.spyOn(constants, 'safeSetItem').mockReturnValue(true);
    const store = createTestStore();

    store.dispatch(completeTutorial());
    store.dispatch(completeWalkthrough());
    store.dispatch(skipWalkthrough());

    expect(safeSetItemSpy).toHaveBeenCalledWith(constants.STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
    expect(safeSetItemSpy).toHaveBeenCalledWith(constants.STORAGE_KEYS.WALKTHROUGH_COMPLETED, 'true');
  });

  it('does not persist for unrelated ui actions', () => {
    const safeSetItemSpy = vi.spyOn(constants, 'safeSetItem').mockReturnValue(true);
    const store = createTestStore();

    store.dispatch(openConfigPanel({ type: 'node', id: 'node-1' }));

    expect(safeSetItemSpy).not.toHaveBeenCalled();
  });

  it('logs warning when persistence fails', () => {
    vi.spyOn(constants, 'safeSetItem').mockReturnValue(false);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const store = createTestStore();

    store.dispatch(setTheme('dark'));

    expect(warnSpy).toHaveBeenCalledWith(
      `Failed to persist preference for key "${constants.STORAGE_KEYS.THEME}"`
    );
  });
});
