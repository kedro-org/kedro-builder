/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { RootState } from '../../../types/redux';
import type { KedroNode, KedroDataset, KedroConnection } from '../../../types/kedro';
import {
  ValidatorRegistry,
  CircularDependencyValidator,
  DuplicateNameValidator,
  EmptyNameValidator,
  InvalidNameValidator,
  MissingCodeValidator,
  MissingConfigValidator,
  OrphanedNodeValidator,
  OrphanedDatasetValidator,
  createDefaultValidatorRegistry,
  getDefaultValidatorRegistry,
} from './index';

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

describe('ValidatorRegistry', () => {
  let registry: ValidatorRegistry;

  beforeEach(() => {
    registry = new ValidatorRegistry();
  });

  it('should register validators with chaining', () => {
    const v1 = new EmptyNameValidator();
    const v2 = new InvalidNameValidator();

    const result = registry.register(v1).register(v2);

    expect(result).toBe(registry);
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.getAll()).toContain(v1);
    expect(registry.getAll()).toContain(v2);
  });

  it('should return empty array for empty registry', () => {
    expect(registry.validateAll(createState())).toEqual([]);
  });

  it('should collect results from all validators', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: '123invalid', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    registry.register(new EmptyNameValidator()).register(new InvalidNameValidator());

    const results = registry.validateAll(createState(nodes));
    expect(results).toHaveLength(2);
    expect(results.some((r) => r.message.includes('has no name'))).toBe(true);
    expect(results.some((r) => r.message.includes('Invalid node name'))).toBe(true);
  });

  it('should return empty array when all validators pass', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'valid_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    registry.register(new EmptyNameValidator()).register(new InvalidNameValidator());
    expect(registry.validateAll(createState(nodes))).toEqual([]);
  });
});

describe('CircularDependencyValidator', () => {
  const validator = new CircularDependencyValidator();

  it('should return empty for linear pipeline', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'load', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'process', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    const connections: KedroConnection[] = [
      { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
    ];

    expect(validator.validate(createState(nodes, [], connections))).toEqual([]);
  });

  it('should detect circular dependency', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'node_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'node_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'data_a', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'data_b', type: 'csv', position: { x: 0, y: 0 } },
    ];
    const connections: KedroConnection[] = [
      { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      { id: '4', source: 'dataset-2', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const results = validator.validate(createState(nodes, datasets, connections));
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('error');
    expect(results[0].componentType).toBe('pipeline');
    expect(results[0].message).toContain('Circular dependency detected');
    expect(results[0].message).toContain('node_a');
    expect(results[0].message).toContain('node_b');
  });
});

describe('DuplicateNameValidator', () => {
  const validator = new DuplicateNameValidator();

  it('should return empty for unique names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'node_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'node_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes))).toEqual([]);
  });

  it('should detect duplicate node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'process_data', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'process_data', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState(nodes));
    expect(results).toHaveLength(2);
    expect(results[0].severity).toBe('error');
    expect(results[0].componentType).toBe('node');
    expect(results[0].message).toContain('Duplicate node name "process_data"');
  });

  it('should detect duplicate dataset names', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_data', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'my_data', type: 'parquet', position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState([], datasets));
    expect(results).toHaveLength(2);
    expect(results[0].componentType).toBe('dataset');
    expect(results[0].message).toContain('Duplicate dataset name "my_data"');
  });

  it('should detect duplicates case-insensitively', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'MyNode', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'mynode', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes))).toHaveLength(2);
  });

  it('should allow same name across nodes and datasets', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'same_name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'same_name', type: 'csv', position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes, datasets))).toEqual([]);
  });

  it('should handle multiple duplicate groups', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'group_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'group_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'group_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-4', name: 'group_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState(nodes));
    expect(results).toHaveLength(4);
  });

  it('should detect duplicates after trimming whitespace', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '  my_node  ', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes))).toHaveLength(2);
  });
});

describe('EmptyNameValidator', () => {
  const validator = new EmptyNameValidator();

  it('should detect empty node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState(nodes));
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('error');
    expect(results[0].componentId).toBe('node-1');
    expect(results[0].message).toBe('Node has no name');
  });

  it('should detect whitespace-only and default node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '   ', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'Unnamed Node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes))).toHaveLength(2);
  });

  it('should detect empty dataset names and default names', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: '', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'Unnamed Dataset', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState([], datasets));
    expect(results).toHaveLength(2);
    expect(results[0].componentType).toBe('dataset');
    expect(results[0].message).toBe('Dataset has no name');
  });

  it('should pass for valid names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'valid_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'valid_dataset', type: 'csv', position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes, datasets))).toEqual([]);
  });
});

describe('InvalidNameValidator', () => {
  const validator = new InvalidNameValidator();

  it('should accept valid node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'My Node Name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'my_node_name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'Node 123', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes))).toEqual([]);
  });

  it('should reject node names starting with number or with special characters', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '123node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'node@name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'node-name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState(nodes));
    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result.severity).toBe('error');
      expect(result.message).toContain('Invalid node name');
    });
  });

  it('should accept valid snake_case dataset names', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_dataset', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'raw_data_2023', type: 'csv', position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState([], datasets))).toEqual([]);
  });

  it('should reject dataset names with uppercase, spaces, hyphens, dots, or leading number/underscore', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'MyDataset', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'my dataset', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-3', name: 'my-dataset', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-4', name: '2023_data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState([], datasets));
    expect(results).toHaveLength(4);
    results.forEach((result) => {
      expect(result.message).toContain('Invalid dataset name');
    });
  });
});

