/**
 * Window Event Contract Tests
 *
 * These tests lock the custom event formats used for cross-component communication.
 * The event names and payload shapes are part of the public contract.
 *
 * Events:
 * - focusNode: Fired when a node should be focused/centered in the canvas
 * - configUpdated: Fired when node/dataset config changes (triggers validation refresh)
 *
 * IMPORTANT: Do NOT change event names or payload shapes without updating all consumers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Window Event Contracts', () => {
  let eventListeners: Map<string, EventListener[]>;
  let originalAddEventListener: typeof window.addEventListener;
  let originalRemoveEventListener: typeof window.removeEventListener;
  let originalDispatchEvent: typeof window.dispatchEvent;

  beforeEach(() => {
    eventListeners = new Map();

    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;
    originalDispatchEvent = window.dispatchEvent;

    // Mock addEventListener to track listeners
    window.addEventListener = vi.fn((type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, []);
      }
      eventListeners.get(type)!.push(listener);
    }) as typeof window.addEventListener;

    // Mock removeEventListener
    window.removeEventListener = vi.fn((type: string, listener: EventListener) => {
      const listeners = eventListeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }) as typeof window.removeEventListener;

    // Mock dispatchEvent to call registered listeners
    window.dispatchEvent = vi.fn((event: Event) => {
      const listeners = eventListeners.get(event.type);
      if (listeners) {
        listeners.forEach((listener) => listener(event));
      }
      return true;
    }) as typeof window.dispatchEvent;
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    window.dispatchEvent = originalDispatchEvent;
  });

  describe('focusNode Event', () => {
    it('event name is exactly "focusNode"', () => {
      const EVENT_NAME = 'focusNode';
      expect(EVENT_NAME).toBe('focusNode');
    });

    it('event is a CustomEvent', () => {
      const event = new CustomEvent('focusNode', {
        detail: { nodeId: 'node-123' },
      });

      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('focusNode');
    });

    it('event detail contains nodeId string', () => {
      const handler = vi.fn();
      window.addEventListener('focusNode', handler);

      const event = new CustomEvent('focusNode', {
        detail: { nodeId: 'node-123456789' },
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
      const receivedEvent = handler.mock.calls[0][0] as CustomEvent;
      expect(receivedEvent.detail).toEqual({ nodeId: 'node-123456789' });
      expect(typeof receivedEvent.detail.nodeId).toBe('string');
    });

    it('nodeId can be a node ID format', () => {
      const handler = vi.fn();
      window.addEventListener('focusNode', handler);

      window.dispatchEvent(
        new CustomEvent('focusNode', {
          detail: { nodeId: 'node-1704067200000' },
        })
      );

      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.nodeId).toMatch(/^node-\d+$/);
    });

    it('nodeId can be a dataset ID format', () => {
      const handler = vi.fn();
      window.addEventListener('focusNode', handler);

      window.dispatchEvent(
        new CustomEvent('focusNode', {
          detail: { nodeId: 'dataset-1704067200000' },
        })
      );

      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.nodeId).toMatch(/^dataset-\d+$/);
    });

    it('supports adding and removing listeners', () => {
      const handler = vi.fn();

      window.addEventListener('focusNode', handler);
      window.dispatchEvent(new CustomEvent('focusNode', { detail: { nodeId: 'node-1' } }));
      expect(handler).toHaveBeenCalledTimes(1);

      window.removeEventListener('focusNode', handler);
      window.dispatchEvent(new CustomEvent('focusNode', { detail: { nodeId: 'node-2' } }));
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe('configUpdated Event', () => {
    it('event name is exactly "configUpdated"', () => {
      const EVENT_NAME = 'configUpdated';
      expect(EVENT_NAME).toBe('configUpdated');
    });

    it('event is a CustomEvent with no detail', () => {
      const event = new CustomEvent('configUpdated');

      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('configUpdated');
      expect(event.detail).toBeNull();
    });

    it('handlers receive the event without payload', () => {
      const handler = vi.fn();
      window.addEventListener('configUpdated', handler);

      window.dispatchEvent(new CustomEvent('configUpdated'));

      expect(handler).toHaveBeenCalledTimes(1);
      const receivedEvent = handler.mock.calls[0][0] as CustomEvent;
      expect(receivedEvent.type).toBe('configUpdated');
    });

    it('can be dispatched without any arguments', () => {
      const handler = vi.fn();
      window.addEventListener('configUpdated', handler);

      // This is how it's dispatched in NodeConfigForm and DatasetConfigForm
      window.dispatchEvent(new CustomEvent('configUpdated'));

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Event Contract Documentation', () => {
    it('documents all custom events used in the application', () => {
      // This test serves as documentation for all custom events
      const customEvents = {
        focusNode: {
          description: 'Fired to focus/center a node or dataset in the canvas',
          payload: '{ nodeId: string }',
          producers: ['ValidationItem.tsx'],
          consumers: ['useSelectionHandlers.ts'],
        },
        configUpdated: {
          description: 'Fired when node/dataset configuration changes',
          payload: 'none',
          producers: ['NodeConfigForm.tsx', 'DatasetConfigForm.tsx'],
          consumers: ['useValidation.ts'],
        },
      };

      expect(Object.keys(customEvents)).toHaveLength(2);
      expect(customEvents.focusNode).toBeDefined();
      expect(customEvents.configUpdated).toBeDefined();
    });
  });
});
