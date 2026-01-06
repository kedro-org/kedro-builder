/**
 * IdGenerator - Centralized ID generation for pipeline components
 *
 * All component IDs follow a consistent pattern: `{type}-{timestamp}`
 * This ensures uniqueness within a session and makes debugging easier.
 *
 * ID Format Contracts (preserved from original):
 * - Nodes: `node-{timestamp}` or `node-{timestamp}-{random}` for copy/paste
 * - Datasets: `dataset-{timestamp}` or `dataset-{timestamp}-{random}` for copy/paste
 * - Connections: `conn-{source}-{target}` (deterministic for deduplication)
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
      // Connections use a different pattern - see generateConnectionId
      return `conn-${timestamp}`;
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
 */
export function generateConnectionId(source: string, target: string): ConnectionId {
  return `conn-${source}-${target}` as ConnectionId;
}

/**
 * Parse a component ID to extract its type
 */
export function parseIdType(id: string): ComponentType | null {
  if (id.startsWith('node-')) return 'node';
  if (id.startsWith('dataset-')) return 'dataset';
  if (id.startsWith('conn-')) return 'connection';
  return null;
}
