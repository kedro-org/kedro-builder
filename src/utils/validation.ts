/**
 * Pipeline validation utilities
 * Validates pipeline structure before export
 */

import type { RootState } from '../types/redux';

export interface ValidationError {
  id: string;
  severity: 'error' | 'warning';
  componentId: string;
  componentType: 'node' | 'dataset' | 'connection' | 'pipeline';
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
}

/**
 * Main validation function - runs all checks
 */
export function validatePipeline(state: RootState): ValidationResult {
  const allIssues: ValidationError[] = [];

  // ERRORS (block export)
  allIssues.push(...checkCircularDependencies(state));
  allIssues.push(...checkDuplicateNames(state));
  allIssues.push(...checkInvalidNames(state));
  allIssues.push(...checkEmptyNames(state));

  // WARNINGS (allow export)
  allIssues.push(...checkOrphanedNodes(state));
  allIssues.push(...checkOrphanedDatasets(state));
  allIssues.push(...checkMissingCode(state));
  allIssues.push(...checkMissingConfig(state));

  const errors = allIssues.filter((e) => e.severity === 'error');
  const warnings = allIssues.filter((e) => e.severity === 'warning');

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

/**
 * Build dependency graph from connections
 * Traces node → dataset → node paths to detect cycles
 */
function buildDependencyGraph(state: RootState): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  // Initialize graph with all nodes
  state.nodes.allIds.forEach((nodeId) => {
    graph.set(nodeId, new Set());
  });

  // Build a map of dataset inputs and outputs
  const datasetInputs = new Map<string, string[]>(); // dataset -> nodes that produce it
  const datasetOutputs = new Map<string, string[]>(); // dataset -> nodes that consume it

  state.connections.allIds.forEach((connId) => {
    const conn = state.connections.byId[connId];
    if (!conn) return;

    const source = conn.source;
    const target = conn.target;

    // node → dataset
    if (source.startsWith('node-') && target.startsWith('dataset-')) {
      if (!datasetInputs.has(target)) datasetInputs.set(target, []);
      datasetInputs.get(target)!.push(source);
    }
    // dataset → node
    else if (source.startsWith('dataset-') && target.startsWith('node-')) {
      if (!datasetOutputs.has(source)) datasetOutputs.set(source, []);
      datasetOutputs.get(source)!.push(target);
    }
  });

  // Build node-to-node edges through datasets
  // For each dataset, connect all producer nodes to all consumer nodes
  state.datasets.allIds.forEach((datasetId) => {
    const producers = datasetInputs.get(datasetId) || [];
    const consumers = datasetOutputs.get(datasetId) || [];

    producers.forEach((producerNode) => {
      consumers.forEach((consumerNode) => {
        if (!graph.has(producerNode)) graph.set(producerNode, new Set());
        graph.get(producerNode)!.add(consumerNode);
      });
    });
  });

  return graph;
}

/**
 * Detect cycles using DFS with recursion stack
 */
