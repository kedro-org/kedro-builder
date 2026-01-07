import { useCallback } from 'react';
import { trackEvent } from '../infrastructure/telemetry';

/**
 * React hook for tracking telemetry events
 *
 * @returns Object with track function
 *
 * @example
 * const { track } = useTelemetry();
 *
 * const handleNodeAdd = () => {
 *   track('node_added', { type: 'data_ingestion' });
 * };
 */
export const useTelemetry = () => {
  const track = useCallback(trackEvent, []);

  return { track };
};
