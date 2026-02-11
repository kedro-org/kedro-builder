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

  describe('register/unregister/get', () => {
    it('should register a validator', () => {
      const validator = new EmptyNameValidator();
      registry.register(validator);

      expect(registry.get('empty-name')).toBe(validator);
    });

    it('should allow chaining register calls', () => {
      const v1 = new EmptyNameValidator();
      const v2 = new InvalidNameValidator();

      const result = registry.register(v1).register(v2);

      expect(result).toBe(registry);
      expect(registry.get('empty-name')).toBe(v1);
      expect(registry.get('invalid-name')).toBe(v2);
    });

    it('should unregister a validator', () => {
      const validator = new EmptyNameValidator();
      registry.register(validator);

      const removed = registry.unregister('empty-name');

      expect(removed).toBe(true);
      expect(registry.get('empty-name')).toBeUndefined();
    });

    it('should return false when unregistering non-existent validator', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });

    it('should return undefined for non-existent validator', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return empty array when no validators registered', () => {
      expect(registry.getAll()).toEqual([]);
    });

    it('should return all registered validators', () => {
      const v1 = new EmptyNameValidator();
      const v2 = new InvalidNameValidator();
      const v3 = new DuplicateNameValidator();

      registry.register(v1).register(v2).register(v3);

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all).toContain(v1);
      expect(all).toContain(v2);
      expect(all).toContain(v3);
    });
  });

  describe('getBySeverity', () => {
    beforeEach(() => {
      registry
        .register(new EmptyNameValidator()) // error
        .register(new InvalidNameValidator()) // error
        .register(new DuplicateNameValidator()) // error
        .register(new CircularDependencyValidator()) // error
        .register(new MissingCodeValidator()) // warning
        .register(new MissingConfigValidator()) // warning
        .register(new OrphanedNodeValidator()) // warning
        .register(new OrphanedDatasetValidator()); // warning
    });

    it('should return only error validators', () => {
      const errors = registry.getBySeverity('error');
      expect(errors).toHaveLength(4);
      errors.forEach((v) => {
        expect(v.severity).toBe('error');
      });
    });

    it('should return only warning validators', () => {
      const warnings = registry.getBySeverity('warning');
      expect(warnings).toHaveLength(4);
      warnings.forEach((v) => {
        expect(v.severity).toBe('warning');
      });
    });

    it('should return empty array when no validators match severity', () => {
      const emptyRegistry = new ValidatorRegistry();
      expect(emptyRegistry.getBySeverity('error')).toEqual([]);
      expect(emptyRegistry.getBySeverity('warning')).toEqual([]);
    });
  });

  describe('validateAll', () => {
    it('should return empty array for empty registry', () => {
      const state = createState();
      expect(registry.validateAll(state)).toEqual([]);
    });

    it('should collect results from all validators', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Empty name
        { id: 'node-2', name: '123invalid', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Invalid name
      ];

      registry
        .register(new EmptyNameValidator())
        .register(new InvalidNameValidator());

      const state = createState(nodes);
      const results = registry.validateAll(state);

      expect(results).toHaveLength(2);
      expect(results.some((r) => r.message.includes('has no name'))).toBe(true);
      expect(results.some((r) => r.message.includes('Invalid node name'))).toBe(true);
    });

    it('should return empty array when all validators pass', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'valid_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      registry.register(new EmptyNameValidator()).register(new InvalidNameValidator());

      const state = createState(nodes);
      const results = registry.validateAll(state);

      expect(results).toEqual([]);
    });
  });

  describe('validateErrors', () => {
    beforeEach(() => {
      registry
        .register(new EmptyNameValidator()) // error
        .register(new InvalidNameValidator()) // error
        .register(new MissingCodeValidator()) // warning
        .register(new OrphanedNodeValidator()); // warning
    });

    it('should only run error validators', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Empty name (error)
      ];

      const state = createState(nodes);
      const results = registry.validateErrors(state);

      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('error');
      expect(results[0].message).toContain('has no name');
    });

    it('should not run warning validators', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'orphaned_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Orphaned (warning only)
      ];

      const state = createState(nodes);
      const results = registry.validateErrors(state);

      expect(results).toEqual([]);
    });
  });

  describe('validateWarnings', () => {
    beforeEach(() => {
      registry
        .register(new EmptyNameValidator()) // error
        .register(new InvalidNameValidator()) // error
        .register(new MissingCodeValidator()) // warning
        .register(new OrphanedNodeValidator()); // warning
    });

    it('should only run warning validators', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'orphaned_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Orphaned (warning)
      ];

      const state = createState(nodes);
      const results = registry.validateWarnings(state);

      expect(results).toHaveLength(2); // Orphaned + missing code
      results.forEach((r) => {
        expect(r.severity).toBe('warning');
      });
    });

    it('should not run error validators', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Empty name (error only)
      ];

      const state = createState(nodes);
      const results = registry.validateWarnings(state);

      // Should only get warning about missing code, not empty name error
      expect(results.every((r) => r.severity === 'warning')).toBe(true);
    });
  });
});

