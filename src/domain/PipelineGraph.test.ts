/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  detectCycles,
  findOrphanedNodes,
  findOrphanedDatasets,
  getConnectedNodes,
  getConnectedDatasets,
} from './PipelineGraph';
import type { KedroConnection } from '../types/kedro';

describe('PipelineGraph', () => {
  describe('buildDependencyGraph', () => {
    it('should return empty graph for no nodes', () => {
      const graph = buildDependencyGraph([], []);

      expect(graph.size).toBe(0);
    });

    it('should initialize graph with all nodes even without connections', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const graph = buildDependencyGraph(nodeIds, []);

      expect(graph.size).toBe(3);
      expect(graph.get('node-1')).toEqual(new Set());
      expect(graph.get('node-2')).toEqual(new Set());
      expect(graph.get('node-3')).toEqual(new Set());
    });

    it('should build node-to-node dependencies through datasets', () => {
      const nodeIds = ['node-1', 'node-2'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-2']));
      expect(graph.get('node-2')).toEqual(new Set());
    });

    it('should build multiple downstream dependencies', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        // node-1 produces dataset-1
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // dataset-1 feeds into node-2 and node-3
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-3',
          source: 'dataset-1',
          target: 'node-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-2', 'node-3']));
      expect(graph.get('node-2')).toEqual(new Set());
      expect(graph.get('node-3')).toEqual(new Set());
    });

    it('should handle complex linear pipeline', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        // node-1 -> dataset-1 -> node-2
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // node-2 -> dataset-2 -> node-3
        {
          id: 'conn-3',
          source: 'node-2',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-4',
          source: 'dataset-2',
          target: 'node-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-2']));
      expect(graph.get('node-2')).toEqual(new Set(['node-3']));
      expect(graph.get('node-3')).toEqual(new Set());
    });

    it('should handle nodes with multiple inputs from different datasets', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        // node-1 -> dataset-1
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // node-2 -> dataset-2
        {
          id: 'conn-2',
          source: 'node-2',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // Both datasets feed into node-3
        {
          id: 'conn-3',
          source: 'dataset-1',
          target: 'node-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-4',
          source: 'dataset-2',
          target: 'node-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-3']));
      expect(graph.get('node-2')).toEqual(new Set(['node-3']));
      expect(graph.get('node-3')).toEqual(new Set());
    });

    it('should handle dataset with multiple producers (fan-in)', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        // Multiple nodes write to same dataset
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'node-2',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // Dataset consumed by node-3
        {
          id: 'conn-3',
          source: 'dataset-1',
          target: 'node-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      // Both producers should have edge to consumer
      expect(graph.get('node-1')).toEqual(new Set(['node-3']));
      expect(graph.get('node-2')).toEqual(new Set(['node-3']));
      expect(graph.get('node-3')).toEqual(new Set());
    });

    it('should ignore dataset-only connections', () => {
      const nodeIds = ['node-1'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'dataset-1',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set());
    });

    it('should handle empty connections array', () => {
      const nodeIds = ['node-1', 'node-2'];
      const graph = buildDependencyGraph(nodeIds, []);

      expect(graph.size).toBe(2);
      expect(graph.get('node-1')).toEqual(new Set());
      expect(graph.get('node-2')).toEqual(new Set());
    });
  });

  describe('detectCycles', () => {
    it('should return empty array for graph with no cycles', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2'])],
        ['node-2', new Set(['node-3'])],
        ['node-3', new Set()],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should detect simple two-node cycle', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2'])],
        ['node-2', new Set(['node-1'])],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].hasCycle).toBe(true);
      expect(cycles[0].cyclePath).toContain('node-1');
      expect(cycles[0].cyclePath).toContain('node-2');
    });

    it('should detect self-referencing cycle', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-1'])],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].hasCycle).toBe(true);
      expect(cycles[0].cyclePath).toContain('node-1');
    });

    it('should detect three-node cycle', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2'])],
        ['node-2', new Set(['node-3'])],
        ['node-3', new Set(['node-1'])],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].hasCycle).toBe(true);
      expect(cycles[0].cyclePath).toContain('node-1');
      expect(cycles[0].cyclePath).toContain('node-2');
      expect(cycles[0].cyclePath).toContain('node-3');
    });

    it('should detect multiple separate cycles', () => {
      const graph = new Map<string, Set<string>>([
        // First cycle: node-1 <-> node-2
        ['node-1', new Set(['node-2'])],
        ['node-2', new Set(['node-1'])],
        // Second cycle: node-3 <-> node-4
        ['node-3', new Set(['node-4'])],
        ['node-4', new Set(['node-3'])],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles.length).toBeGreaterThanOrEqual(1);
      expect(cycles.every((c) => c.hasCycle)).toBe(true);
    });

    it('should not detect cycles in linear graph', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2', 'node-3'])],
        ['node-2', new Set(['node-4'])],
        ['node-3', new Set(['node-4'])],
        ['node-4', new Set()],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should not detect cycles in DAG with diamond pattern', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2', 'node-3'])],
        ['node-2', new Set(['node-4'])],
        ['node-3', new Set(['node-4'])],
        ['node-4', new Set()],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should handle empty graph', () => {
      const graph = new Map<string, Set<string>>();

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should handle single node with no edges', () => {
      const graph = new Map<string, Set<string>>([['node-1', new Set()]]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should detect cycle in complex graph with non-cyclic branches', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2', 'node-5'])], // Branches
        ['node-2', new Set(['node-3'])],
        ['node-3', new Set(['node-4'])],
        ['node-4', new Set(['node-2'])], // Cycle: node-2 -> node-3 -> node-4 -> node-2
        ['node-5', new Set(['node-6'])], // Non-cyclic branch
        ['node-6', new Set()],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].hasCycle).toBe(true);
    });

    it('should complete cycle path back to start node', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2'])],
        ['node-2', new Set(['node-3'])],
        ['node-3', new Set(['node-1'])],
      ]);

      const cycles = detectCycles(graph);

      expect(cycles).toHaveLength(1);
      const cyclePath = cycles[0].cyclePath;
      // First and last nodes should be the same (or last should complete the cycle)
      expect(cyclePath[0]).toBe(cyclePath[cyclePath.length - 1]);
    });
  });

  describe('getConnectedNodes', () => {
    it('should return empty set for no connections', () => {
      const connected = getConnectedNodes([]);

      expect(connected.size).toBe(0);
    });

    it('should find nodes as sources', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedNodes(connections);

      expect(connected).toEqual(new Set(['node-1']));
    });

    it('should find nodes as targets', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'dataset-1',
          target: 'node-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedNodes(connections);

      expect(connected).toEqual(new Set(['node-1']));
    });

    it('should find all nodes in complex connections', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-3',
          source: 'node-2',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedNodes(connections);

      expect(connected).toEqual(new Set(['node-1', 'node-2']));
    });

    it('should not include datasets', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'dataset-1',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedNodes(connections);

      expect(connected.size).toBe(0);
    });

    it('should deduplicate node IDs', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'node-1',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedNodes(connections);

      expect(connected).toEqual(new Set(['node-1']));
      expect(connected.size).toBe(1);
    });
  });

  describe('getConnectedDatasets', () => {
    it('should return empty set for no connections', () => {
      const connected = getConnectedDatasets([]);

      expect(connected.size).toBe(0);
    });

    it('should find datasets as sources', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'dataset-1',
          target: 'node-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedDatasets(connections);

      expect(connected).toEqual(new Set(['dataset-1']));
    });

    it('should find datasets as targets', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedDatasets(connections);

      expect(connected).toEqual(new Set(['dataset-1']));
    });

    it('should find all datasets in complex connections', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-3',
          source: 'node-2',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedDatasets(connections);

      expect(connected).toEqual(new Set(['dataset-1', 'dataset-2']));
    });

    it('should not include nodes', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedDatasets(connections);

      expect(connected.size).toBe(0);
    });

    it('should deduplicate dataset IDs', () => {
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const connected = getConnectedDatasets(connections);

      expect(connected).toEqual(new Set(['dataset-1']));
      expect(connected.size).toBe(1);
    });
  });

  describe('findOrphanedNodes', () => {
    it('should return all nodes when no connections', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const orphaned = findOrphanedNodes(nodeIds, []);

      expect(orphaned).toEqual(['node-1', 'node-2', 'node-3']);
    });

    it('should return empty array when all nodes are connected', () => {
      const nodeIds = ['node-1', 'node-2'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const orphaned = findOrphanedNodes(nodeIds, connections);

      expect(orphaned).toEqual([]);
    });

    it('should identify orphaned nodes in mixed graph', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // node-3 has no connections
      ];

      const orphaned = findOrphanedNodes(nodeIds, connections);

      expect(orphaned).toEqual(['node-3']);
    });

    it('should consider node connected if it is a source', () => {
      const nodeIds = ['node-1'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const orphaned = findOrphanedNodes(nodeIds, connections);

      expect(orphaned).toEqual([]);
    });

    it('should consider node connected if it is a target', () => {
      const nodeIds = ['node-1'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'dataset-1',
          target: 'node-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const orphaned = findOrphanedNodes(nodeIds, connections);

      expect(orphaned).toEqual([]);
    });

    it('should handle empty node list', () => {
      const orphaned = findOrphanedNodes([], []);

      expect(orphaned).toEqual([]);
    });
  });

  describe('findOrphanedDatasets', () => {
    it('should return all datasets when no connections', () => {
      const datasetIds = ['dataset-1', 'dataset-2', 'dataset-3'];
      const orphaned = findOrphanedDatasets(datasetIds, []);

      expect(orphaned).toEqual(['dataset-1', 'dataset-2', 'dataset-3']);
    });

    it('should return empty array when all datasets are connected', () => {
      const datasetIds = ['dataset-1', 'dataset-2'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-2',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const orphaned = findOrphanedDatasets(datasetIds, connections);

      expect(orphaned).toEqual([]);
    });

    it('should identify orphaned datasets in mixed graph', () => {
      const datasetIds = ['dataset-1', 'dataset-2', 'dataset-3'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-2',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // dataset-3 has no connections
      ];

      const orphaned = findOrphanedDatasets(datasetIds, connections);

      expect(orphaned).toEqual(['dataset-3']);
    });

    it('should consider dataset connected if it is a source', () => {
      const datasetIds = ['dataset-1'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'dataset-1',
          target: 'node-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const orphaned = findOrphanedDatasets(datasetIds, connections);

      expect(orphaned).toEqual([]);
    });

    it('should consider dataset connected if it is a target', () => {
      const datasetIds = ['dataset-1'];
      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const orphaned = findOrphanedDatasets(datasetIds, connections);

      expect(orphaned).toEqual([]);
    });

    it('should handle empty dataset list', () => {
      const orphaned = findOrphanedDatasets([], []);

      expect(orphaned).toEqual([]);
    });
  });

  describe('integration tests', () => {
    it('should correctly analyze realistic ML pipeline', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3', 'node-4'];
      const connections: KedroConnection[] = [
        // node-1 (load) -> dataset-1 (raw)
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // dataset-1 -> node-2 (clean)
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // node-2 -> dataset-2 (clean)
        {
          id: 'conn-3',
          source: 'node-2',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // dataset-2 -> node-3 (train)
        {
          id: 'conn-4',
          source: 'dataset-2',
          target: 'node-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // node-3 -> dataset-3 (model)
        {
          id: 'conn-5',
          source: 'node-3',
          target: 'dataset-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // dataset-3 -> node-4 (evaluate)
        {
          id: 'conn-6',
          source: 'dataset-3',
          target: 'node-4',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      // Build dependency graph
      const graph = buildDependencyGraph(nodeIds, connections);
      expect(graph.get('node-1')).toEqual(new Set(['node-2']));
      expect(graph.get('node-2')).toEqual(new Set(['node-3']));
      expect(graph.get('node-3')).toEqual(new Set(['node-4']));
      expect(graph.get('node-4')).toEqual(new Set());

      // Check for cycles
      const cycles = detectCycles(graph);
      expect(cycles).toHaveLength(0);

      // Check for orphans
      const orphanedNodes = findOrphanedNodes(nodeIds, connections);
      expect(orphanedNodes).toEqual([]);

      const datasetIds = ['dataset-1', 'dataset-2', 'dataset-3'];
      const orphanedDatasets = findOrphanedDatasets(datasetIds, connections);
      expect(orphanedDatasets).toEqual([]);
    });

    it('should detect all issues in broken pipeline', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3', 'node-orphan'];
      const connections: KedroConnection[] = [
        // Create a cycle: node-1 -> dataset-1 -> node-2 -> dataset-2 -> node-1
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-2',
          source: 'dataset-1',
          target: 'node-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-3',
          source: 'node-2',
          target: 'dataset-2',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-4',
          source: 'dataset-2',
          target: 'node-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // node-3 connected but separate
        {
          id: 'conn-5',
          source: 'node-3',
          target: 'dataset-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        // node-orphan has no connections
        // dataset-orphan has no connections
      ];

      // Check cycles
      const graph = buildDependencyGraph(nodeIds, connections);
      const cycles = detectCycles(graph);
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].hasCycle).toBe(true);

      // Check orphaned nodes
      const orphanedNodes = findOrphanedNodes(nodeIds, connections);
      expect(orphanedNodes).toEqual(['node-orphan']);

      // Check orphaned datasets
      const datasetIds = ['dataset-1', 'dataset-2', 'dataset-3', 'dataset-orphan'];
      const orphanedDatasets = findOrphanedDatasets(datasetIds, connections);
      expect(orphanedDatasets).toEqual(['dataset-orphan']);
    });
  });
});