function detectCycle(
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
      if (detectCycle(neighbor, graph, visited, recStack, path)) {
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
 * Check for circular dependencies
 */
function checkCircularDependencies(state: RootState): ValidationError[] {
  const errors: ValidationError[] = [];
  const graph = buildDependencyGraph(state);
  const visited = new Set<string>();
  const processed = new Set<string>();

  for (const nodeId of state.nodes.allIds) {
    if (!visited.has(nodeId)) {
      const recStack = new Set<string>();
      const path: string[] = [];

      if (detectCycle(nodeId, graph, visited, recStack, path)) {
        // Found a cycle - convert node IDs to names
        const cycleNames = path
          .map((id) => state.nodes.byId[id]?.name || id)
          .join(' → ');

        // Only add error if we haven't processed this cycle
        const cycleKey = path.slice().sort().join('-');
        if (!processed.has(cycleKey)) {
          processed.add(cycleKey);
          errors.push({
            id: `error-circular-${nodeId}`,
            severity: 'error',
            componentId: nodeId,
            componentType: 'pipeline',
            message: `Circular dependency detected: ${cycleNames}`,
            suggestion: 'Remove one connection to break the cycle',
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Check for duplicate names
 */
function checkDuplicateNames(state: RootState): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeNames = new Map<string, string[]>(); // name -> [nodeIds]
  const datasetNames = new Map<string, string[]>(); // name -> [datasetIds]

  // Collect node names
  state.nodes.allIds.forEach((nodeId) => {
    const node = state.nodes.byId[nodeId];
    if (node && node.name) {
      const name = node.name.trim().toLowerCase();
      if (!nodeNames.has(name)) nodeNames.set(name, []);
      nodeNames.get(name)!.push(nodeId);
    }
  });

  // Collect dataset names
  state.datasets.allIds.forEach((datasetId) => {
    const dataset = state.datasets.byId[datasetId];
    if (dataset && dataset.name) {
      const name = dataset.name.trim().toLowerCase();
      if (!datasetNames.has(name)) datasetNames.set(name, []);
      datasetNames.get(name)!.push(datasetId);
    }
  });

  // Check for duplicate node names
  nodeNames.forEach((nodeIds, _name) => {
    if (nodeIds.length > 1) {
      nodeIds.forEach((nodeId) => {
        errors.push({
          id: `error-duplicate-node-${nodeId}`,
          severity: 'error',
          componentId: nodeId,
          componentType: 'node',
          message: `Duplicate node name "${state.nodes.byId[nodeId].name}" found in ${nodeIds.length} nodes`,
          suggestion: 'Rename this node to make it unique',
        });
      });
    }
  });

  // Check for duplicate dataset names
  datasetNames.forEach((datasetIds, _name) => {
    if (datasetIds.length > 1) {
      datasetIds.forEach((datasetId) => {
        errors.push({
          id: `error-duplicate-dataset-${datasetId}`,
          severity: 'error',
          componentId: datasetId,
          componentType: 'dataset',
          message: `Duplicate dataset name "${state.datasets.byId[datasetId].name}" found in ${datasetIds.length} datasets`,
          suggestion: 'Rename this dataset to make it unique',
        });
      });
    }
  });

  return errors;
}

/**
 * Check for invalid name characters
 */
function checkInvalidNames(state: RootState): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check nodes - allow letters, numbers, spaces, underscores
  state.nodes.allIds.forEach((nodeId) => {
    const node = state.nodes.byId[nodeId];
    if (node && node.name) {
      const trimmed = node.name.trim();
      if (!/^[a-zA-Z][a-zA-Z0-9_\s]*$/.test(trimmed)) {
        errors.push({
          id: `error-invalid-node-name-${nodeId}`,
          severity: 'error',
          componentId: nodeId,
          componentType: 'node',
          message: `Invalid node name "${node.name}"`,
          suggestion: 'Use only letters, numbers, spaces, and underscores. Must start with a letter.',
        });
      }
    }
  });

  // Check datasets - require snake_case
  state.datasets.allIds.forEach((datasetId) => {
    const dataset = state.datasets.byId[datasetId];
    if (dataset && dataset.name) {
      const trimmed = dataset.name.trim();
      if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
        errors.push({
          id: `error-invalid-dataset-name-${datasetId}`,
          severity: 'error',
          componentId: datasetId,
          componentType: 'dataset',
          message: `Invalid dataset name "${dataset.name}"`,
          suggestion: 'Use snake_case: lowercase letters, numbers, and underscores only.',
        });
      }
    }
  });

  return errors;
}

/**
 * Check for empty or default names
 */
function checkEmptyNames(state: RootState): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check nodes
  state.nodes.allIds.forEach((nodeId) => {
    const node = state.nodes.byId[nodeId];
    if (node) {
      const name = node.name?.trim() || '';
      if (!name || name === 'Unnamed Node') {
        errors.push({
          id: `error-empty-node-name-${nodeId}`,
          severity: 'error',
          componentId: nodeId,
          componentType: 'node',
          message: 'Node has no name',
          suggestion: 'Give this node a descriptive name',
        });
      }
    }
  });

  // Check datasets
  state.datasets.allIds.forEach((datasetId) => {
    const dataset = state.datasets.byId[datasetId];
    if (dataset) {
      const name = dataset.name?.trim() || '';
      if (!name || name === 'Unnamed Dataset') {
        errors.push({
          id: `error-empty-dataset-name-${datasetId}`,
          severity: 'error',
          componentId: datasetId,
          componentType: 'dataset',
          message: 'Dataset has no name',
          suggestion: 'Give this dataset a descriptive name',
        });
      }
    }
  });

  return errors;
}

/**
 * Check for orphaned nodes (no connections)
 */
function checkOrphanedNodes(state: RootState): ValidationError[] {
  const warnings: ValidationError[] = [];
  const connectedNodes = new Set<string>();

  // Collect all connected node IDs
  state.connections.allIds.forEach((connId) => {
    const conn = state.connections.byId[connId];
    if (conn) {
      if (conn.source.startsWith('node-')) connectedNodes.add(conn.source);
      if (conn.target.startsWith('node-')) connectedNodes.add(conn.target);
    }
  });

  // Check for orphaned nodes
  state.nodes.allIds.forEach((nodeId) => {
    if (!connectedNodes.has(nodeId)) {
      const node = state.nodes.byId[nodeId];
      warnings.push({
        id: `warning-orphan-node-${nodeId}`,
        severity: 'warning',
        componentId: nodeId,
        componentType: 'node',
        message: `Node "${node.name}" is not connected to any datasets`,
        suggestion: 'Connect this node or remove it from the pipeline',
      });
    }
  });

  return warnings;
}

/**
 * Check for orphaned datasets (no connections)
 */
function checkOrphanedDatasets(state: RootState): ValidationError[] {
  const warnings: ValidationError[] = [];
  const connectedDatasets = new Set<string>();

  // Collect all connected dataset IDs
  state.connections.allIds.forEach((connId) => {
    const conn = state.connections.byId[connId];
    if (conn) {
      if (conn.source.startsWith('dataset-')) connectedDatasets.add(conn.source);
      if (conn.target.startsWith('dataset-')) connectedDatasets.add(conn.target);
    }
  });

  // Check for orphaned datasets
  state.datasets.allIds.forEach((datasetId) => {
    if (!connectedDatasets.has(datasetId)) {
      const dataset = state.datasets.byId[datasetId];
      warnings.push({
        id: `warning-orphan-dataset-${datasetId}`,
        severity: 'warning',
        componentId: datasetId,
        componentType: 'dataset',
        message: `Dataset "${dataset.name}" is not connected to any nodes`,
        suggestion: 'Connect this dataset or remove it from the pipeline',
      });
    }
  });

  return warnings;
}

/**
 * Check for nodes with missing function code
 */
function checkMissingCode(state: RootState): ValidationError[] {
  const warnings: ValidationError[] = [];

  state.nodes.allIds.forEach((nodeId) => {
    const node = state.nodes.byId[nodeId];
    if (node) {
      const code = node.functionCode?.trim() || '';
      if (!code) {
        warnings.push({
          id: `warning-no-code-${nodeId}`,
          severity: 'warning',
          componentId: nodeId,
          componentType: 'node',
          message: `Node "${node.name}" has no function code`,
          suggestion: 'Add Python code for this node or it will need to be implemented later',
        });
      }
    }
  });

  return warnings;
}

/**
 * Check for datasets with missing configuration
 */
function checkMissingConfig(state: RootState): ValidationError[] {
  const warnings: ValidationError[] = [];

  state.datasets.allIds.forEach((datasetId) => {
    const dataset = state.datasets.byId[datasetId];
    if (dataset) {
      const issues: string[] = [];

      if (!dataset.type) {
        issues.push('type');
      }

      if (dataset.type !== 'memory' && !dataset.filepath?.trim()) {
        issues.push('filepath');
      }

      if (issues.length > 0) {
        warnings.push({
          id: `warning-missing-config-${datasetId}`,
          severity: 'warning',
          componentId: datasetId,
          componentType: 'dataset',
          message: `Dataset "${dataset.name}" is missing: ${issues.join(', ')}`,
          suggestion: 'Configure this dataset in the config panel',
        });
      }
    }
  });

  return warnings;
}
