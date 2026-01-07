/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { validatePipeline } from './validation';
import type { RootState } from '../types/redux';
import type { KedroNode, KedroDataset, KedroConnection } from '../types/kedro';

// Helper to create a minimal valid state
function createState(
  nodes: KedroNode[] = [],
  datasets: KedroDataset[] = [],
  connections: KedroConnection[] = []
): RootState {
  return {
    nodes: {
      byId: Object.fromEntries(nodes.map((n) => [n.id, n])),
      allIds: nodes.map((n) => n.id),
      selected: [],
      hovered: null,
    },
    datasets: {
      byId: Object.fromEntries(datasets.map((d) => [d.id, d])),
      allIds: datasets.map((d) => d.id),
      selected: [],
    },
    connections: {
      byId: Object.fromEntries(connections.map((c) => [c.id, c])),
      allIds: connections.map((c) => c.id),
      selected: [],
    },
    ui: {
      showTutorial: false,
      tutorialStep: 0,
      tutorialCompleted: false,
      showWalkthrough: false,
      walkthroughStep: 0,
      walkthroughCompleted: false,
      showProjectSetup: false,
      hasActiveProject: false,
      selectedComponent: null,
      showConfigPanel: false,
      showCodePreview: false,
      showValidationPanel: false,
      canvasZoom: 1,
      canvasPosition: { x: 0, y: 0 },
      showCodeViewer: false,
      selectedCodeFile: null,
      showExportWizard: false,
      pendingComponentId: null,
    },
    project: {
      current: null,
      savedList: [],
      lastSaved: null,
    },
    validation: {
      errors: [],
      warnings: [],
      isValid: true,
      lastChecked: null,
    },
    theme: {
      theme: 'light',
    },
  };
}

