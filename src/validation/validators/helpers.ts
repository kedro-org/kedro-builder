/**
 * Shared helpers for validator classes
 */

import type { RootState } from '@/store';
import type { KedroConnection } from '@/types/kedro';

/**
 * Extract connections array from Redux state
 */
export function getConnectionsArray(state: RootState): KedroConnection[] {
  return state.connections.allIds.map((id) => state.connections.byId[id]).filter(Boolean);
}
