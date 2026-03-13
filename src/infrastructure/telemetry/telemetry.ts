/**
 * Telemetry utilities for Kedro Builder
 *
 * IMPORTANT: This uses an OPT-OUT model (same as Kedro-Viz)
 * - Telemetry is ENABLED by default
 * - Users are informed via banner and can opt out
 * - Once opted out, telemetry is disabled until re-enabled
 *
 * Key privacy features:
 * - Opt-out consent model (enabled by default, users can disable)
 * - No PII collection (project names, node names, etc.)
 * - Property sanitization to block sensitive data
 * - localStorage-based consent (no backend required)
 */

// Type for telemetry property values (primitives only for safety)
type TelemetryPropertyValue = string | number | boolean;
type TelemetryProperties = Record<string, TelemetryPropertyValue>;

// Extend Window interface for Heap
declare global {
  interface Window {
    heap?: {
      track: (eventName: string, properties?: TelemetryProperties) => void;
      addEventProperties: (properties: TelemetryProperties) => void;
      addUserProperties: (properties: TelemetryProperties) => void;
      identify: (identity: string) => void;
      resetIdentity: () => void;
    };
  }
}

import { STORAGE_KEYS, safeGetItem, safeSetItem, safeRemoveItem } from '../../constants';
import { logger } from '../../utils/logger';

/**
 * Property keys blocked from analytics to prevent PII leakage.
 *
 * These are intentionally broad — we'd rather lose a non-PII analytic property
 * than accidentally send user-generated content to a third-party service.
 * This mirrors the approach used in kedro-viz. Keys like 'name', 'id', and
 * 'value' are blocked because in this app they typically hold user-authored
 * project/node/dataset identifiers.
 */
const BLOCKED_PROPERTY_KEYS = [
  'name',
  'projectName',
  'nodeName',
  'datasetName',
  'fileName',
  'filePath',
  'content',
  'code',
  'description',
  'text',
  'value',
  'label',
  'title',
  'userName',
  'email',
  'id',
  'userId',
];

// Cached consent value — invalidated only by setTelemetryConsent / resetTelemetry
let _cachedConsent: boolean | null = null;

/**
 * Get current telemetry consent status
 * OPT-OUT MODEL: Returns true by default (enabled), false only if explicitly disabled
 * @returns true if telemetry is enabled (default), false if user opted out
 */
export const getTelemetryConsent = (): boolean => {
  if (_cachedConsent !== null) return _cachedConsent;
  try {
    const consent = safeGetItem(STORAGE_KEYS.TELEMETRY);
    // Return false only if explicitly disabled (opt-out)
    // Return true if null/undefined (first visit) or 'enabled'
    _cachedConsent = consent !== 'disabled';
    return _cachedConsent;
  } catch (error) {
    logger.warn('Failed to read telemetry consent:', error);
    // Default to enabled even on error (opt-out model)
    return true;
  }
};

/**
 * Set telemetry consent.
 * Changes take effect immediately — trackEvent checks the cached value.
 * @param enabled - Whether to enable or disable telemetry
 */
export const setTelemetryConsent = (enabled: boolean): void => {
  safeSetItem(STORAGE_KEYS.TELEMETRY, enabled ? 'enabled' : 'disabled');
  _cachedConsent = enabled;
};

/**
 * Check if user has seen the consent banner
 * @returns true if consent banner has been shown before
 */
export const hasSeenConsentBanner = (): boolean => {
  return safeGetItem(STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN) === 'true';
};

/**
 * Mark consent banner as shown
 */
export const markConsentBannerShown = (): void => {
  safeSetItem(STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN, 'true');
};

/**
 * Sanitize properties to remove any potential PII
 * @param props - Properties object to sanitize
 * @returns Sanitized properties object or undefined if props is empty
 */
const sanitizeProperties = (props?: Record<string, unknown>): TelemetryProperties | undefined => {
  if (!props) return undefined;

  const sanitized: TelemetryProperties = {};

  for (const [key, value] of Object.entries(props)) {
    // Block any keys that might contain PII
    if (BLOCKED_PROPERTY_KEYS.includes(key)) {
      logger.warn(`Telemetry: Blocked property key "${key}" to prevent PII leakage`);
      continue;
    }

    // Only allow primitive types (no objects that might contain PII)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value as TelemetryPropertyValue;
    } else {
      logger.warn(`Telemetry: Blocked non-primitive value for key "${key}"`);
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

/**
 * Track an event with optional properties
 * Only tracks if user has consented and Heap is loaded
 *
 * @param eventName - Name of the event (e.g., 'node_added', 'project_exported')
 * @param properties - Optional properties (will be sanitized)
 *
 * @example
 * trackEvent('node_added', { type: 'data_ingestion', count: 1 });
 * trackEvent('app_opened', { version: '0.1.0', theme: 'dark' });
 */
export const trackEvent = (eventName: string, properties?: Record<string, unknown>): void => {
  // Check consent
  if (!getTelemetryConsent()) {
    return;
  }

  // Check if Heap is loaded
  if (!window.heap || typeof window.heap.track !== 'function') {
    logger.warn('Heap is not loaded. Event not tracked:', eventName);
    return;
  }

  // Sanitize properties
  const sanitizedProps = sanitizeProperties(properties);

  try {
    window.heap.track(eventName, sanitizedProps);
  } catch (error) {
    logger.error('Failed to track event:', eventName, error);
  }
};

/**
 * Set global event properties that will be sent with every event
 * Useful for app version, theme, etc.
 *
 * @param properties - Properties to add to all events
 *
 * @example
 * setGlobalEventProperties({ version: '0.1.0', theme: 'dark' });
 */
export const setGlobalEventProperties = (properties: Record<string, unknown>): void => {
  if (!getTelemetryConsent()) {
    return;
  }

  if (!window.heap || typeof window.heap.addEventProperties !== 'function') {
    return;
  }

  const sanitizedProps = sanitizeProperties(properties);
  if (sanitizedProps) {
    try {
      window.heap.addEventProperties(sanitizedProps);
    } catch (error) {
      logger.error('Failed to set global event properties:', error);
    }
  }
};

/**
 * Reset telemetry data (useful for testing)
 * This clears all consent and resets Heap identity
 */
export const resetTelemetry = (): void => {
  try {
    safeRemoveItem(STORAGE_KEYS.TELEMETRY);
    safeRemoveItem(STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN);
    _cachedConsent = null;

    if (window.heap && typeof window.heap.resetIdentity === 'function') {
      window.heap.resetIdentity();
    }
  } catch (error) {
    logger.error('Failed to reset telemetry:', error);
  }
};
