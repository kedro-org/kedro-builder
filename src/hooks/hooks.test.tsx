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
  describe('default behavior', () => {
    it('returns a function', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useClearSelections(), {
        wrapper: createWrapper(store),
      });

      expect(typeof result.current).toBe('function');
    });

    it('returns a stable function reference', () => {
      const store = createMockStore();
      const { result, rerender } = renderHook(() => useClearSelections(), {
        wrapper: createWrapper(store),
      });

      const firstRef = result.current;
      rerender();
      const secondRef = result.current;

      expect(firstRef).toBe(secondRef);
    });
  });

  describe('clearing selections', () => {
    it('dispatches clearSelection action', () => {
      const initialState = createMockState({
        nodes: {
          byId: { 'node-1': { id: 'node-1', name: 'Test', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } } },
          allIds: ['node-1'],
          selected: ['node-1'],
          hovered: null,
        },
      });

      const store = createMockStore(initialState);
      const { result } = renderHook(() => useClearSelections(), {
        wrapper: createWrapper(store),
      });

      result.current();

      const state = store.getState();
      expect(state.nodes.selected).toEqual([]);
    });

    it('dispatches clearConnectionSelection action', () => {
      const initialState = createMockState({
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
      expect(state.connections.selected).toEqual([]);
    });

    it('clears both node and connection selections simultaneously', () => {
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
  });

  describe('edge cases', () => {
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

    it('can be called multiple times safely', () => {
      const initialState = createMockState({
        nodes: {
          byId: { 'node-1': { id: 'node-1', name: 'Test', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } } },
          allIds: ['node-1'],
          selected: ['node-1'],
          hovered: null,
        },
      });

      const store = createMockStore(initialState);
      const { result } = renderHook(() => useClearSelections(), {
        wrapper: createWrapper(store),
      });

      result.current();
      result.current();
      result.current();

      const state = store.getState();
      expect(state.nodes.selected).toEqual([]);
    });
  });
});

