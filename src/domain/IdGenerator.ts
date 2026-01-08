/**
 * IdGenerator - Centralized ID generation for pipeline components
 *
 * All component IDs follow a consistent pattern: `{type}-{timestamp}`
 * This ensures uniqueness within a session and makes debugging easier.
 *
 * ID Format Contracts (preserved from original):
 * - Nodes: `node-{timestamp}` or `node-{timestamp}-{random}` for copy/paste
 * - Datasets: `dataset-{timestamp}` or `dataset-{timestamp}-{random}` for copy/paste
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
 * Generate a unique ID for a node
 * Uses timestamp for uniqueness within a session
 */
export function generateNodeId(): NodeId {
  return `node-${Date.now()}` as NodeId;
}

/**
 * Generate a unique ID for a dataset
 * Uses timestamp for uniqueness within a session
 */
export function generateDatasetId(): DatasetId {
  return `dataset-${Date.now()}` as DatasetId;
}

/**
 * Generate a unique ID for a component (generic version)
 * Uses timestamp for uniqueness within a session
 */
export function generateId(type: 'node'): NodeId;
export function generateId(type: 'dataset'): DatasetId;
export function generateId(type: 'connection'): ConnectionId;
export function generateId(type: ComponentType): string;
export function generateId(type: ComponentType): string {
  const timestamp = Date.now();
  switch (type) {
    case 'node':
      return `node-${timestamp}`;
    case 'dataset':
      return `dataset-${timestamp}`;
    case 'connection':
      // Connections require source/target - use generateConnectionId instead
      // This case exists for type completeness but shouldn't be used
      throw new Error('Use generateConnectionId(source, target) for connection IDs');
    default:
      return `${type}-${timestamp}`;
  }
}

/**
 * Generate a unique ID for copy/paste operations
 * Adds random suffix to avoid collisions when pasting multiple items quickly
 */
export function generateCopyId(type: 'node'): NodeId;
export function generateCopyId(type: 'dataset'): DatasetId;
export function generateCopyId(type: 'node' | 'dataset'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `${type}-${timestamp}-${random}`;
}

/**
 * Generate a deterministic connection ID from source and target
 * This allows deduplication of connections
 *
 * Format: `{source}-{target}` (e.g., `node-123-dataset-456`)
 * Note: No `conn-` prefix for compatibility with existing persisted data.
 */
export function generateConnectionId(source: string, target: string): ConnectionId {
  return `${source}-${target}` as ConnectionId;
}

/**
 * Parse a component ID to extract its type
 */
export function parseIdType(id: string): ComponentType | null {
  // Check for connection first since it contains both node- and dataset-
  if (id.includes('node-') && id.includes('dataset-')) return 'connection';
  if (id.startsWith('node-')) return 'node';
  if (id.startsWith('dataset-')) return 'dataset';
  return null;
}
