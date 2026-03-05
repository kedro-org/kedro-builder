import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../../types/redux';
import { selectTheme } from '../../features/theme/themeSelectors';
import { STORAGE_KEYS, safeSetItem, type StorageKey } from '../../constants';
import { setTheme, toggleTheme } from '../../features/theme/themeSlice';
import { completeTutorial, completeWalkthrough, skipWalkthrough } from '../../features/ui/uiSlice';
import { logger } from '../../utils/logger';

/**
 * Persists lightweight UI preferences and onboarding flags.
 * Keeps reducers pure by handling storage side effects in middleware.
 */
export const preferencesMiddleware: Middleware<object, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  const persistOrWarn = (key: StorageKey, value: string) => {
    if (!safeSetItem(key, value)) {
      logger.warn(`Failed to persist preference for key "${key}"`);
    }
  };

  if (setTheme.match(action) || toggleTheme.match(action)) {
    const state = store.getState();
    persistOrWarn(STORAGE_KEYS.THEME, selectTheme(state));
  }

  if (completeTutorial.match(action)) {
    persistOrWarn(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
  }

  if (completeWalkthrough.match(action) || skipWalkthrough.match(action)) {
    persistOrWarn(STORAGE_KEYS.WALKTHROUGH_COMPLETED, 'true');
  }

  return result;
};
