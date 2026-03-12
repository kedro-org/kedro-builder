import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { store } from '../../store';
import type { RootState } from '../../store';
import nodesReducer from '../../features/nodes/nodesSlice';
import datasetsReducer from '../../features/datasets/datasetsSlice';
import connectionsReducer from '../../features/connections/connectionsSlice';
import onboardingReducer from '../../features/onboarding/onboardingSlice';
import uiReducer from '../../features/ui/uiSlice';
import projectReducer from '../../features/project/projectSlice';
import validationReducer from '../../features/validation/validationSlice';
import themeReducer from '../../features/theme/themeSlice';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: typeof store;
}

/**
 * Custom render function that wraps components with Redux Provider
 * and other necessary providers for testing
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        nodes: nodesReducer,
        datasets: datasetsReducer,
        connections: connectionsReducer,
        onboarding: onboardingReducer,
        ui: uiReducer,
        project: projectReducer,
        validation: validationReducer,
        theme: themeReducer,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preloadedState: preloadedState as any,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything from testing-library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { renderWithProviders as render };
