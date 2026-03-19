/**
 * Smoke tests for useSelectionHandlers
 *
 * Verifies the hook initializes without crashing and returns
 * the expected public API. This hook composes 5 sub-hooks
 * (deleteConfirmation, deleteItems, copyPaste, keyboardShortcuts, clearSelections).
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import nodesReducer from '@/features/nodes/nodesSlice';
import datasetsReducer from '@/features/datasets/datasetsSlice';
import connectionsReducer from '@/features/connections/connectionsSlice';
import onboardingReducer from '@/features/onboarding/onboardingSlice';
import uiReducer from '@/features/ui/uiSlice';
import projectReducer from '@/features/project/projectSlice';
import validationReducer from '@/features/validation/validationSlice';
import themeReducer from '@/features/theme/themeSlice';

// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    fitView: vi.fn(),
    getNode: vi.fn(),
  }),
}));

// Mock telemetry
vi.mock('@/infrastructure/telemetry', () => ({
  trackEvent: vi.fn(),
}));

import { useSelectionHandlers } from './useSelectionHandlers';

function makeStore() {
  return configureStore({
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
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={makeStore()}>{children}</Provider>;
}

describe('useSelectionHandlers (smoke)', () => {
  const defaultProps = {
    reduxNodes: [],
    reduxDatasets: [],
    selectedNodeIds: [],
    selectedEdgeIds: [],
    isPanMode: false,
    setIsPanMode: vi.fn(),
    exportWizardOpen: false,
  };

  it('initializes and returns the expected API shape', () => {
    const { result } = renderHook(() => useSelectionHandlers(defaultProps), { wrapper });

    // Selection handlers
    expect(typeof result.current.handleEdgeClick).toBe('function');
    expect(typeof result.current.handlePaneClick).toBe('function');
    expect(typeof result.current.handleSelectionChange).toBe('function');

    // Bulk action handlers
    expect(typeof result.current.handleBulkDelete).toBe('function');
    expect(typeof result.current.handleBulkClear).toBe('function');
    expect(typeof result.current.handleEdgesDelete).toBe('function');

    // Delete confirmation state + handlers
    expect(result.current.deleteConfirmation).toBeNull(); // no pending delete
    expect(typeof result.current.confirmDelete).toBe('function');
    expect(typeof result.current.cancelDelete).toBe('function');
  });

  it('handlePaneClick dispatches clearSelection + closeConfigPanel', () => {
    const store = makeStore();
    const { result } = renderHook(() => useSelectionHandlers(defaultProps), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    });

    // Should not throw
    result.current.handlePaneClick();

    // Config panel should be closed after pane click
    expect(store.getState().ui.showConfigPanel).toBe(false);
  });
});
