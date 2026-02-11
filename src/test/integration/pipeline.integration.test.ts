/**
 * Integration tests: Core pipeline workflows
 *
 * These test the full flow through Redux store → generators/validators,
 * verifying that pieces work correctly together.
 */
import { describe, it, expect } from 'vitest';
import { createMockStore } from '../utils/mockStore';
import { addNode } from '../../features/nodes/nodesSlice';
import { addDataset } from '../../features/datasets/datasetsSlice';
import { addConnection } from '../../features/connections/connectionsSlice';
import { generatePipeline } from '../../infrastructure/export/pipelineGenerator';
import { generateCatalog } from '../../infrastructure/export/catalogGenerator';
import { generateNodes } from '../../infrastructure/export/nodesGenerator';
import { validatePipeline } from '../../utils/validation/pipelineValidation';
import type { RootState } from '../../types/redux';

describe('Pipeline: create → connect → export', () => {
  it('generates correct pipeline.py, catalog.yml, and nodes.py from store state', () => {
    const store = createMockStore();

    // 1. Create a node
    store.dispatch(
      addNode({
        id: 'node-1',
        name: 'preprocess',
        type: 'data_processing',
        inputs: ['raw_data'],
        outputs: ['processed_data'],
        functionCode: 'def preprocess(raw_data):\n    return raw_data.dropna()',
        position: { x: 100, y: 100 },
      })
    );

    // 2. Create input and output datasets (IDs must start with 'dataset-' for generator matching)
    store.dispatch(
      addDataset({
        id: 'dataset-1',
        name: 'raw_data',
        type: 'csv',
        filepath: 'data/01_raw/raw_data.csv',
        layer: '01_raw',
        position: { x: 0, y: 100 },
      })
    );
    store.dispatch(
      addDataset({
        id: 'dataset-2',
        name: 'processed_data',
        type: 'parquet',
        filepath: 'data/02_intermediate/processed_data.parquet',
        layer: '02_intermediate',
        position: { x: 200, y: 100 },
      })
    );

    // 3. Connect: dataset → node → dataset
    store.dispatch(
      addConnection({
        id: 'conn-1',
        source: 'dataset-1',
        target: 'node-1',
        sourceHandle: 'output',
        targetHandle: 'input',
      })
    );
    store.dispatch(
      addConnection({
        id: 'conn-2',
        source: 'node-1',
        target: 'dataset-2',
        sourceHandle: 'output',
        targetHandle: 'input',
      })
    );

    // 4. Get state and generate files
    const state = store.getState() as RootState;

    const pipelineCode = generatePipeline(
      Object.values(state.nodes.byId),
      Object.values(state.connections.byId),
      state.datasets.byId,
      'default'
    );
    const catalogYml = generateCatalog(Object.values(state.datasets.byId));
    const nodesCode = generateNodes(
      Object.values(state.nodes.byId),
      Object.values(state.connections.byId),
      state.datasets.byId,
      'default'
    );

    // 5. Verify pipeline.py uses correct Kedro API
    expect(pipelineCode).toContain('from kedro.pipeline import node, Pipeline');
    expect(pipelineCode).toContain('node(');
    expect(pipelineCode).toContain('name="preprocess_node"');
    expect(pipelineCode).toContain('raw_data');
    expect(pipelineCode).toContain('processed_data');

    // 6. Verify catalog.yml has both datasets with correct types
    expect(catalogYml).toContain('raw_data:');
    expect(catalogYml).toContain('pandas.CSVDataset');
    expect(catalogYml).toContain('processed_data:');
    expect(catalogYml).toContain('pandas.ParquetDataset');

    // 7. Verify nodes.py has the function
    expect(nodesCode).toContain('def preprocess(');
    expect(nodesCode).toContain('raw_data.dropna()');
  });
});

describe('Pipeline: create → validate', () => {
  it('detects errors for invalid pipeline and passes for valid one', () => {
    const store = createMockStore();

    // Create node with empty name (validation error)
    store.dispatch(
      addNode({
        id: 'node-1',
        name: '',
        type: 'data_processing',
        inputs: [],
        outputs: [],
        position: { x: 0, y: 0 },
      })
    );

    // Validate - should have errors (empty name)
    let result = validatePipeline(store.getState() as RootState);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Fix: give it a proper name and code
    store.dispatch(
      addNode({
        id: 'node-2',
        name: 'clean_data',
        type: 'data_processing',
        inputs: ['input_data'],
        outputs: ['output_data'],
        functionCode: 'def clean_data(input_data):\n    return input_data',
        position: { x: 100, y: 100 },
      })
    );

    // Add connected datasets
    store.dispatch(
      addDataset({
        id: 'ds-1',
        name: 'input_data',
        type: 'csv',
        filepath: 'data/01_raw/input.csv',
        position: { x: 0, y: 100 },
      })
    );
    store.dispatch(
      addDataset({
        id: 'ds-2',
        name: 'output_data',
        type: 'csv',
        filepath: 'data/02_intermediate/output.csv',
        position: { x: 200, y: 100 },
      })
    );

    store.dispatch(
      addConnection({
        id: 'conn-1',
        source: 'ds-1',
        target: 'node-2',
        sourceHandle: 'output',
        targetHandle: 'input',
      })
    );
    store.dispatch(
      addConnection({
        id: 'conn-2',
        source: 'node-2',
        target: 'ds-2',
        sourceHandle: 'output',
        targetHandle: 'input',
      })
    );

    // Validate again - node-1 still has errors, but node-2's pipeline is valid
    result = validatePipeline(store.getState() as RootState);
    // Still invalid because node-1 has empty name
    expect(result.errors.some((e) => e.componentId === 'node-1')).toBe(true);
    // But node-2 should not have errors
    expect(result.errors.some((e) => e.componentId === 'node-2')).toBe(false);
  });
});
