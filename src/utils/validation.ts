/**
 * Pipeline validation utilities
 * Validates pipeline structure before export
 */

import type { RootState } from '../types/redux';
import type { KedroConnection } from '../types/kedro';
import {
  buildDependencyGraph,
  detectCycles,
  findOrphanedNodes,
  findOrphanedDatasets,
} from '../domain/PipelineGraph';

// ============================================================
// Real-time Input Validation
// ============================================================

export interface InputValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

// Regex patterns for name validation
const NODE_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_\s]*$/;
const DATASET_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

// Reserved Python keywords that cannot be used as names
export const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
]);

/**
 * Check if a name is a reserved Python keyword
 * @param name - The name to check (case-insensitive)
 * @returns true if the name is a reserved Python keyword
 */
export function isPythonKeyword(name: string): boolean {
  const trimmed = name.trim();
  return PYTHON_KEYWORDS.has(trimmed) || PYTHON_KEYWORDS.has(trimmed.toLowerCase());
}

/**
 * Validate a node name in real-time as user types
 * @param name - The name to validate
 * @param existingNames - Set of existing node names (excluding current node)
 * @returns Validation result with error message if invalid
 */
export function validateNodeName(name: string, existingNames?: Set<string>): InputValidationResult {
  const trimmed = name.trim();

  // Check for empty name
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Name is required' };
  }

  // Check minimum length
  if (trimmed.length < 2) {
    return { isValid: false, errorMessage: 'Name must be at least 2 characters' };
  }

  // Check maximum length
  if (trimmed.length > 100) {
    return { isValid: false, errorMessage: 'Name must be less than 100 characters' };
  }

  // Check pattern (starts with letter, allows letters, numbers, underscores, spaces)
  if (!NODE_NAME_PATTERN.test(trimmed)) {
    if (!/^[a-zA-Z]/.test(trimmed)) {
      return { isValid: false, errorMessage: 'Name must start with a letter' };
    }
    return { isValid: false, errorMessage: 'Name can only contain letters, numbers, underscores, and spaces' };
  }

  // Check for reserved Python keywords
  const lowerName = trimmed.toLowerCase();
  if (PYTHON_KEYWORDS.has(trimmed) || PYTHON_KEYWORDS.has(lowerName)) {
    return { isValid: false, errorMessage: `"${trimmed}" is a reserved Python keyword` };
  }

  // Check for duplicates
  if (existingNames && existingNames.has(lowerName)) {
    return { isValid: false, errorMessage: 'A node with this name already exists' };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * Validate a dataset name in real-time as user types
 * Dataset names must be in snake_case format
 * @param name - The name to validate
 * @param existingNames - Set of existing dataset names (excluding current dataset)
 * @returns Validation result with error message if invalid
 */
export function validateDatasetName(name: string, existingNames?: Set<string>): InputValidationResult {
  const trimmed = name.trim();

  // Check for empty name
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Name is required' };
  }

  // Check minimum length
  if (trimmed.length < 2) {
    return { isValid: false, errorMessage: 'Name must be at least 2 characters' };
  }

  // Check maximum length
  if (trimmed.length > 100) {
    return { isValid: false, errorMessage: 'Name must be less than 100 characters' };
  }

  // Check for spaces (common mistake)
  if (/\s/.test(trimmed)) {
    return { isValid: false, errorMessage: 'Dataset names cannot contain spaces. Use underscores instead.' };
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(trimmed)) {
    return { isValid: false, errorMessage: 'Dataset names must be lowercase (snake_case format)' };
  }

  // Check pattern (snake_case: starts with lowercase letter, only lowercase, numbers, underscores)
  if (!DATASET_NAME_PATTERN.test(trimmed)) {
    if (!/^[a-z]/.test(trimmed)) {
      return { isValid: false, errorMessage: 'Name must start with a lowercase letter' };
    }
    return { isValid: false, errorMessage: 'Use snake_case: lowercase letters, numbers, and underscores only' };
  }

  // Check for reserved Python keywords
  if (PYTHON_KEYWORDS.has(trimmed)) {
    return { isValid: false, errorMessage: `"${trimmed}" is a reserved Python keyword` };
  }

  // Check for duplicates
  if (existingNames && existingNames.has(trimmed)) {
    return { isValid: false, errorMessage: 'A dataset with this name already exists' };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * Sanitize a string for use in Python identifiers
 * Converts to snake_case and removes invalid characters
 */
export function sanitizeForPython(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '')     // Remove invalid characters
    .replace(/^[0-9]+/, '')         // Remove leading numbers
    .replace(/_+/g, '_')            // Replace multiple underscores with single
    .replace(/^_|_$/g, '');         // Remove leading/trailing underscores
}

// ============================================================
// Pipeline Validation (for export)
// ============================================================

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
 * Helper to get connections array from state
 */
function getConnectionsArray(state: RootState): KedroConnection[] {
  return state.connections.allIds.map((id) => state.connections.byId[id]).filter(Boolean);
}

/**
 * Check for circular dependencies
 * Uses PipelineGraph service for graph operations
 */
function checkCircularDependencies(state: RootState): ValidationError[] {
  const errors: ValidationError[] = [];
  const connections = getConnectionsArray(state);
  const graph = buildDependencyGraph(state.nodes.allIds, connections);
  const cycles = detectCycles(graph);

  cycles.forEach((cycle) => {
    if (cycle.hasCycle && cycle.cyclePath.length > 0) {
      const nodeId = cycle.cyclePath[0];
      // Convert node IDs to names for display
      const cycleNames = cycle.cyclePath
        .map((id) => state.nodes.byId[id]?.name || id)
        .join(' → ');

      errors.push({
        id: `error-circular-${nodeId}`,
        severity: 'error',
        componentId: nodeId,
        componentType: 'pipeline',
        message: `Circular dependency detected: ${cycleNames}`,
        suggestion: 'Remove one connection to break the cycle',
      });
    }
  });

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
  nodeNames.forEach((nodeIds) => {
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
  datasetNames.forEach((datasetIds) => {
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
          suggestion: 'Use snake_case: lowercase letters, numbers, and underscores only (no spaces allowed).',
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
 * Uses PipelineGraph service for orphan detection
 */
function checkOrphanedNodes(state: RootState): ValidationError[] {
  const warnings: ValidationError[] = [];
  const connections = getConnectionsArray(state);
  const orphanedNodeIds = findOrphanedNodes(state.nodes.allIds, connections);

  orphanedNodeIds.forEach((nodeId) => {
    const node = state.nodes.byId[nodeId];
    warnings.push({
      id: `warning-orphan-node-${nodeId}`,
      severity: 'warning',
      componentId: nodeId,
      componentType: 'node',
      message: `Node "${node.name}" is not connected to any datasets`,
      suggestion: 'Connect this node or remove it from the pipeline',
    });
  });

  return warnings;
}

/**
 * Check for orphaned datasets (no connections)
 * Uses PipelineGraph service for orphan detection
 */
function checkOrphanedDatasets(state: RootState): ValidationError[] {
  const warnings: ValidationError[] = [];
  const connections = getConnectionsArray(state);
  const orphanedDatasetIds = findOrphanedDatasets(state.datasets.allIds, connections);

  orphanedDatasetIds.forEach((datasetId) => {
    const dataset = state.datasets.byId[datasetId];
    warnings.push({
      id: `warning-orphan-dataset-${datasetId}`,
      severity: 'warning',
      componentId: datasetId,
      componentType: 'dataset',
      message: `Dataset "${dataset.name}" is not connected to any nodes`,
      suggestion: 'Connect this dataset or remove it from the pipeline',
    });
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