describe('validation', () => {
  describe('validatePipeline', () => {
    it('should return valid for empty pipeline', () => {
      const state = createState();
      const result = validatePipeline(state);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return valid for simple valid pipeline', () => {
      const nodes: KedroNode[] = [
        {
          id: 'node-1',
          name: 'process_data',
          type: 'data_processing',
          inputs: [],
          outputs: [],
          position: { x: 0, y: 0 },
        },
      ];

      const datasets: KedroDataset[] = [
        {
          id: 'dataset-1',
          name: 'raw_data',
          type: 'csv',
          filepath: 'data/01_raw/raw_data.csv',
          position: { x: 0, y: 0 },
        },
      ];

      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'dataset-1',
          target: 'node-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('circular dependencies', () => {
    it('should detect simple circular dependency', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'node_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'node_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'data_a', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'data_b', type: 'csv', position: { x: 0, y: 0 } },
      ];

      // node-1 -> dataset-1 -> node-2 -> dataset-2 -> node-1 (cycle!)
      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '4', source: 'dataset-2', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('error');
      expect(result.errors[0].componentType).toBe('pipeline');
      expect(result.errors[0].message).toContain('Circular dependency detected');
      expect(result.errors[0].message).toContain('node_a');
      expect(result.errors[0].message).toContain('node_b');
    });

    it('should detect self-referencing circular dependency', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'recursive_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
      ];

      // node-1 -> dataset-1 -> node-1 (self cycle!)
      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Circular dependency');
    });

    it('should not detect cycles in valid linear pipeline', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'load', type: 'data_ingestion', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'process', type: 'data_processing', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'save', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'raw', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'processed', type: 'parquet', position: { x: 0, y: 0 } },
        { id: 'dataset-3', name: 'final', type: 'json', position: { x: 0, y: 0 } },
      ];

      // Linear: load -> raw -> process -> processed -> save -> final
      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '4', source: 'dataset-2', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: '5', source: 'node-3', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('duplicate names', () => {
    it('should detect duplicate node names', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'process_data', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'process_data', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // One error for each duplicate
      expect(result.errors[0].message).toContain('Duplicate node name "process_data"');
      expect(result.errors[0].componentType).toBe('node');
    });

    it('should detect duplicate dataset names', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my_data', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'my_data', type: 'parquet', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // One error for each duplicate
      expect(result.errors[0].message).toContain('Duplicate dataset name "my_data"');
      expect(result.errors[0].componentType).toBe('dataset');
    });

    it('should detect duplicates case-insensitively', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'MyNode', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'mynode', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'MYNODE', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // All 3 are duplicates
    });

    it('should allow duplicate names across nodes and datasets', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'same_name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'same_name', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes, datasets);
      const result = validatePipeline(state);

      // This should be VALID - nodes and datasets can have same names
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('should reject node names starting with number', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '123node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid node name');
    });

    it('should reject node names with special characters', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'node@name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'node-name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'node.name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('should accept valid node names with spaces and underscores', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'My Node Name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'my_node_name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'MyNodeName123', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      // Should not have invalid name errors
      const nameErrors = result.errors.filter((e) => e.message.includes('Invalid node name'));
      expect(nameErrors).toHaveLength(0);
    });

    it('should reject dataset names not in snake_case', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'MyDataset', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'my-dataset', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-3', name: 'my.dataset', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-4', name: 'my dataset', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      result.errors.forEach((err) => {
        expect(err.message).toContain('Invalid dataset name');
        expect(err.suggestion).toContain('snake_case');
      });
    });

    it('should accept valid dataset names in snake_case', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my_dataset', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'raw_data_2023', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-3', name: 'processed_features', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      const nameErrors = result.errors.filter((e) => e.message.includes('Invalid dataset name'));
      expect(nameErrors).toHaveLength(0);
    });

    it('should reject dataset names starting with number', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: '2023_data', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid dataset name');
    });
  });

  describe('empty names', () => {
    it('should reject nodes with empty names', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: '   ', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      const emptyNameErrors = result.errors.filter((e) => e.message.includes('Node has no name'));
      expect(emptyNameErrors).toHaveLength(2);
    });

    it('should reject datasets with empty names', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: '', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: '   ', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      const emptyNameErrors = result.errors.filter((e) => e.message.includes('Dataset has no name'));
      expect(emptyNameErrors).toHaveLength(2);
    });

    it('should reject default names', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'Unnamed Node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'Unnamed Dataset', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes, datasets);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      const emptyNameErrors = result.errors.filter((e) => e.message.includes('has no name'));
      expect(emptyNameErrors).toHaveLength(2);
    });
  });

  describe('orphaned components', () => {
    it('should warn about orphaned nodes', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'connected_node', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'orphaned_node', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'data', type: 'csv', filepath: 'data/data.csv', position: { x: 0, y: 0 } },
      ];

      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(true); // Warnings don't block validity
      const orphanWarnings = result.warnings.filter((w) => w.message.includes('not connected'));
      expect(orphanWarnings).toHaveLength(1);
      expect(orphanWarnings[0].message).toContain('orphaned_node');
      expect(orphanWarnings[0].severity).toBe('warning');
    });

    it('should warn about orphaned datasets', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'connected_data', type: 'csv', filepath: 'data/data.csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'orphaned_data', type: 'csv', filepath: 'data/orphan.csv', position: { x: 0, y: 0 } },
      ];

      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(true);
      const orphanWarnings = result.warnings.filter((w) => w.message.includes('not connected'));
      expect(orphanWarnings).toHaveLength(1);
      expect(orphanWarnings[0].message).toContain('orphaned_data');
    });

    it('should not warn about fully connected components', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'node_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'node_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      const orphanWarnings = result.warnings.filter((w) => w.message.includes('not connected'));
      expect(orphanWarnings).toHaveLength(0);
    });
  });

  describe('missing code and configuration', () => {
    it('should warn about nodes without function code', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'node_with_code', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'node_without_code', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'node_empty_code', type: 'custom', inputs: [], outputs: [], functionCode: '   ', position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(true);
      expect(result.warnings.filter((w) => w.message.includes('no function code'))).toHaveLength(2);
    });

    it('should warn about datasets missing type', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my_data', type: undefined as unknown as KedroDataset['type'], position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      expect(result.warnings.length).toBeGreaterThan(0);
      const configWarning = result.warnings.find((w) => w.message.includes('missing'));
      expect(configWarning?.message).toContain('type');
    });

    it('should warn about non-memory datasets missing filepath', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my_csv', type: 'csv', filepath: '', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'my_parquet', type: 'parquet', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      expect(result.warnings.filter((w) => w.message.includes('filepath'))).toHaveLength(2);
    });

    it('should NOT warn about memory datasets missing filepath', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'temp_data', type: 'memory', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const result = validatePipeline(state);

      const filepathWarnings = result.warnings.filter((w) => w.message.includes('filepath'));
      expect(filepathWarnings).toHaveLength(0);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple error types simultaneously', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Empty name
        { id: 'node-2', name: '123invalid', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Invalid name
        { id: 'node-3', name: 'duplicate', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Duplicate
        { id: 'node-4', name: 'duplicate', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Duplicate
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4); // At least 4 errors
    });

    it('should separate errors from warnings', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Error: empty name
        { id: 'node-2', name: 'orphaned_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Warning: orphaned
      ];

      const state = createState(nodes);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(false); // Has errors
      const emptyNameErrors = result.errors.filter((e) => e.message.includes('has no name'));
      expect(emptyNameErrors).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThanOrEqual(2); // Orphaned node + missing code + possibly invalid name
      expect(result.errors[0].severity).toBe('error');
      expect(result.warnings[0].severity).toBe('warning');
    });

    it('should handle large pipeline efficiently', () => {
      // Create 100 nodes and 100 datasets
      const nodes: KedroNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        name: `node_${i}`,
        type: 'custom' as const,
        inputs: [],
        outputs: [],
        position: { x: 0, y: 0 },
      }));

      const datasets: KedroDataset[] = Array.from({ length: 100 }, (_, i) => ({
        id: `dataset-${i}`,
        name: `dataset_${i}`,
        type: 'csv' as const,
        filepath: `data/dataset_${i}.csv`,
        position: { x: 0, y: 0 },
      }));

      const state = createState(nodes, datasets);
      const start = Date.now();
      const result = validatePipeline(state);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should validate realistic ML pipeline', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'load_data', type: 'data_ingestion', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'clean_data', type: 'data_processing', inputs: [], outputs: [], position: { x: 100, y: 0 } },
        { id: 'node-3', name: 'engineer_features', type: 'data_processing', inputs: [], outputs: [], position: { x: 200, y: 0 } },
        { id: 'node-4', name: 'train_model', type: 'model_training', inputs: [], outputs: [], position: { x: 300, y: 0 } },
        { id: 'node-5', name: 'evaluate_model', type: 'model_evaluation', inputs: [], outputs: [], position: { x: 400, y: 0 } },
      ];

      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'raw_data', type: 'csv', layer: '01_raw', filepath: 'data/01_raw/raw.csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'cleaned_data', type: 'parquet', layer: '02_intermediate', position: { x: 0, y: 0 } },
        { id: 'dataset-3', name: 'features', type: 'parquet', layer: '04_feature', position: { x: 0, y: 0 } },
        { id: 'dataset-4', name: 'model', type: 'pickle', layer: '06_models', position: { x: 0, y: 0 } },
        { id: 'dataset-5', name: 'metrics', type: 'json', layer: '08_reporting', position: { x: 0, y: 0 } },
      ];

      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '4', source: 'dataset-2', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: '5', source: 'node-3', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: '6', source: 'dataset-3', target: 'node-4', sourceHandle: 'out', targetHandle: 'in' },
        { id: '7', source: 'node-4', target: 'dataset-4', sourceHandle: 'out', targetHandle: 'in' },
        { id: '8', source: 'dataset-4', target: 'node-5', sourceHandle: 'out', targetHandle: 'in' },
        { id: '9', source: 'node-5', target: 'dataset-5', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const result = validatePipeline(state);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // May have warnings about missing code, which is OK
    });
  });
});
