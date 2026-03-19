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
  wouldCreateCycle,
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
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-2']));
      expect(graph.get('node-2')).toEqual(new Set());
    });

    it('should build multiple downstream dependencies (fan-out)', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'dataset-1', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-2', 'node-3']));
    });

    it('should handle complex linear pipeline (A -> B -> C)', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-4', source: 'dataset-2', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-2']));
      expect(graph.get('node-2')).toEqual(new Set(['node-3']));
      expect(graph.get('node-3')).toEqual(new Set());
    });

    it('should handle multiple inputs from different producers (fan-in)', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3'];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'node-2', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'dataset-1', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);

      expect(graph.get('node-1')).toEqual(new Set(['node-3']));
      expect(graph.get('node-2')).toEqual(new Set(['node-3']));
    });

    it('should ignore dataset-only connections', () => {
      const nodeIds = ['node-1'];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'dataset-1', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);
      expect(graph.get('node-1')).toEqual(new Set());
    });
  });

  describe('detectCycles', () => {
    it('should return empty array for empty graph', () => {
      const graph = new Map<string, Set<string>>();
      expect(detectCycles(graph)).toHaveLength(0);
    });

    it('should return empty array for acyclic graph', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2'])],
        ['node-2', new Set(['node-3'])],
        ['node-3', new Set()],
      ]);
      expect(detectCycles(graph)).toHaveLength(0);
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
      // Cycle path should loop back to start
      const cyclePath = cycles[0].cyclePath;
      expect(cyclePath[0]).toBe(cyclePath[cyclePath.length - 1]);
    });

    it('should not detect cycles in DAG with diamond pattern', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2', 'node-3'])],
        ['node-2', new Set(['node-4'])],
        ['node-3', new Set(['node-4'])],
        ['node-4', new Set()],
      ]);
      expect(detectCycles(graph)).toHaveLength(0);
    });

    it('should detect cycle in graph with non-cyclic branches', () => {
      const graph = new Map<string, Set<string>>([
        ['node-1', new Set(['node-2', 'node-5'])],
        ['node-2', new Set(['node-3'])],
        ['node-3', new Set(['node-4'])],
        ['node-4', new Set(['node-2'])], // Cycle
        ['node-5', new Set(['node-6'])], // Non-cyclic branch
        ['node-6', new Set()],
      ]);

      const cycles = detectCycles(graph);
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].hasCycle).toBe(true);
    });
  });

  describe('wouldCreateCycle', () => {
    it('returns false for empty graph', () => {
      expect(wouldCreateCycle('node-1', 'dataset-1', [], [])).toBe(false);
    });

    it('returns false when new connection does not create a cycle', () => {
      // node-1 → dataset-1 → node-2 already exists; extending node-2 → dataset-2 is fine
      const existing: KedroConnection[] = [
        { id: 'c1', source: 'node-1', target: 'dataset-1', sourceHandle: '', targetHandle: '' },
        { id: 'c2', source: 'dataset-1', target: 'node-2', sourceHandle: '', targetHandle: '' },
      ];
      expect(wouldCreateCycle('node-2', 'dataset-2', existing, ['node-1', 'node-2'])).toBe(false);
    });

    it('returns true when new connection closes a cycle', () => {
      // node-1 → dataset-1 → node-2 → dataset-2 exists
      // adding dataset-2 → node-1 closes the loop: node-1 → node-2 → node-1
      const existing: KedroConnection[] = [
        { id: 'c1', source: 'node-1', target: 'dataset-1', sourceHandle: '', targetHandle: '' },
        { id: 'c2', source: 'dataset-1', target: 'node-2', sourceHandle: '', targetHandle: '' },
        { id: 'c3', source: 'node-2', target: 'dataset-2', sourceHandle: '', targetHandle: '' },
      ];
      expect(wouldCreateCycle('dataset-2', 'node-1', existing, ['node-1', 'node-2'])).toBe(true);
    });
  });

  describe('getConnectedNodes', () => {
    it('should return empty set for no connections', () => {
      expect(getConnectedNodes([]).size).toBe(0);
    });

    it('should find nodes as both sources and targets', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const connected = getConnectedNodes(connections);
      expect(connected).toEqual(new Set(['node-1', 'node-2']));
    });

    it('should not include datasets', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'dataset-1', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      ];
      expect(getConnectedNodes(connections).size).toBe(0);
    });
  });

  describe('getConnectedDatasets', () => {
    it('should return empty set for no connections', () => {
      expect(getConnectedDatasets([]).size).toBe(0);
    });

    it('should find datasets as both sources and targets', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const connected = getConnectedDatasets(connections);
      expect(connected).toEqual(new Set(['dataset-1', 'dataset-2']));
    });

    it('should not include nodes', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      ];
      expect(getConnectedDatasets(connections).size).toBe(0);
    });
  });

  describe('findOrphanedNodes', () => {
    it('should return all nodes when no connections', () => {
      expect(findOrphanedNodes(['node-1', 'node-2'], [])).toEqual(['node-1', 'node-2']);
    });

    it('should return empty array when all nodes are connected', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      ];
      expect(findOrphanedNodes(['node-1', 'node-2'], connections)).toEqual([]);
    });

    it('should identify orphaned nodes in mixed graph', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      ];
      expect(findOrphanedNodes(['node-1', 'node-2', 'node-3'], connections)).toEqual(['node-2', 'node-3']);
    });
  });

  describe('findOrphanedDatasets', () => {
    it('should return all datasets when no connections', () => {
      expect(findOrphanedDatasets(['dataset-1', 'dataset-2'], [])).toEqual(['dataset-1', 'dataset-2']);
    });

    it('should return empty array when all datasets are connected', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-2', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      ];
      expect(findOrphanedDatasets(['dataset-1', 'dataset-2'], connections)).toEqual([]);
    });

    it('should identify orphaned datasets in mixed graph', () => {
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      ];
      expect(findOrphanedDatasets(['dataset-1', 'dataset-2', 'dataset-3'], connections)).toEqual(['dataset-2', 'dataset-3']);
    });
  });

  describe('integration', () => {
    it('should correctly analyze realistic ML pipeline', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3', 'node-4'];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-4', source: 'dataset-2', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-5', source: 'node-3', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-6', source: 'dataset-3', target: 'node-4', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);
      expect(graph.get('node-1')).toEqual(new Set(['node-2']));
      expect(graph.get('node-2')).toEqual(new Set(['node-3']));
      expect(graph.get('node-3')).toEqual(new Set(['node-4']));

      expect(detectCycles(graph)).toHaveLength(0);
      expect(findOrphanedNodes(nodeIds, connections)).toEqual([]);
      expect(findOrphanedDatasets(['dataset-1', 'dataset-2', 'dataset-3'], connections)).toEqual([]);
    });

    it('should detect all issues in broken pipeline', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3', 'node-orphan'];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-4', source: 'dataset-2', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' }, // cycle
        { id: 'conn-5', source: 'node-3', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const graph = buildDependencyGraph(nodeIds, connections);
      const cycles = detectCycles(graph);
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].hasCycle).toBe(true);

      expect(findOrphanedNodes(nodeIds, connections)).toEqual(['node-orphan']);
      expect(findOrphanedDatasets(['dataset-1', 'dataset-2', 'dataset-3', 'dataset-orphan'], connections)).toEqual(['dataset-orphan']);
    });
  });
});
