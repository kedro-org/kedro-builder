/**
 * LocalStorage Key Constants
 *
 * Centralizes all localStorage keys used in the application.
 * Keys use two naming conventions:
 * - Underscore format (kedro_builder_*) for app state
 * - Dash format (kedro-builder-*) for telemetry
 *
 * IMPORTANT: Do NOT change these values without a migration strategy.
 * Changing keys would break existing users' saved data.
 * See src/test/contracts/localStorage.contracts.test.ts for contract tests.
 */

export const STORAGE_KEYS = {
  /**
   * Main project data storage (nodes, datasets, connections, project metadata)
   * Format: underscore
   */
  CURRENT_PROJECT: 'kedro_builder_current_project',

  /**
   * Tutorial completion flag
   * Format: underscore
   * Value: 'true' when completed
   */
  TUTORIAL_COMPLETED: 'kedro_builder_tutorial_completed',

  /**
   * Walkthrough completion flag
   * Format: underscore
   * Value: 'true' when completed
   */
  WALKTHROUGH_COMPLETED: 'kedro_builder_walkthrough_completed',

  /**
   * Theme preference
   * Format: underscore
   * Value: 'light' | 'dark'
   */
  THEME: 'kedro_builder_theme',

  /**
   * Telemetry enabled/disabled
   * Format: dash (matches Heap convention)
   * Value: 'enabled' | 'disabled'
   */
  TELEMETRY: 'kedro-builder-telemetry',

  /**
   * Telemetry consent dialog shown flag
   * Format: dash (matches Heap convention)
   * Value: 'true' when shown
   */
  TELEMETRY_CONSENT_SHOWN: 'kedro-builder-telemetry-consent-shown',
} as const;

/**
 * Type for storage key values
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Safe localStorage getter with error handling
 */
export function safeGetItem(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe localStorage setter with error handling
 */
export function safeSetItem(key: StorageKey, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe localStorage remover with error handling
 */
export function safeRemoveItem(key: StorageKey): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
