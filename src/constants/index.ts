/**
 * Centralized Constants
 *
 * This module exports all application constants for:
 * - Window events (APP_EVENTS)
 * - LocalStorage keys (STORAGE_KEYS)
 * - Drag and drop MIME types (DND_TYPES)
 *
 * Using these constants instead of hardcoded strings:
 * - Prevents typos
 * - Provides type safety
 * - Makes contracts explicit and discoverable
 * - Enables easy refactoring
 */

// Event constants and helpers
export {
  APP_EVENTS,
  dispatchConfigUpdated,
  dispatchFocusNode,
  onConfigUpdated,
  onFocusNode,
  type FocusNodeDetail,
} from './events';

// Storage key constants and helpers
export {
  STORAGE_KEYS,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  type StorageKey,
} from './storage';

// Drag and drop constants and helpers
export {
  DND_TYPES,
  hasNodeData,
  hasDatasetData,
  getNodeData,
  getDatasetData,
  setNodeData,
  setDatasetData,
  type DndType,
} from './dnd';
