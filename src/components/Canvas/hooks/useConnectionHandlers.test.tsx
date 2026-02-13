/**
 * Smoke tests for useConnectionHandlers
 *
 * Verifies the hook initializes without crashing and returns
 * the expected public API shape. Does NOT test ReactFlow interaction
 * details -- that belongs in integration/E2E tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import nodesReducer from '@/features/nodes/nodesSlice';
import datasetsReducer from '@/features/datasets/datasetsSlice';
import connectionsReducer from '@/features/connections/connectionsSlice';
import uiReducer from '@/features/ui/uiSlice';
import projectReducer from '@/features/project/projectSlice';
import validationReducer from '@/features/validation/validationSlice';
import themeReducer from '@/features/theme/themeSlice';

// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  addEdge: vi.fn((edge: unknown, edges: unknown[]) => [...edges, edge]),
  useReactFlow: () => ({
    screenToFlowPosition: vi.fn(({ x, y }: { x: number; y: number }) => ({ x, y })),
    fitView: vi.fn(),
    getNode: vi.fn(),
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));

// Mock telemetry
vi.mock('@/infrastructure/telemetry', () => ({
  trackEvent: vi.fn(),
}));

import { useConnectionHandlers } from './useConnectionHandlers';

function makeStore() {
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
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={makeStore()}>{children}</Provider>;
}

describe('useConnectionHandlers (smoke)', () => {
  const defaultProps = {
    setEdges: vi.fn(),
    connectionState: { source: null, target: null, isValid: true },
    setConnectionState: vi.fn(),
  };

  it('initializes and returns the expected API shape', () => {
    const { result } = renderHook(() => useConnectionHandlers(defaultProps), { wrapper });

    // All 6 handler functions + ghostPreview state
    expect(typeof result.current.isValidConnection).toBe('function');
    expect(typeof result.current.handleConnect).toBe('function');
    expect(typeof result.current.handleConnectStart).toBe('function');
    expect(typeof result.current.handleConnectEnd).toBe('function');
    expect(typeof result.current.handleNodeMouseEnter).toBe('function');
    expect(typeof result.current.handleNodeMouseLeave).toBe('function');
    // ghostPreview is null when no active connection
    expect(result.current.ghostPreview).toBeNull();
  });

  it('isValidConnection rejects node-to-node connections', () => {
    const { result } = renderHook(() => useConnectionHandlers(defaultProps), { wrapper });

    // node → node should be invalid (only node↔dataset allowed)
    const invalid = result.current.isValidConnection({
      source: 'node-1',
      target: 'node-2',
      sourceHandle: null,
      targetHandle: null,
    });
    expect(invalid).toBe(false);

    // node → dataset should be valid
    const valid = result.current.isValidConnection({
      source: 'node-1',
      target: 'dataset-1',
      sourceHandle: null,
      targetHandle: null,
    });
    expect(valid).toBe(true);
  });
});
