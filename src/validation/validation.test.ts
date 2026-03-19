/**
 * @vitest-environment node
 *
 * Public API smoke tests for validatePipeline().
 *
 * Individual validator behavior (circular deps, duplicates, empty names,
 * invalid names, orphans, missing code/config) is exhaustively tested in:
 *   src/validation/validators/validators.test.ts
 *
 * This file only verifies that the public entry-point wires everything
 * together correctly: return shape, error/warning separation, and perf.
 */
import { describe, it, expect } from 'vitest';
import { validatePipeline } from '.';
import type { KedroNode, KedroDataset, KedroConnection } from '@/types/kedro';
import { createTestState } from '@/test/utils/mockStore';

describe('validatePipeline (public API)', () => {
  it('should return valid result for empty pipeline', () => {
    const result = validatePipeline(createTestState());

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should return valid for a realistic ML pipeline with no issues', () => {
    const nodes: KedroNode[] = [
      { id: 'node-1', name: 'load_data', type: 'data_ingestion', inputs: [], outputs: [], functionCode: 'pass', position: { x: 0, y: 0 } },
      { id: 'node-2', name: 'clean_data', type: 'data_processing', inputs: [], outputs: [], functionCode: 'pass', position: { x: 100, y: 0 } },
      { id: 'node-3', name: 'train_model', type: 'model_training', inputs: [], outputs: [], functionCode: 'pass', position: { x: 200, y: 0 } },
    ];

    const datasets: KedroDataset[] = [
      { id: 'dataset-1', name: 'raw_data', type: 'csv', filepath: 'data/01_raw/raw.csv', position: { x: 0, y: 0 } },
      { id: 'dataset-2', name: 'cleaned_data', type: 'parquet', filepath: 'data/02_intermediate/clean.parquet', position: { x: 0, y: 0 } },
      { id: 'dataset-3', name: 'model_artifact', type: 'pickle', filepath: 'data/06_models/model.pkl', position: { x: 0, y: 0 } },
    ];

    const connections: KedroConnection[] = [
      { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
      { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      { id: '4', source: 'dataset-2', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
      { id: '5', source: 'node-3', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
    ];

    const result = validatePipeline(createTestState(nodes, datasets, connections));

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should separate errors from warnings and set isValid correctly', () => {
    const nodes: KedroNode[] = [
      // Error: empty name → EmptyNameValidator
      { id: 'node-1', name: '', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      // Warning: orphaned + missing code → OrphanedNodeValidator, MissingCodeValidator
      { id: 'node-2', name: 'orphaned_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
    ];

    const result = validatePipeline(createTestState(nodes));

    // Errors present → isValid must be false
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);

    // Severity is correctly bucketed
    result.errors.forEach((e) => expect(e.severity).toBe('error'));
    result.warnings.forEach((w) => expect(w.severity).toBe('warning'));
  });

  it('should handle large pipeline (100 nodes + 100 datasets) under 1s', () => {
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

    const start = Date.now();
    const result = validatePipeline(createTestState(nodes, datasets));
    const duration = Date.now() - start;

    expect(result).toBeDefined();
    expect(duration).toBeLessThan(1000);
  });
});