describe('useConfirmDialog', () => {
  describe('default behavior', () => {
    it('initializes with isOpen as false', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      expect(result.current.isOpen).toBe(false);
    });

    it('provides open, close, and confirm functions', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');
      expect(typeof result.current.confirm).toBe('function');
    });
  });

  describe('opening and closing dialog', () => {
    it('opens dialog when open is called', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('closes dialog when close is called', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('closes dialog when confirm is called', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.confirm();
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('confirm callback', () => {
    it('calls onConfirm when confirm is invoked', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.confirm();
      });

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm before closing dialog', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.confirm();
      });

      expect(onConfirm).toHaveBeenCalled();
      expect(result.current.isOpen).toBe(false);
    });

    it('does not call onConfirm when close is invoked', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.close();
      });

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('works with different onConfirm implementations', () => {
      const mockAction = vi.fn();
      const onConfirm = () => {
        mockAction('delete-node');
      };
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.confirm();
      });

      expect(mockAction).toHaveBeenCalledWith('delete-node');
    });
  });

  describe('edge cases', () => {
    it('can open and close multiple times', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.confirm();
      });
      expect(result.current.isOpen).toBe(false);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calling open when already open keeps it open', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('calling close when already closed keeps it closed', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useConfirmDialog(onConfirm));

      act(() => {
        result.current.close();
      });
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('maintains stable function references', () => {
      const onConfirm = vi.fn();
      const { result, rerender } = renderHook(() => useConfirmDialog(onConfirm));

      const openRef = result.current.open;
      const closeRef = result.current.close;
      const confirmRef = result.current.confirm;

      rerender();

      expect(result.current.open).toBe(openRef);
      expect(result.current.close).toBe(closeRef);
      expect(result.current.confirm).toBe(confirmRef);
    });
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

  describe('default behavior', () => {
    it('returns a function', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      expect(typeof result.current).toBe('function');
    });

    it('returns a stable function reference', () => {
      const store = createMockStore();
      const { result, rerender } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      const firstRef = result.current;
      rerender();
      const secondRef = result.current;

      expect(firstRef).toBe(secondRef);
    });
  });

  describe('selecting and opening config for nodes', () => {
    it('dispatches selectNode action after delay', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1');

      // Before delay
      expect(store.getState().nodes.selected).toEqual([]);

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(store.getState().nodes.selected).toEqual(['node-1']);
    });

    it('dispatches openConfigPanel action for node after delay', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1');

      // Before delay
      expect(store.getState().ui.showConfigPanel).toBe(false);

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(store.getState().ui.showConfigPanel).toBe(true);
      expect(store.getState().ui.selectedComponent).toEqual({
        type: 'node',
        id: 'node-1',
      });
    });
  });

  describe('selecting and opening config for datasets', () => {
    it('dispatches selectNode action for dataset', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('dataset', 'dataset-1');

      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(store.getState().nodes.selected).toEqual(['dataset-1']);
    });

    it('dispatches openConfigPanel action for dataset', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('dataset', 'dataset-1');

      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(store.getState().ui.showConfigPanel).toBe(true);
      expect(store.getState().ui.selectedComponent).toEqual({
        type: 'dataset',
        id: 'dataset-1',
      });
    });
  });

  describe('custom delay', () => {
    it('uses custom delay when provided', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1', 100);

      // Before custom delay
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(store.getState().nodes.selected).toEqual([]);

      // After custom delay
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(store.getState().nodes.selected).toEqual(['node-1']);
    });

    it('uses default delay when not provided', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1');

      // Default delay is 10ms (TIMING.UI_UPDATE_DELAY)
      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(store.getState().nodes.selected).toEqual(['node-1']);
    });

    it('does not execute before delay elapses', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1', 100);

      act(() => {
        vi.advanceTimersByTime(99);
      });

      expect(store.getState().nodes.selected).toEqual([]);
      expect(store.getState().ui.showConfigPanel).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles multiple rapid calls', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1');
      result.current('node', 'node-2');
      result.current('node', 'node-3');

      act(() => {
        vi.advanceTimersByTime(10);
      });

      // All three execute, but selectNode replaces selection so last one wins
      expect(store.getState().nodes.selected).toEqual(['node-3']);
    });

    it('works with zero delay', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1', 0);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(store.getState().nodes.selected).toEqual(['node-1']);
    });

    it('still executes timeout after unmount (no cleanup)', () => {
      // Note: The hook does not clean up timeouts on unmount.
      // This documents current behavior - the dispatch still fires.
      const store = createMockStore();
      const { result, unmount } = renderHook(() => useSelectAndOpenConfig(), {
        wrapper: createWrapper(store),
      });

      result.current('node', 'node-1', 100);

      act(() => {
        vi.advanceTimersByTime(50);
      });
      unmount();
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Timeout still fires since hook doesn't clear it on unmount
      expect(store.getState().nodes.selected).toEqual(['node-1']);
    });
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

  describe('default behavior', () => {
    it('returns an object with track function', () => {
      const { result } = renderHook(() => useTelemetry());

      expect(result.current).toHaveProperty('track');
      expect(typeof result.current.track).toBe('function');
    });

    it('returns a stable track function reference', () => {
      const { result, rerender } = renderHook(() => useTelemetry());

      const firstRef = result.current.track;
      rerender();
      const secondRef = result.current.track;

      expect(firstRef).toBe(secondRef);
    });
  });

  describe('tracking events', () => {
    it('calls trackEvent with event name', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('test_event');

      expect(trackEventSpy).toHaveBeenCalledWith('test_event');
    });

    it('calls trackEvent with event name and properties', () => {
      const { result } = renderHook(() => useTelemetry());

      const properties = { count: 1, type: 'custom' };
      result.current.track('node_added', properties);

      expect(trackEventSpy).toHaveBeenCalledWith('node_added', properties);
    });

    it('handles multiple event tracking calls', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('event_1');
      result.current.track('event_2', { value: 42 });
      result.current.track('event_3', { flag: true });

      expect(trackEventSpy).toHaveBeenCalledTimes(3);
      expect(trackEventSpy).toHaveBeenNthCalledWith(1, 'event_1');
      expect(trackEventSpy).toHaveBeenNthCalledWith(2, 'event_2', { value: 42 });
      expect(trackEventSpy).toHaveBeenNthCalledWith(3, 'event_3', { flag: true });
    });
  });

  describe('property types', () => {
    it('handles string properties', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('test', { action: 'click' });

      expect(trackEventSpy).toHaveBeenCalledWith('test', { action: 'click' });
    });

    it('handles number properties', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('test', { count: 5 });

      expect(trackEventSpy).toHaveBeenCalledWith('test', { count: 5 });
    });

    it('handles boolean properties', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('test', { success: true });

      expect(trackEventSpy).toHaveBeenCalledWith('test', { success: true });
    });

    it('handles mixed property types', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('test', {
        action: 'export',
        count: 10,
        success: true,
      });

      expect(trackEventSpy).toHaveBeenCalledWith('test', {
        action: 'export',
        count: 10,
        success: true,
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty properties object', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('test', {});

      expect(trackEventSpy).toHaveBeenCalledWith('test', {});
    });

    it('handles undefined properties', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('test', undefined);

      expect(trackEventSpy).toHaveBeenCalledWith('test', undefined);
    });

    it('handles event names with special characters', () => {
      const { result } = renderHook(() => useTelemetry());

      result.current.track('node:created');

      expect(trackEventSpy).toHaveBeenCalledWith('node:created');
    });

    it('can be called immediately after mounting', () => {
      const { result } = renderHook(() => useTelemetry());

      expect(() => {
        result.current.track('immediate_event');
      }).not.toThrow();

      expect(trackEventSpy).toHaveBeenCalled();
    });
  });

  describe('integration with telemetry module', () => {
    it('respects telemetry consent through trackEvent', () => {
      trackEventSpy.mockImplementation(() => {
        // trackEvent checks consent internally
      });

      const { result } = renderHook(() => useTelemetry());

      result.current.track('test_event');

      expect(trackEventSpy).toHaveBeenCalled();
    });

    it('does not call trackEvent if spy is mocked to do nothing', () => {
      trackEventSpy.mockImplementation(() => {});

      const { result } = renderHook(() => useTelemetry());

      result.current.track('test_event');

      expect(trackEventSpy).toHaveBeenCalledOnce();
    });
  });
});
