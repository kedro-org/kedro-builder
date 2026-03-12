/**
 * Smoke tests for useDragToCreate
 *
 * Verifies the hook initializes, returns the expected handlers,
 * and that handleConnectStart correctly tracks the connection source.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
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
    screenToFlowPosition: vi.fn(({ x, y }: { x: number; y: number }) => ({ x, y })),
  }),
}));

// Mock telemetry
vi.mock('@/infrastructure/telemetry', () => ({
  trackEvent: vi.fn(),
}));

import { useDragToCreate } from './useDragToCreate';

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

describe('useDragToCreate (smoke)', () => {
  const defaultProps = {
    setConnectionState: vi.fn(),
    createConnectionEdge: vi.fn(),
    connectionMadeRef: { current: false },
  };

  it('initializes and returns handleConnectStart + handleConnectEnd', () => {
    const { result } = renderHook(() => useDragToCreate(defaultProps), { wrapper });

    expect(typeof result.current.handleConnectStart).toBe('function');
    expect(typeof result.current.handleConnectEnd).toBe('function');
  });

  it('handleConnectStart sets connection state with source node ID', () => {
    const setConnectionState = vi.fn();
    const { result } = renderHook(
      () => useDragToCreate({ ...defaultProps, setConnectionState }),
      { wrapper }
    );

    act(() => {
      // Simulate ReactFlow's onConnectStart event
      result.current.handleConnectStart(new MouseEvent('mousedown') as never, {
        nodeId: 'node-42',
        handleId: 'output',
        handleType: 'source',
      });
    });

    expect(setConnectionState).toHaveBeenCalledWith({
      source: 'node-42',
      target: null,
      isValid: true,
    });
  });
});
