import { isNodeId, isDatasetId } from '@/domain/IdGenerator';

/**
 * Utility for detecting cycles in pipeline connections
 * Uses DFS (Depth-First Search) to detect cycles in the graph
 */

interface Connection {
  source: string;
  target: string;
}

/**
 * Check if adding a new connection would create a cycle in the pipeline
 * @param newSource - Source component ID
 * @param newTarget - Target component ID
 * @param existingConnections - Array of existing connections
 * @param nodeIds - Array of all node IDs
 * @param datasetIds - Array of all dataset IDs
 * @returns true if adding the connection would create a cycle
 */
export function wouldCreateCycle(
  newSource: string,
  newTarget: string,
  existingConnections: Connection[],
  nodeIds: string[],
  datasetIds: string[]
): boolean {
  // Build dependency graph including the new connection
  // We need to trace: node → dataset → node paths

  // Map of dataset inputs and outputs
  const datasetInputs = new Map<string, string[]>(); // dataset -> nodes that produce it
  const datasetOutputs = new Map<string, string[]>(); // dataset -> nodes that consume it

  // Add existing connections
  existingConnections.forEach((conn) => {
    if (isNodeId(conn.source) && isDatasetId(conn.target)) {
      // node → dataset
      if (!datasetInputs.has(conn.target)) datasetInputs.set(conn.target, []);
      datasetInputs.get(conn.target)!.push(conn.source);
    } else if (isDatasetId(conn.source) && isNodeId(conn.target)) {
      // dataset → node
      if (!datasetOutputs.has(conn.source)) datasetOutputs.set(conn.source, []);
      datasetOutputs.get(conn.source)!.push(conn.target);
    }
  });

  // Add the new connection
  if (isNodeId(newSource) && isDatasetId(newTarget)) {
    if (!datasetInputs.has(newTarget)) datasetInputs.set(newTarget, []);
    datasetInputs.get(newTarget)!.push(newSource);
  } else if (isDatasetId(newSource) && isNodeId(newTarget)) {
    if (!datasetOutputs.has(newSource)) datasetOutputs.set(newSource, []);
    datasetOutputs.get(newSource)!.push(newTarget);
  }

  // Build node-to-node graph through datasets
  const graph = new Map<string, Set<string>>();
  nodeIds.forEach((nodeId) => graph.set(nodeId, new Set()));

  datasetIds.forEach((datasetId) => {
    const producers = datasetInputs.get(datasetId) || [];
    const consumers = datasetOutputs.get(datasetId) || [];

    producers.forEach((producerNode) => {
      consumers.forEach((consumerNode) => {
        if (!graph.has(producerNode)) graph.set(producerNode, new Set());
        graph.get(producerNode)!.add(consumerNode);
      });
    });
  });

  // DFS to detect cycle
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  // Check all nodes for cycles
  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) return true;
    }
  }

  return false;
}
