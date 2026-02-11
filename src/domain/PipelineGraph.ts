/**
 * PipelineGraph - Graph operations for Kedro pipeline
 *
 * Handles building and traversing the dependency graph between nodes and datasets.
 * Kedro pipelines have a specific structure:
 * - Nodes produce outputs to datasets
 * - Datasets provide inputs to nodes
 * - Direct node-to-node or dataset-to-dataset connections are not allowed
 *
 * This creates a bipartite graph that we can traverse for:
 * - Cycle detection
 * - Orphan detection
 * - Topological sorting (for execution order)
 */

import type { KedroConnection } from '../types/kedro';
import { isNodeId, isDatasetId } from './IdGenerator';

export interface GraphNode {
  id: string;
  type: 'node' | 'dataset';
}

export interface CycleResult {
  hasCycle: boolean;
  cyclePath: string[];
}

/**
 * Build a dependency graph from connections.
 * Returns a map of node ID to set of downstream node IDs.
 * The graph traces node → dataset → node paths to build effective node-to-node dependencies.
 *
 * @param nodeIds - All node IDs in the pipeline
 * @param connections - All connections between components
 * @returns Map of node ID to downstream node IDs
 */
export function buildDependencyGraph(
  nodeIds: string[],
  connections: KedroConnection[]
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  // Initialize graph with all nodes
  nodeIds.forEach((nodeId) => {
    graph.set(nodeId, new Set());
  });

  // Build maps of dataset inputs and outputs
  // datasetInputs: dataset -> nodes that produce it (write to it)
  // datasetOutputs: dataset -> nodes that consume it (read from it)
  const datasetInputs = new Map<string, string[]>();
  const datasetOutputs = new Map<string, string[]>();

  connections.forEach((conn) => {
    const { source, target } = conn;

    // node → dataset (node produces to dataset)
    if (isNodeId(source) && isDatasetId(target)) {
      if (!datasetInputs.has(target)) {
        datasetInputs.set(target, []);
      }
      datasetInputs.get(target)!.push(source);
    }
    // dataset → node (dataset feeds into node)
    else if (isDatasetId(source) && isNodeId(target)) {
      if (!datasetOutputs.has(source)) {
        datasetOutputs.set(source, []);
      }
      datasetOutputs.get(source)!.push(target);
    }
  });

  // Build node-to-node edges through datasets
  // For each dataset, connect all producer nodes to all consumer nodes
  const allDatasets = new Set([...datasetInputs.keys(), ...datasetOutputs.keys()]);

  allDatasets.forEach((datasetId) => {
    const producers = datasetInputs.get(datasetId) || [];
    const consumers = datasetOutputs.get(datasetId) || [];

    producers.forEach((producerNode) => {
      consumers.forEach((consumerNode) => {
        if (!graph.has(producerNode)) {
          graph.set(producerNode, new Set());
        }
        graph.get(producerNode)!.add(consumerNode);
      });
    });
  });

  return graph;
}

/**
 * Detect cycles in the dependency graph using DFS.
 *
 * @param graph - Dependency graph from buildDependencyGraph
 * @returns Array of cycle results with paths
 */
export function detectCycles(graph: Map<string, Set<string>>): CycleResult[] {
  const cycles: CycleResult[] = [];
  const visited = new Set<string>();
  const processed = new Set<string>();

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      const recStack = new Set<string>();
      const path: string[] = [];

      if (detectCycleDFS(nodeId, graph, visited, recStack, path)) {
        // Found a cycle - check if we've already recorded it
        const cycleKey = path.slice().sort().join('-');
        if (!processed.has(cycleKey)) {
          processed.add(cycleKey);
          cycles.push({
            hasCycle: true,
            cyclePath: [...path],
          });
        }
      }
    }
  }

  return cycles;
}

/**
 * DFS helper for cycle detection.
 * Recursively traverses the graph to find cycles in the recursion stack.
 */
function detectCycleDFS(
  node: string,
  graph: Map<string, Set<string>>,
  visited: Set<string>,
  recStack: Set<string>,
  path: string[]
): boolean {
  visited.add(node);
  recStack.add(node);
  path.push(node);

  const neighbors = graph.get(node) || new Set();
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      if (detectCycleDFS(neighbor, graph, visited, recStack, path)) {
        return true;
      }
    } else if (recStack.has(neighbor)) {
      // Found cycle - add neighbor to complete the cycle in path
      path.push(neighbor);
      return true;
    }
  }

  recStack.delete(node);
  path.pop();
  return false;
}

/**
 * Find all connected node IDs from connections.
 *
 * @param connections - Pipeline connections
 * @returns Set of node IDs that have at least one connection
 */
export function getConnectedNodes(connections: KedroConnection[]): Set<string> {
  const connectedNodes = new Set<string>();

  connections.forEach((conn) => {
    if (isNodeId(conn.source)) connectedNodes.add(conn.source);
    if (isNodeId(conn.target)) connectedNodes.add(conn.target);
  });

  return connectedNodes;
}

/**
 * Find all connected dataset IDs from connections.
 *
 * @param connections - Pipeline connections
 * @returns Set of dataset IDs that have at least one connection
 */
export function getConnectedDatasets(connections: KedroConnection[]): Set<string> {
  const connectedDatasets = new Set<string>();

  connections.forEach((conn) => {
    if (isDatasetId(conn.source)) connectedDatasets.add(conn.source);
    if (isDatasetId(conn.target)) connectedDatasets.add(conn.target);
  });

  return connectedDatasets;
}

/**
 * Find orphaned nodes (nodes with no connections).
 *
 * @param nodeIds - All node IDs in the pipeline
 * @param connections - Pipeline connections
 * @returns Array of node IDs that are not connected
 */
export function findOrphanedNodes(
  nodeIds: string[],
  connections: KedroConnection[]
): string[] {
  const connectedNodes = getConnectedNodes(connections);
  return nodeIds.filter((id) => !connectedNodes.has(id));
}

/**
 * Find orphaned datasets (datasets with no connections).
 *
 * @param datasetIds - All dataset IDs in the pipeline
 * @param connections - Pipeline connections
 * @returns Array of dataset IDs that are not connected
 */
export function findOrphanedDatasets(
  datasetIds: string[],
  connections: KedroConnection[]
): string[] {
  const connectedDatasets = getConnectedDatasets(connections);
  return datasetIds.filter((id) => !connectedDatasets.has(id));
}
