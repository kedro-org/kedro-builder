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

// Extend Window interface for Heap
declare global {
  interface Window {
    heap?: {
      track: (eventName: string, properties?: Record<string, any>) => void;
      addEventProperties: (properties: Record<string, any>) => void;
      addUserProperties: (properties: Record<string, any>) => void;
      identify: (identity: string) => void;
      resetIdentity: () => void;
    };
  }
}

// Constants
export const TELEMETRY_KEY = 'kedro-builder-telemetry';
export const TELEMETRY_CONSENT_SHOWN_KEY = 'kedro-builder-telemetry-consent-shown';

// List of property keys that should NEVER be sent to analytics
// This prevents accidental PII leakage
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

/**
 * Get current telemetry consent status
 * OPT-OUT MODEL: Returns true by default (enabled), false only if explicitly disabled
 * @returns true if telemetry is enabled (default), false if user opted out
 */
export const getTelemetryConsent = (): boolean => {
  try {
    const consent = localStorage.getItem(TELEMETRY_KEY);
    // Return false only if explicitly disabled (opt-out)
    // Return true if null/undefined (first visit) or 'enabled'
    return consent !== 'disabled';
  } catch (error) {
    console.warn('Failed to read telemetry consent:', error);
    // Default to enabled even on error (opt-out model)
    return true;
  }
};

/**
 * Set telemetry consent and reload page if consent changes
 * @param enabled - Whether to enable or disable telemetry
 */
export const setTelemetryConsent = (enabled: boolean): void => {
  try {
    const previousConsent = getTelemetryConsent();
    localStorage.setItem(TELEMETRY_KEY, enabled ? 'enabled' : 'disabled');

    // If consent changed, reload page to load/unload Heap
    if (previousConsent !== enabled) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to set telemetry consent:', error);
  }
};

/**
 * Check if user has seen the consent banner
 * @returns true if consent banner has been shown before
 */
export const hasSeenConsentBanner = (): boolean => {
  try {
    return localStorage.getItem(TELEMETRY_CONSENT_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Mark consent banner as shown
 */
export const markConsentBannerShown = (): void => {
  try {
    localStorage.setItem(TELEMETRY_CONSENT_SHOWN_KEY, 'true');
  } catch (error) {
    console.warn('Failed to mark consent banner as shown:', error);
  }
};

/**
 * Sanitize properties to remove any potential PII
 * @param props - Properties object to sanitize
 * @returns Sanitized properties object or undefined if props is empty
 */
const sanitizeProperties = (props?: Record<string, any>): Record<string, any> | undefined => {
  if (!props) return undefined;

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(props)) {
    // Block any keys that might contain PII
    if (BLOCKED_PROPERTY_KEYS.includes(key)) {
      console.warn(`Telemetry: Blocked property key "${key}" to prevent PII leakage`);
      continue;
    }

    // Only allow primitive types (no objects that might contain PII)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else {
      console.warn(`Telemetry: Blocked non-primitive value for key "${key}"`);
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
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  // Check consent
  if (!getTelemetryConsent()) {
    return;
  }

  // Check if Heap is loaded
  if (!window.heap || typeof window.heap.track !== 'function') {
    console.warn('Heap is not loaded. Event not tracked:', eventName);
    return;
  }

  // Sanitize properties
  const sanitizedProps = sanitizeProperties(properties);

  try {
    window.heap.track(eventName, sanitizedProps);
  } catch (error) {
    console.error('Failed to track event:', eventName, error);
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
export const setGlobalEventProperties = (properties: Record<string, any>): void => {
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
      console.error('Failed to set global event properties:', error);
    }
  }
};

/**
 * Reset telemetry data (useful for testing)
 * This clears all consent and resets Heap identity
 */
export const resetTelemetry = (): void => {
  try {
    localStorage.removeItem(TELEMETRY_KEY);
    localStorage.removeItem(TELEMETRY_CONSENT_SHOWN_KEY);

    if (window.heap && typeof window.heap.resetIdentity === 'function') {
      window.heap.resetIdentity();
    }
  } catch (error) {
    console.error('Failed to reset telemetry:', error);
  }
};