describe('CircularDependencyValidator', () => {
  const validator = new CircularDependencyValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('circular-dependency');
    expect(validator.name).toBe('Circular Dependency Check');
    expect(validator.severity).toBe('error');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  it('should return empty array for linear pipeline', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'load', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'process', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'raw', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'processed', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    expect(validator.validate(state)).toEqual([]);
  });

  it('should detect simple circular dependency', () => {
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

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].id).toMatch(/^error-circular-/);
    expect(results[0].severity).toBe('error');
    expect(results[0].componentType).toBe('pipeline');
    expect(results[0].message).toContain('Circular dependency detected');
    expect(results[0].message).toContain('node_a');
    expect(results[0].message).toContain('node_b');
    expect(results[0].suggestion).toBe('Remove one connection to break the cycle');
  });

  it('should detect self-referencing cycle', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'recursive_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      { id: '2', source: 'dataset-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].message).toContain('Circular dependency');
  });
});

describe('DuplicateNameValidator', () => {
  const validator = new DuplicateNameValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('duplicate-name');
    expect(validator.name).toBe('Duplicate Name Check');
    expect(validator.severity).toBe('error');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  it('should return empty array for unique names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'node_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'node_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    expect(validator.validate(state)).toEqual([]);
  });

  it('should detect duplicate node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'process_data', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'process_data', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(2);
    results.forEach((result) => {
      expect(result.id).toMatch(/^error-duplicate-node-/);
      expect(result.severity).toBe('error');
      expect(result.componentType).toBe('node');
      expect(result.message).toContain('Duplicate node name "process_data"');
      expect(result.message).toContain('found in 2 nodes');
      expect(result.suggestion).toBe('Rename this node to make it unique');
    });
  });

  it('should detect duplicate dataset names', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_data', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'my_data', type: 'parquet', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(2);
    results.forEach((result) => {
      expect(result.id).toMatch(/^error-duplicate-dataset-/);
      expect(result.severity).toBe('error');
      expect(result.componentType).toBe('dataset');
      expect(result.message).toContain('Duplicate dataset name "my_data"');
      expect(result.message).toContain('found in 2 datasets');
      expect(result.suggestion).toBe('Rename this dataset to make it unique');
    });
  });

  it('should detect duplicates case-insensitively', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'MyNode', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'mynode', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'MYNODE', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(3);
  });

  it('should handle multiple duplicate groups', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'group_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'group_a', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'group_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-4', name: 'group_b', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(4); // 2 errors for each group
    expect(results.filter((r) => r.message.includes('group_a'))).toHaveLength(2);
    expect(results.filter((r) => r.message.includes('group_b'))).toHaveLength(2);
  });

  it('should allow same name across nodes and datasets', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'same_name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'same_name', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes, datasets);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should handle trimmed name matching', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '  my_node  ', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(2); // Should detect as duplicates after trimming
  });
});

describe('EmptyNameValidator', () => {
  const validator = new EmptyNameValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('empty-name');
    expect(validator.name).toBe('Empty Name Check');
    expect(validator.severity).toBe('error');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  it('should return empty array for named nodes and datasets', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'valid_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'valid_dataset', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes, datasets);
    expect(validator.validate(state)).toEqual([]);
  });

  it('should detect empty node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('error-empty-node-name-node-1');
    expect(results[0].severity).toBe('error');
    expect(results[0].componentId).toBe('node-1');
    expect(results[0].componentType).toBe('node');
    expect(results[0].message).toBe('Node has no name');
    expect(results[0].suggestion).toBe('Give this node a descriptive name');
  });

  it('should detect whitespace-only node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '   ', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Node has no name');
  });

  it('should detect default node names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'Unnamed Node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Node has no name');
  });

  it('should detect empty dataset names', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: '', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('error-empty-dataset-name-dataset-1');
    expect(results[0].severity).toBe('error');
    expect(results[0].componentId).toBe('dataset-1');
    expect(results[0].componentType).toBe('dataset');
    expect(results[0].message).toBe('Dataset has no name');
    expect(results[0].suggestion).toBe('Give this dataset a descriptive name');
  });

  it('should detect default dataset names', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'Unnamed Dataset', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Dataset has no name');
  });

  it('should detect multiple empty names', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: '   ', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: '', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'Unnamed Dataset', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes, datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(4);
  });
});

