/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { generatePipeline } from './pipelineGenerator';
import type { KedroNode, KedroDataset, KedroConnection } from '../../types/kedro';

describe('pipelineGenerator', () => {
  describe('generatePipeline', () => {
    it('should generate empty pipeline with no nodes', () => {
      const result = generatePipeline([], [], {}, 'test_pipeline');

      expect(result).toContain('Pipeline definition for test_pipeline pipeline');
      expect(result).toContain('from kedro.pipeline import node, Pipeline');
      expect(result).not.toContain('from .nodes import');
      expect(result).toContain('def create_pipeline(**kwargs) -> Pipeline:');
      expect(result).toContain('return Pipeline(');
    });

    it('should generate pipeline with single node', () => {
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

      const datasets = {
        'dataset-1': { id: 'dataset-1', name: 'raw_data', type: 'csv', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-2': { id: 'dataset-2', name: 'processed_data', type: 'parquet', position: { x: 0, y: 0 } } as KedroDataset,
      };

      const connections: KedroConnection[] = [
        { id: '1', source: 'dataset-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'node-1', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const result = generatePipeline(nodes, connections, datasets, 'test');

      expect(result).toContain('from .nodes import process_data');
      expect(result).toContain('node(');
      expect(result).toContain('func=process_data');
      expect(result).toContain('inputs="raw_data"');
      expect(result).toContain('outputs="processed_data"');
    });

    it('should generate pipeline with multiple nodes', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'load_data', type: 'data_ingestion', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'process_data', type: 'data_processing', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets = {
        'dataset-1': { id: 'dataset-1', name: 'raw', type: 'csv', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-2': { id: 'dataset-2', name: 'processed', type: 'parquet', position: { x: 0, y: 0 } } as KedroDataset,
      };

      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const result = generatePipeline(nodes, connections, datasets, 'test');

      expect(result).toContain('from .nodes import load_data, process_data');
      expect(result).toContain('func=load_data');
      expect(result).toContain('func=process_data');
    });

    it('should handle node with no inputs (source node)', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'source_node', type: 'data_ingestion', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets = {
        'dataset-1': { id: 'dataset-1', name: 'output', type: 'csv', position: { x: 0, y: 0 } } as KedroDataset,
      };

      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const result = generatePipeline(nodes, connections, datasets, 'test');

      expect(result).toContain('inputs=None');
      expect(result).toContain('outputs="output"');
    });

    it('should handle node with no outputs (sink node)', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'sink_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets = {
        'dataset-1': { id: 'dataset-1', name: 'input', type: 'csv', position: { x: 0, y: 0 } } as KedroDataset,
      };

      const connections: KedroConnection[] = [
        { id: '1', source: 'dataset-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const result = generatePipeline(nodes, connections, datasets, 'test');

      expect(result).toContain('inputs="input"');
      expect(result).toContain('outputs=None');
    });

    it('should handle node with multiple inputs and outputs', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'merge_data', type: 'data_processing', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets = {
        'dataset-1': { id: 'dataset-1', name: 'data1', type: 'csv', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-2': { id: 'dataset-2', name: 'data2', type: 'csv', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-3': { id: 'dataset-3', name: 'merged', type: 'parquet', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-4': { id: 'dataset-4', name: 'stats', type: 'json', position: { x: 0, y: 0 } } as KedroDataset,
      };

      const connections: KedroConnection[] = [
        { id: '1', source: 'dataset-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-2', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '3', source: 'node-1', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: '4', source: 'node-1', target: 'dataset-4', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const result = generatePipeline(nodes, connections, datasets, 'test');

      expect(result).toContain('inputs=["data1", "data2"]');
      expect(result).toContain('outputs=["merged", "stats"]');
    });

    it('should convert node names to snake_case', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'ProcessSalesData', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const result = generatePipeline(nodes, [], {}, 'test');

      expect(result).toContain('from .nodes import process_sales_data');
      expect(result).toContain('func=process_sales_data');
    });

    it('should include pipeline name in docstring', () => {
      const result = generatePipeline([], [], {}, 'my_ml_pipeline');

      expect(result).toContain('Pipeline definition for my_ml_pipeline pipeline');
      expect(result).toContain('Create the my_ml_pipeline pipeline');
    });

    it('should handle realistic ML pipeline', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'load_data', type: 'data_ingestion', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'clean_data', type: 'data_processing', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-3', name: 'train_model', type: 'model_training', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-4', name: 'evaluate_model', type: 'model_evaluation', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const datasets = {
        'dataset-1': { id: 'dataset-1', name: 'raw_data', type: 'csv', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-2': { id: 'dataset-2', name: 'cleaned_data', type: 'parquet', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-3': { id: 'dataset-3', name: 'model', type: 'pickle', position: { x: 0, y: 0 } } as KedroDataset,
        'dataset-4': { id: 'dataset-4', name: 'metrics', type: 'json', position: { x: 0, y: 0 } } as KedroDataset,
      };

      const connections: KedroConnection[] = [
        { id: '1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: '2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: '4', source: 'dataset-2', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: '5', source: 'node-3', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: '6', source: 'dataset-3', target: 'node-4', sourceHandle: 'out', targetHandle: 'in' },
        { id: '7', source: 'node-4', target: 'dataset-4', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const result = generatePipeline(nodes, connections, datasets, 'ml_pipeline');

      expect(result).toContain('from .nodes import load_data, clean_data, train_model, evaluate_model');
      expect(result).toContain('func=load_data');
      expect(result).toContain('func=clean_data');
      expect(result).toContain('func=train_model');
      expect(result).toContain('func=evaluate_model');
    });

    it('should handle disconnected nodes gracefully', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'orphan_node', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const result = generatePipeline(nodes, [], {}, 'test');

      expect(result).toContain('from .nodes import orphan_node');
      expect(result).toContain('func=orphan_node');
      expect(result).toContain('inputs=None');
      expect(result).toContain('outputs=None');
    });
  });
});