describe('MissingCodeValidator', () => {
  const validator = new MissingCodeValidator();

  it('should pass for nodes with code', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], functionCode: 'return data', position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes))).toEqual([]);
  });

  it('should warn about nodes without code, with empty code, or whitespace-only code', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'no_code', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'empty_code', type: 'custom', inputs: [], outputs: [], functionCode: '', position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'whitespace_code', type: 'custom', inputs: [], outputs: [], functionCode: '   \n  ', position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState(nodes));
    expect(results).toHaveLength(3);
    expect(results[0].severity).toBe('warning');
    expect(results[0].componentId).toBe('node-1');
    expect(results[0].message).toBe('Node "no_code" has no function code');
    expect(results[0].suggestion).toContain('Add Python code');
    results.forEach((r) => expect(r.message).toContain('has no function code'));
  });

  it('should detect mix of nodes with and without code', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'with_code', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'without_code', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState(nodes));
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('without_code');
  });
});

describe('MissingConfigValidator', () => {
  const validator = new MissingConfigValidator();

  it('should pass for fully configured datasets', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_csv', type: 'csv', filepath: 'data/my.csv', position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState([], datasets))).toEqual([]);
  });

  it('should warn about missing type', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_data', type: undefined as unknown as KedroDataset['type'], filepath: 'data.csv', position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState([], datasets));
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toBe('Dataset "my_data" is missing: type');
  });

  it('should warn about missing filepath for non-memory datasets', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_csv', type: 'csv', filepath: '', position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState([], datasets));
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('missing: filepath');
  });

  it('should warn about both missing type and filepath', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'incomplete', type: undefined as unknown as KedroDataset['type'], position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState([], datasets));
    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Dataset "incomplete" is missing: type, filepath');
  });

  it('should NOT warn about memory datasets missing filepath', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'temp_data', type: 'memory', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'temp_data_2', type: 'memory', filepath: '', position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState([], datasets))).toEqual([]);
  });

  it('should detect multiple datasets with missing config', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'missing_type', type: undefined as unknown as KedroDataset['type'], filepath: 'data.csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'missing_filepath', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-3', name: 'complete', type: 'json', filepath: 'data.json', position: { x: 0, y: 0 } },
    ];

    const results = validator.validate(createState([], datasets));
    expect(results).toHaveLength(2);
  });
});

describe('OrphanedNodeValidator', () => {
  const validator = new OrphanedNodeValidator();

  it('should pass for connected nodes', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    expect(validator.validate(createState(nodes, [], connections))).toEqual([]);
  });

  it('should warn about orphaned nodes', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'connected_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'orphaned_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const results = validator.validate(createState(nodes, [], connections));
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('warning');
    expect(results[0].componentId).toBe('node-2');
    expect(results[0].message).toBe('Node "orphaned_node" is not connected to any datasets');
  });

  it('should detect multiple orphaned nodes', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'orphan_1', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'orphan_2', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState(nodes))).toHaveLength(2);
  });
});

describe('OrphanedDatasetValidator', () => {
  const validator = new OrphanedDatasetValidator();

  it('should pass for connected datasets', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_data', type: 'csv', position: { x: 0, y: 0 } },
    ];
    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    expect(validator.validate(createState(nodes, datasets, connections))).toEqual([]);
  });

  it('should warn about orphaned datasets', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'connected_data', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'orphaned_data', type: 'csv', position: { x: 0, y: 0 } },
    ];
    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const results = validator.validate(createState([], datasets, connections));
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('warning');
    expect(results[0].componentId).toBe('dataset-2');
    expect(results[0].message).toBe('Dataset "orphaned_data" is not connected to any nodes');
  });

  it('should detect multiple orphaned datasets', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'orphan_1', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'orphan_2', type: 'csv', position: { x: 0, y: 0 } },
    ];
    expect(validator.validate(createState([], datasets))).toHaveLength(2);
  });
});

describe('Factory functions', () => {
  it('should create registry with all 8 validators (4 error, 4 warning)', () => {
    const registry = createDefaultValidatorRegistry();
    const all = registry.getAll();

    expect(all).toHaveLength(8);
    expect(all.filter((v) => v.severity === 'error')).toHaveLength(4);
    expect(all.filter((v) => v.severity === 'warning')).toHaveLength(4);
    expect(all.map((v) => v.id)).toEqual(
      expect.arrayContaining([
        'circular-dependency', 'duplicate-name', 'invalid-name', 'empty-name',
        'orphaned-node', 'orphaned-dataset', 'missing-code', 'missing-config',
      ])
    );
  });

  it('should return singleton from getDefaultValidatorRegistry', () => {
    expect(getDefaultValidatorRegistry()).toBe(getDefaultValidatorRegistry());
  });

  it('should create new instances from createDefaultValidatorRegistry', () => {
    expect(createDefaultValidatorRegistry()).not.toBe(createDefaultValidatorRegistry());
  });
});

describe('Integration', () => {
  it('should validate complex pipeline with multiple issues', () => {
    const registry = createDefaultValidatorRegistry();

    const nodes: KedroNode[] = [
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: '123invalid', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'duplicate', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-4', name: 'duplicate', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const results = registry.validateAll(createState(nodes));
    const errors = results.filter((r) => r.severity === 'error');
    const warnings = results.filter((r) => r.severity === 'warning');

    expect(errors.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should validate perfect pipeline without issues', () => {
    const registry = createDefaultValidatorRegistry();

    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'load_data', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'process_data', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
    ];
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'raw_data', type: 'csv', filepath: 'data/raw.csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'processed_data', type: 'parquet', filepath: 'data/processed.parquet', position: { x: 0, y: 0 } },
    ];
    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'conn-3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
    ];

    expect(registry.validateAll(createState(nodes, datasets, connections))).toEqual([]);
  });
});