describe('InvalidNameValidator', () => {
  const validator = new InvalidNameValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('invalid-name');
    expect(validator.name).toBe('Invalid Name Check');
    expect(validator.severity).toBe('error');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  describe('node names', () => {
    it('should accept valid node names with letters, numbers, spaces, underscores', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'My Node Name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'my_node_name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'MyNodeName123', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-4', name: 'Node 123', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const results = validator.validate(state);

      expect(results).toEqual([]);
    });

    it('should reject node names starting with number', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: '123node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const results = validator.validate(state);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('error-invalid-node-name-node-1');
      expect(results[0].severity).toBe('error');
      expect(results[0].componentType).toBe('node');
      expect(results[0].message).toBe('Invalid node name "123node"');
      expect(results[0].suggestion).toBe('Use only letters, numbers, spaces, and underscores. Must start with a letter.');
    });

    it('should reject node names with special characters', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'node@name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'node-name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'node.name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-4', name: 'node$name', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const results = validator.validate(state);

      expect(results).toHaveLength(4);
      results.forEach((result) => {
        expect(result.message).toContain('Invalid node name');
      });
    });
  });

  describe('dataset names', () => {
    it('should accept valid snake_case dataset names', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my_dataset', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'raw_data_2023', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-3', name: 'processed_features', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-4', name: 'a', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const results = validator.validate(state);

      expect(results).toEqual([]);
    });

    it('should reject dataset names with uppercase letters', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'MyDataset', type: 'csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'myDataset', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const results = validator.validate(state);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.id).toMatch(/^error-invalid-dataset-name-/);
        expect(result.severity).toBe('error');
        expect(result.componentType).toBe('dataset');
        expect(result.message).toContain('Invalid dataset name');
        expect(result.suggestion).toBe('Use snake_case: lowercase letters, numbers, and underscores only (no spaces allowed).');
      });
    });

    it('should reject dataset names with spaces', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my dataset', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const results = validator.validate(state);

      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('Invalid dataset name');
    });

    it('should reject dataset names with hyphens', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my-dataset', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const results = validator.validate(state);

      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('Invalid dataset name');
    });

    it('should reject dataset names with dots', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'my.dataset', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const results = validator.validate(state);

      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('Invalid dataset name');
    });

    it('should reject dataset names starting with number', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: '2023_data', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const results = validator.validate(state);

      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('Invalid dataset name');
    });

    it('should reject dataset names starting with underscore', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: '_private_data', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const results = validator.validate(state);

      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('Invalid dataset name');
    });
  });
});

describe('MissingCodeValidator', () => {
  const validator = new MissingCodeValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('missing-code');
    expect(validator.name).toBe('Missing Code Check');
    expect(validator.severity).toBe('warning');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  it('should return empty array for nodes with code', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], functionCode: 'return data', position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should warn about nodes without functionCode', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'node_without_code', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('warning-no-code-node-1');
    expect(results[0].severity).toBe('warning');
    expect(results[0].componentId).toBe('node-1');
    expect(results[0].componentType).toBe('node');
    expect(results[0].message).toBe('Node "node_without_code" has no function code');
    expect(results[0].suggestion).toBe('Add Python code for this node or it will need to be implemented later');
  });

  it('should warn about nodes with empty code', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'node_empty_code', type: 'custom', inputs: [], outputs: [], functionCode: '', position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('has no function code');
  });

  it('should warn about nodes with whitespace-only code', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'node_whitespace', type: 'custom', inputs: [], outputs: [], functionCode: '   \n  ', position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('has no function code');
  });

  it('should detect multiple nodes without code', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'node_with_code', type: 'custom', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'node_without_code_1', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'node_without_code_2', type: 'custom', inputs: [], outputs: [], functionCode: '', position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(2);
    expect(results[0].message).toContain('node_without_code_1');
    expect(results[1].message).toContain('node_without_code_2');
  });
});

