/**
 * IdGenerator - Centralized ID generation for pipeline components
 *
 * All component IDs follow a consistent pattern: `{type}-{uuid}`
 * This ensures uniqueness across sessions and concurrent operations.
 *
 * ID Format Contracts:
 * - Nodes: `node-{uuid}` (prefix-based type detection preserved)
 * - Datasets: `dataset-{uuid}` (prefix-based type detection preserved)
 * - Connections: `{source}-{target}` (deterministic for deduplication)
 *
 * Note: Connection IDs do NOT have a `conn-` prefix to maintain compatibility
 * with existing persisted data in localStorage.
 */

import type { NodeId, DatasetId, ConnectionId } from '../types/ids';

// Re-export type guards from types/ids for convenience
export {
  isNodeId,
  isDatasetId,
  isConnectionId,
  asNodeId,
  asDatasetId,
  asConnectionId,
} from '../types/ids';

export type { NodeId, DatasetId, ConnectionId, ComponentId } from '../types/ids';

export type ComponentType = 'node' | 'dataset' | 'connection';

/**
 * Generate a unique suffix for IDs.
 * Uses crypto.randomUUID() for collision-free generation,
 * with a timestamp+random fallback for environments without it.
 */
function uniqueSuffix(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a unique ID for a node
 */
export function generateNodeId(): NodeId {
  return `node-${uniqueSuffix()}` as NodeId;
}

/**
 * Generate a unique ID for a dataset
 */
export function generateDatasetId(): DatasetId {
  return `dataset-${uniqueSuffix()}` as DatasetId;
}

/**
 * Generate a unique ID for a component (generic version).
 * Note: For connections, use generateConnectionId(source, target) instead.
 */
export function generateId(type: 'node'): NodeId;
export function generateId(type: 'dataset'): DatasetId;
export function generateId(type: 'connection'): ConnectionId;
export function generateId(type: ComponentType): string;
export function generateId(type: ComponentType): string {
  switch (type) {
    case 'node':
      return `node-${uniqueSuffix()}`;
    case 'dataset':
      return `dataset-${uniqueSuffix()}`;
    case 'connection':
      // Connections require source/target - use generateConnectionId instead
      throw new Error('Use generateConnectionId(source, target) for connection IDs');
    default:
      return `${type}-${uniqueSuffix()}`;
  }
}

/**
 * Generate a unique ID for copy/paste operations.
 * Uses the same UUID-based generation as regular IDs.
 */
export function generateCopyId(type: 'node'): NodeId;
export function generateCopyId(type: 'dataset'): DatasetId;
export function generateCopyId(type: 'node' | 'dataset'): string {
  return `${type}-${uniqueSuffix()}`;
}

/**
 * Generate a deterministic connection ID from source and target.
 * This allows deduplication of connections.
 *
 * @param source - Source component ID
 * @param target - Target component ID
 * @returns Connection ID in format `{source}-{target}` (no `conn-` prefix)
 */
export function generateConnectionId(source: string, target: string): ConnectionId {
  return `${source}-${target}` as ConnectionId;
}

/**
 * Parse a component ID to extract its type.
 * Checks for node, dataset, or connection patterns in the ID string.
 *
 * @param id - Component ID to parse
 * @returns Component type or null if unrecognized
 */
export function parseIdType(id: string): ComponentType | null {
  // Check for connection first since it contains both node- and dataset-
  if (id.includes('node-') && id.includes('dataset-')) return 'connection';
  if (id.startsWith('node-')) return 'node';
  if (id.startsWith('dataset-')) return 'dataset';
  return null;
}
