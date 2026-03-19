/**
 * Window Event Contract Tests
 *
 * Tests the REAL dispatch and subscribe helpers from constants/events.ts.
 * Previous version tested its own mocks -- this version imports and exercises
 * the actual application code against real window events.
 *
 * IMPORTANT: Do NOT change event names or payload shapes without updating all consumers.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  APP_EVENTS,
  dispatchFocusNode,
  dispatchConfigUpdated,
  onFocusNode,
  onConfigUpdated,
} from './events';

describe('Window Event Contracts', () => {
  it('APP_EVENTS values are locked', () => {
    expect(APP_EVENTS.CONFIG_UPDATED).toBe('configUpdated');
    expect(APP_EVENTS.FOCUS_NODE).toBe('focusNode');
    // Exactly 2 events -- adding a new event must be intentional
    expect(Object.keys(APP_EVENTS)).toHaveLength(2);
  });

  it('dispatchFocusNode fires a real CustomEvent with the correct detail', () => {
    const spy = vi.fn();
    window.addEventListener('focusNode', spy);

    dispatchFocusNode('node-42');

    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ nodeId: 'node-42' });

    window.removeEventListener('focusNode', spy);
  });

  it('dispatchConfigUpdated fires a real CustomEvent with no detail', () => {
    const spy = vi.fn();
    window.addEventListener('configUpdated', spy);

    dispatchConfigUpdated();

    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('configUpdated');

    window.removeEventListener('configUpdated', spy);
  });

  it('onFocusNode subscribes and cleanup unsubscribes', () => {
    const handler = vi.fn();
    const cleanup = onFocusNode(handler);

    dispatchFocusNode('dataset-99');
    expect(handler).toHaveBeenCalledWith('dataset-99');

    cleanup();

    dispatchFocusNode('dataset-100');
    expect(handler).toHaveBeenCalledTimes(1); // still 1 after cleanup
  });

  it('onConfigUpdated subscribes and cleanup unsubscribes', () => {
    const handler = vi.fn();
    const cleanup = onConfigUpdated(handler);

    dispatchConfigUpdated();
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();

    dispatchConfigUpdated();
    expect(handler).toHaveBeenCalledTimes(1); // still 1 after cleanup
  });
});
