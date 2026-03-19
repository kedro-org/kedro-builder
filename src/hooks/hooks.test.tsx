import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { useClearSelections } from './useClearSelections';
import { useConfirmDialog } from './useConfirmDialog';
import { useSelectAndOpenConfig } from './useSelectAndOpenConfig';
import { useTelemetry } from './useTelemetry';
import { createMockStore, createMockState } from '../test/utils/mockStore';
import * as telemetryModule from '../infrastructure/telemetry/telemetry';

// Helper to create a wrapper with Redux Provider
function createWrapper(store = createMockStore()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useClearSelections', () => {
  it('clears both node and connection selections', () => {
    const initialState = createMockState({
      nodes: {
        byId: { 'node-1': { id: 'node-1', name: 'Test', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } } },
        allIds: ['node-1'],
        selected: ['node-1'],
        hovered: null,
      },
      connections: {
        byId: {
          'conn-1': {
            id: 'conn-1',
            source: 'node-1',
            target: 'node-2',
            sourceHandle: 'output',
            targetHandle: 'input',
          },
        },
        allIds: ['conn-1'],
        selected: ['conn-1'],
      },
    });

    const store = createMockStore(initialState);
    const { result } = renderHook(() => useClearSelections(), {
      wrapper: createWrapper(store),
    });

    result.current();

    const state = store.getState();
    expect(state.nodes.selected).toEqual([]);
    expect(state.connections.selected).toEqual([]);
  });

  it('works when selections are already empty', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useClearSelections(), {
      wrapper: createWrapper(store),
    });

    result.current();

    const state = store.getState();
    expect(state.nodes.selected).toEqual([]);
    expect(state.connections.selected).toEqual([]);
  });
});

describe('useConfirmDialog', () => {
  it('initializes with isOpen as false', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmDialog(onConfirm));

    expect(result.current.isOpen).toBe(false);
  });

  it('opens and closes dialog', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmDialog(onConfirm));

    act(() => { result.current.open(); });
    expect(result.current.isOpen).toBe(true);

    act(() => { result.current.close(); });
    expect(result.current.isOpen).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm and closes dialog when confirm is called', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmDialog(onConfirm));

    act(() => { result.current.open(); });
    act(() => { result.current.confirm(); });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });
});

describe('useSelectAndOpenConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('selects node and opens config panel after delay', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useSelectAndOpenConfig(), {
      wrapper: createWrapper(store),
    });

    result.current('node', 'node-1');

    // Before delay
    expect(store.getState().nodes.selected).toEqual([]);

    act(() => { vi.advanceTimersByTime(10); });

    expect(store.getState().nodes.selected).toEqual(['node-1']);
    expect(store.getState().ui.showConfigPanel).toBe(true);
    expect(store.getState().ui.selectedComponent).toEqual({
      type: 'node',
      id: 'node-1',
    });
  });

  it('selects dataset and opens config panel', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useSelectAndOpenConfig(), {
      wrapper: createWrapper(store),
    });

    result.current('dataset', 'dataset-1');

    act(() => { vi.advanceTimersByTime(10); });

    expect(store.getState().datasets.selected).toEqual(['dataset-1']);
    expect(store.getState().ui.showConfigPanel).toBe(true);
    expect(store.getState().ui.selectedComponent).toEqual({
      type: 'dataset',
      id: 'dataset-1',
    });
  });

  it('respects custom delay', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useSelectAndOpenConfig(), {
      wrapper: createWrapper(store),
    });

    result.current('node', 'node-1', 100);

    act(() => { vi.advanceTimersByTime(50); });
    expect(store.getState().nodes.selected).toEqual([]);

    act(() => { vi.advanceTimersByTime(50); });
    expect(store.getState().nodes.selected).toEqual(['node-1']);
  });

  it('handles multiple rapid calls (last one wins)', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useSelectAndOpenConfig(), {
      wrapper: createWrapper(store),
    });

    result.current('node', 'node-1');
    result.current('node', 'node-2');
    result.current('node', 'node-3');

    act(() => { vi.advanceTimersByTime(10); });

    expect(store.getState().nodes.selected).toEqual(['node-3']);
  });
});

describe('useTelemetry', () => {
  let trackEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    trackEventSpy = vi.spyOn(telemetryModule, 'trackEvent');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks events with name only', () => {
    const { result } = renderHook(() => useTelemetry());

    result.current.track('test_event');

    expect(trackEventSpy).toHaveBeenCalledWith('test_event');
  });

  it('tracks events with properties', () => {
    const { result } = renderHook(() => useTelemetry());

    const properties = { count: 1, type: 'custom' };
    result.current.track('node_added', properties);

    expect(trackEventSpy).toHaveBeenCalledWith('node_added', properties);
  });

  it('handles multiple tracking calls', () => {
    const { result } = renderHook(() => useTelemetry());

    result.current.track('event_1');
    result.current.track('event_2', { value: 42 });

    expect(trackEventSpy).toHaveBeenCalledTimes(2);
    expect(trackEventSpy).toHaveBeenNthCalledWith(1, 'event_1');
    expect(trackEventSpy).toHaveBeenNthCalledWith(2, 'event_2', { value: 42 });
  });
});