describe('MissingConfigValidator', () => {
  const validator = new MissingConfigValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('missing-config');
    expect(validator.name).toBe('Missing Config Check');
    expect(validator.severity).toBe('warning');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  it('should return empty array for fully configured datasets', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_csv', type: 'csv', filepath: 'data/my.csv', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should warn about datasets missing type', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_data', type: undefined as unknown as KedroDataset['type'], filepath: 'data.csv', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('warning-missing-config-dataset-1');
    expect(results[0].severity).toBe('warning');
    expect(results[0].componentId).toBe('dataset-1');
    expect(results[0].componentType).toBe('dataset');
    expect(results[0].message).toBe('Dataset "my_data" is missing: type');
    expect(results[0].suggestion).toBe('Configure this dataset in the config panel');
  });

  it('should warn about non-memory datasets missing filepath', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_csv', type: 'csv', filepath: '', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Dataset "my_csv" is missing: filepath');
  });

  it('should warn about non-memory datasets with whitespace-only filepath', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_parquet', type: 'parquet', filepath: '   ', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('missing: filepath');
  });

  it('should warn about datasets missing both type and filepath', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'incomplete', type: undefined as unknown as KedroDataset['type'], position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Dataset "incomplete" is missing: type, filepath');
  });

  it('should NOT warn about memory datasets missing filepath', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'temp_data', type: 'memory', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should handle memory dataset with empty filepath gracefully', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'temp_data', type: 'memory', filepath: '', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should detect multiple datasets with missing config', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'missing_type', type: undefined as unknown as KedroDataset['type'], filepath: 'data.csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'missing_filepath', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-3', name: 'complete', type: 'json', filepath: 'data.json', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(2);
  });
});

describe('OrphanedNodeValidator', () => {
  const validator = new OrphanedNodeValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('orphaned-node');
    expect(validator.name).toBe('Orphaned Node Check');
    expect(validator.severity).toBe('warning');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  it('should return empty array for connected nodes', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should warn about orphaned nodes', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'connected_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'orphaned_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('warning-orphan-node-node-2');
    expect(results[0].severity).toBe('warning');
    expect(results[0].componentId).toBe('node-2');
    expect(results[0].componentType).toBe('node');
    expect(results[0].message).toBe('Node "orphaned_node" is not connected to any datasets');
    expect(results[0].suggestion).toBe('Connect this node or remove it from the pipeline');
  });

  it('should detect multiple orphaned nodes', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'orphan_1', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'orphan_2', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      { id: 'node-3', name: 'orphan_3', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const state = createState(nodes);
    const results = validator.validate(state);

    expect(results).toHaveLength(3);
    expect(results[0].message).toContain('orphan_1');
    expect(results[1].message).toContain('orphan_2');
    expect(results[2].message).toContain('orphan_3');
  });

  it('should not warn when node is connected as input', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'dataset-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should not warn when node is connected as output', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });
});

describe('OrphanedDatasetValidator', () => {
  const validator = new OrphanedDatasetValidator();

  it('should have correct metadata', () => {
    expect(validator.id).toBe('orphaned-dataset');
    expect(validator.name).toBe('Orphaned Dataset Check');
    expect(validator.severity).toBe('warning');
  });

  it('should return empty array for valid state', () => {
    const state = createState();
    expect(validator.validate(state)).toEqual([]);
  });

  it('should return empty array for connected datasets', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'my_data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should warn about orphaned datasets', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'connected_data', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'orphaned_data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('warning-orphan-dataset-dataset-2');
    expect(results[0].severity).toBe('warning');
    expect(results[0].componentId).toBe('dataset-2');
    expect(results[0].componentType).toBe('dataset');
    expect(results[0].message).toBe('Dataset "orphaned_data" is not connected to any nodes');
    expect(results[0].suggestion).toBe('Connect this dataset or remove it from the pipeline');
  });

  it('should detect multiple orphaned datasets', () => {
    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'orphan_1', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'orphan_2', type: 'csv', position: { x: 0, y: 0 } },
      { id: 'dataset-3', name: 'orphan_3', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const state = createState([], datasets);
    const results = validator.validate(state);

    expect(results).toHaveLength(3);
    expect(results[0].message).toContain('orphan_1');
    expect(results[1].message).toContain('orphan_2');
    expect(results[2].message).toContain('orphan_3');
  });

  it('should not warn when dataset is connected as input to node', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'dataset-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });

  it('should not warn when dataset is connected as output from node', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'my_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const state = createState(nodes, datasets, connections);
    const results = validator.validate(state);

    expect(results).toEqual([]);
  });
});

