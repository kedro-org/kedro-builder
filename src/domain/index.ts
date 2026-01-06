/**
 * Domain services for Kedro Builder
 *
 * These services encapsulate core business logic that is independent
 * of the UI framework (React) and state management (Redux).
 */

// ID Generation and Branded Types
export {
  generateId,
  generateNodeId,
  generateDatasetId,
  generateCopyId,
  generateConnectionId,
  parseIdType,
  isNodeId,
  isDatasetId,
  isConnectionId,
  asNodeId,
  asDatasetId,
  asConnectionId,
  type ComponentType,
  type NodeId,
  type DatasetId,
  type ConnectionId,
  type ComponentId,
} from './IdGenerator';

// Pipeline Graph Operations
export {
  buildDependencyGraph,
  detectCycles,
  getConnectedNodes,
  getConnectedDatasets,
  findOrphanedNodes,
  findOrphanedDatasets,
  type GraphNode,
  type CycleResult,
} from './PipelineGraph';
