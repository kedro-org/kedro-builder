/**
 * Application Event Constants
 *
 * Centralizes window event names and provides type-safe dispatch/listen helpers.
 * These events are used for cross-component communication.
 *
 * IMPORTANT: Do NOT change event names without updating all producers/consumers.
 * See src/test/contracts/events.contracts.test.ts for contract tests.
 */

/**
 * Custom event names used in the application
 */
export const APP_EVENTS = {
  /** Fired when node/dataset configuration changes (triggers validation refresh) */
  CONFIG_UPDATED: 'configUpdated',
  /** Fired to focus/center a node or dataset in the canvas */
  FOCUS_NODE: 'focusNode',
} as const;

/**
 * Type for focusNode event detail
 */
export interface FocusNodeDetail {
  nodeId: string;
}

/**
 * Dispatch configUpdated event
 * Used by: NodeConfigForm, DatasetConfigForm
 * Consumed by: useValidation
 */
export function dispatchConfigUpdated(): void {
  window.dispatchEvent(new CustomEvent(APP_EVENTS.CONFIG_UPDATED));
}

/**
 * Dispatch focusNode event to center a node/dataset in the canvas
 * Used by: ValidationItem
 * Consumed by: useSelectionHandlers
 */
export function dispatchFocusNode(nodeId: string): void {
  window.dispatchEvent(
    new CustomEvent<FocusNodeDetail>(APP_EVENTS.FOCUS_NODE, {
      detail: { nodeId },
    })
  );
}

/**
 * Subscribe to configUpdated events
 * Returns cleanup function for useEffect
 */
export function onConfigUpdated(handler: () => void): () => void {
  window.addEventListener(APP_EVENTS.CONFIG_UPDATED, handler);
  return () => window.removeEventListener(APP_EVENTS.CONFIG_UPDATED, handler);
}

/**
 * Subscribe to focusNode events
 * Returns cleanup function for useEffect
 */
export function onFocusNode(handler: (nodeId: string) => void): () => void {
  const wrappedHandler = (event: Event) => {
    const customEvent = event as CustomEvent<FocusNodeDetail>;
    handler(customEvent.detail.nodeId);
  };
  window.addEventListener(APP_EVENTS.FOCUS_NODE, wrappedHandler);
  return () => window.removeEventListener(APP_EVENTS.FOCUS_NODE, wrappedHandler);
}