describe('Factory functions', () => {
  describe('createDefaultValidatorRegistry', () => {
    it('should create a registry with all default validators', () => {
      const registry = createDefaultValidatorRegistry();

      expect(registry.getAll()).toHaveLength(8);
      expect(registry.get('circular-dependency')).toBeInstanceOf(CircularDependencyValidator);
      expect(registry.get('duplicate-name')).toBeInstanceOf(DuplicateNameValidator);
      expect(registry.get('invalid-name')).toBeInstanceOf(InvalidNameValidator);
      expect(registry.get('empty-name')).toBeInstanceOf(EmptyNameValidator);
      expect(registry.get('orphaned-node')).toBeInstanceOf(OrphanedNodeValidator);
      expect(registry.get('orphaned-dataset')).toBeInstanceOf(OrphanedDatasetValidator);
      expect(registry.get('missing-code')).toBeInstanceOf(MissingCodeValidator);
      expect(registry.get('missing-config')).toBeInstanceOf(MissingConfigValidator);
    });

    it('should have 4 error validators', () => {
      const registry = createDefaultValidatorRegistry();
      const errorValidators = registry.getBySeverity('error');

      expect(errorValidators).toHaveLength(4);
      expect(errorValidators.map((v) => v.id)).toEqual(
        expect.arrayContaining(['circular-dependency', 'duplicate-name', 'invalid-name', 'empty-name'])
      );
    });

    it('should have 4 warning validators', () => {
      const registry = createDefaultValidatorRegistry();
      const warningValidators = registry.getBySeverity('warning');

      expect(warningValidators).toHaveLength(4);
      expect(warningValidators.map((v) => v.id)).toEqual(
        expect.arrayContaining(['orphaned-node', 'orphaned-dataset', 'missing-code', 'missing-config'])
      );
    });

    it('should create new registry instances', () => {
      const registry1 = createDefaultValidatorRegistry();
      const registry2 = createDefaultValidatorRegistry();

      expect(registry1).not.toBe(registry2);
    });
  });

  describe('getDefaultValidatorRegistry', () => {
    it('should return a singleton registry', () => {
      const registry1 = getDefaultValidatorRegistry();
      const registry2 = getDefaultValidatorRegistry();

      expect(registry1).toBe(registry2);
    });

    it('should have all default validators', () => {
      const registry = getDefaultValidatorRegistry();

      expect(registry.getAll()).toHaveLength(8);
    });

    it('should be functional across multiple calls', () => {
      const registry = getDefaultValidatorRegistry();

      const nodes: KedroNode[] = [
        { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);

      const results1 = registry.validateAll(state);
      const results2 = registry.validateAll(state);

      expect(results1).toHaveLength(results2.length);
    });
  });
});

describe('Integration tests', () => {
  it('should validate complex pipeline with multiple issues', () => {
    const registry = createDefaultValidatorRegistry();

    const nodes: KedroNode[] = [
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Empty name error
      { id: 'node-2', name: '123invalid', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Invalid name error
      { id: 'node-3', name: 'duplicate', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Duplicate error
      { id: 'node-4', name: 'duplicate', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Duplicate error
      { id: 'node-5', name: 'orphaned', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Orphaned warning + missing code warning
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'Invalid Name', type: 'csv', position: { x: 0, y: 0 } }, // Invalid name error
      { id: 'dataset-2', name: 'orphan_data', type: undefined as unknown as KedroDataset['type'], position: { x: 0, y: 0 } }, // Missing config warning + orphaned warning
    ];

    const state = createState(nodes, datasets);
    const allResults = registry.validateAll(state);

    const errors = allResults.filter((r) => r.severity === 'error');
    const warnings = allResults.filter((r) => r.severity === 'warning');

    expect(errors.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should validate empty pipeline without errors', () => {
    const registry = createDefaultValidatorRegistry();
    const state = createState();

    const results = registry.validateAll(state);

    expect(results).toEqual([]);
  });

  it('should validate perfect pipeline without errors or warnings', () => {
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

    const state = createState(nodes, datasets, connections);
    const results = registry.validateAll(state);

    expect(results).toEqual([]);
  });

  it('should separate error and warning validation correctly', () => {
    const registry = createDefaultValidatorRegistry();

    const nodes: KedroNode[] = [
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Error
      { id: 'node-2', name: 'orphaned', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } }, // Warning
    ];

    const state = createState(nodes);

    const errors = registry.validateErrors(state);
    const warnings = registry.validateWarnings(state);

    expect(errors.every((e) => e.severity === 'error')).toBe(true);
    expect(warnings.every((w) => w.severity === 'warning')).toBe(true);
    expect(errors.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
