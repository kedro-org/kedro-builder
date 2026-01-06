/**
 * Branded ID types for compile-time type safety
 *
 * These types prevent accidentally mixing different ID types:
 * - NodeId cannot be assigned to DatasetId
 * - DatasetId cannot be assigned to ConnectionId
 * - etc.
 *
 * Usage:
 * ```typescript
 * function selectNode(id: NodeId): void { ... }
 * selectNode(datasetId); // TypeScript error!
 * ```
 *
 * For gradual adoption, these types extend `string` so existing
 * code continues to work. The brand is a phantom type that only
 * exists at compile time.
 */

// Brand symbol for creating nominal types
declare const __brand: unique symbol;

/**
 * Branded type helper - creates a nominal type from a base type
 */
type Brand<T, B> = T & { readonly [__brand]: B };

/**
 * Node ID - format: `node-{timestamp}` or `node-{timestamp}-{random}`
 */
export type NodeId = Brand<string, 'NodeId'>;

/**
 * Dataset ID - format: `dataset-{timestamp}` or `dataset-{timestamp}-{random}`
 */
export type DatasetId = Brand<string, 'DatasetId'>;

/**
 * Connection ID - format: `conn-{source}-{target}`
 */
export type ConnectionId = Brand<string, 'ConnectionId'>;

/**
 * Union type for any component ID
 */
export type ComponentId = NodeId | DatasetId | ConnectionId;

/**
 * Type guard to check if a string is a NodeId
 */
export function isNodeId(id: string): id is NodeId {
  return id.startsWith('node-');
}

/**
 * Type guard to check if a string is a DatasetId
 */
export function isDatasetId(id: string): id is DatasetId {
  return id.startsWith('dataset-');
}

/**
 * Type guard to check if a string is a ConnectionId
 */
export function isConnectionId(id: string): id is ConnectionId {
  return id.startsWith('conn-');
}

/**
 * Safely cast a string to NodeId after validation
 * Throws if the string is not a valid node ID
 */
export function asNodeId(id: string): NodeId {
  if (!isNodeId(id)) {
    throw new Error(`Invalid NodeId: ${id}`);
  }
  return id;
}

/**
 * Safely cast a string to DatasetId after validation
 * Throws if the string is not a valid dataset ID
 */
export function asDatasetId(id: string): DatasetId {
  if (!isDatasetId(id)) {
    throw new Error(`Invalid DatasetId: ${id}`);
  }
  return id;
}

/**
 * Safely cast a string to ConnectionId after validation
 * Throws if the string is not a valid connection ID
 */
export function asConnectionId(id: string): ConnectionId {
  if (!isConnectionId(id)) {
    throw new Error(`Invalid ConnectionId: ${id}`);
  }
  return id;
}
