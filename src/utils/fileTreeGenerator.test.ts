/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { generateFileTree, findFileByPath, getFileLanguage } from './fileTreeGenerator';
import type { RootState } from '../types/redux';
import type { KedroNode, KedroDataset, KedroConnection } from '../types/kedro';

// Helper to create a minimal valid state
function createState(
  nodes: KedroNode[] = [],
  datasets: KedroDataset[] = [],
  connections: KedroConnection[] = [],
  projectOverrides: Partial<NonNullable<RootState['project']['current']>> = {}
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
      hasActiveProject: true,
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
      current: {
        id: 'project-1',
        name: 'test_project',
        pythonPackage: 'test_project',
        pipelineName: 'default',
        description: 'Test project description',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...projectOverrides,
      },
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

describe('fileTreeGenerator', () => {
  describe('generateFileTree', () => {
    it('should throw error when no active project', () => {
      const state = createState();
      state.project.current = null;
      expect(() => generateFileTree(state)).toThrow('No active project');
    });

    it('should generate correct root structure', () => {
      const state = createState();
      const tree = generateFileTree(state);

      expect(tree.name).toBe('test_project');
      expect(tree.type).toBe('folder');
      expect(tree.path).toBe('/');
      expect(tree.expanded).toBe(true);

      const names = tree.children!.map((c) => c.name);
      expect(names).toContain('conf');
      expect(names).toContain('data');
      expect(names).toContain('notebooks');
      expect(names).toContain('src');
      expect(names).toContain('pyproject.toml');
      expect(names).toContain('README.md');
      expect(names).toContain('.gitignore');
    });

    it('should generate conf structure with catalog and credentials', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');
      expect(catalogFile).toBeDefined();

      const parametersFile = findFileByPath(tree, 'conf/base/parameters.yml');
      expect(parametersFile).toBeDefined();

      const credentialsFile = findFileByPath(tree, 'conf/local/credentials.yml');
      expect(credentialsFile).toBeDefined();
    });

    it('should generate all 8 data layer folders', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const dataFolder = tree.children!.find((c) => c.name === 'data');
      const layerNames = dataFolder!.children!.map((c) => c.name);
      expect(layerNames).toEqual(expect.arrayContaining([
        '01_raw', '02_intermediate', '03_primary', '04_feature',
        '05_model_input', '06_models', '07_model_output', '08_reporting',
      ]));
    });

    it('should generate pipeline structure with nodes.py and pipeline.py', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const nodesFile = findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py');
      expect(nodesFile).toBeDefined();

      const pipelineFile = findFileByPath(tree, 'src/test_project/pipelines/default/pipeline.py');
      expect(pipelineFile).toBeDefined();

      const initFile = findFileByPath(tree, 'src/test_project/pipelines/default/__init__.py');
      expect(initFile).toBeDefined();
    });

    it('should mark key files with isKeyFile flag', () => {
      const state = createState();
      const tree = generateFileTree(state);

      expect(findFileByPath(tree, 'conf/base/catalog.yml')?.isKeyFile).toBe(true);
      expect(findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py')?.isKeyFile).toBe(true);
      expect(findFileByPath(tree, 'src/test_project/pipelines/default/pipeline.py')?.isKeyFile).toBe(true);
    });

    it('should generate content for root files', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const pyprojectFile = tree.children!.find((c) => c.name === 'pyproject.toml');
      expect(pyprojectFile?.content).toContain('[tool.kedro]');

      const readmeFile = tree.children!.find((c) => c.name === 'README.md');
      expect(readmeFile?.content).toContain('# test_project');
    });

    it('should use custom project metadata', () => {
      const state = createState([], [], [], {
        name: 'custom_project',
        pythonPackage: 'custom_package',
        pipelineName: 'custom_pipeline',
      });

      const tree = generateFileTree(state);
      expect(tree.name).toBe('custom_project');

      const srcFolder = tree.children!.find((c) => c.name === 'src');
      expect(srcFolder!.children!.find((c) => c.name === 'custom_package')).toBeDefined();
    });

    it('should generate catalog with datasets', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'raw_data', type: 'csv', filepath: 'data/01_raw/raw_data.csv', position: { x: 0, y: 0 } },
        { id: 'dataset-2', name: 'processed_data', type: 'parquet', filepath: 'data/02_intermediate/processed.parquet', position: { x: 100, y: 0 } },
      ];

      const state = createState([], datasets);
      const tree = generateFileTree(state);
      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');

      expect(catalogFile?.content).toContain('raw_data:');
      expect(catalogFile?.content).toContain('processed_data:');
    });

    it('should generate nodes.py with node functions', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'process_data', type: 'data_processing', inputs: [], outputs: [], functionCode: 'return data', position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes);
      const nodesFile = findFileByPath(generateFileTree(state), 'src/test_project/pipelines/default/nodes.py');
      expect(nodesFile?.content).toContain('def process_data');
    });

    it('should generate pipeline.py with connections', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'load_data', type: 'data_ingestion', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'raw_data', type: 'csv', position: { x: 100, y: 0 } },
      ];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const pipelineFile = findFileByPath(generateFileTree(state), 'src/test_project/pipelines/default/pipeline.py');
      expect(pipelineFile?.content).toContain('node(');
    });

    it('should handle state with no datasets (empty catalog comment)', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'process', type: 'custom', inputs: [], outputs: [], position: { x: 0, y: 0 } },
      ];

      const state = createState(nodes, []);
      const catalogFile = findFileByPath(generateFileTree(state), 'conf/base/catalog.yml');
      expect(catalogFile?.content).toContain('# No datasets defined');
    });

    it('should set correct expanded flags', () => {
      const state = createState();
      const tree = generateFileTree(state);

      expect(tree.expanded).toBe(true);

      const confFolder = tree.children!.find((c) => c.name === 'conf');
      expect(confFolder?.expanded).toBe(true);

      const baseFolder = confFolder!.children!.find((c) => c.name === 'base');
      expect(baseFolder?.expanded).toBe(true);

      const localFolder = confFolder!.children!.find((c) => c.name === 'local');
      expect(localFolder?.expanded).toBe(false);

      const dataFolder = tree.children!.find((c) => c.name === 'data');
      expect(dataFolder?.expanded).toBe(false);

      const srcFolder = tree.children!.find((c) => c.name === 'src');
      expect(srcFolder?.expanded).toBe(true);
    });

    it('should handle complex pipeline with multiple nodes and datasets', () => {
      const nodes: KedroNode[] = [
        { id: 'node-1', name: 'load', type: 'data_ingestion', inputs: [], outputs: [], position: { x: 0, y: 0 } },
        { id: 'node-2', name: 'clean', type: 'data_processing', inputs: [], outputs: [], position: { x: 200, y: 0 } },
        { id: 'node-3', name: 'train', type: 'model_training', inputs: [], outputs: [], position: { x: 400, y: 0 } },
      ];
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'raw', type: 'csv', layer: '01_raw', position: { x: 100, y: 0 } },
        { id: 'dataset-2', name: 'clean', type: 'parquet', layer: '02_intermediate', position: { x: 300, y: 0 } },
        { id: 'dataset-3', name: 'model', type: 'pickle', layer: '06_models', position: { x: 500, y: 0 } },
      ];
      const connections: KedroConnection[] = [
        { id: 'conn-1', source: 'node-1', target: 'dataset-1', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-2', source: 'dataset-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-3', source: 'node-2', target: 'dataset-2', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-4', source: 'dataset-2', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' },
        { id: 'conn-5', source: 'node-3', target: 'dataset-3', sourceHandle: 'out', targetHandle: 'in' },
      ];

      const state = createState(nodes, datasets, connections);
      const tree = generateFileTree(state);

      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');
      expect(catalogFile?.content).toContain('raw:');
      expect(catalogFile?.content).toContain('clean:');
      expect(catalogFile?.content).toContain('model:');
    });

    it('should include dataset types for pyproject dependency generation', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'data', type: 'parquet', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const tree = generateFileTree(state);
      const pyprojectFile = tree.children!.find((c) => c.name === 'pyproject.toml');
      expect(pyprojectFile?.content).toContain('pandas-parquetdataset');
    });

    it('should handle state with no nodes but has datasets', () => {
      const datasets: KedroDataset[] = [
        { id: 'dataset-1', name: 'data', type: 'csv', position: { x: 0, y: 0 } },
      ];

      const state = createState([], datasets);
      const tree = generateFileTree(state);
      const nodesFile = findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py');
      expect(nodesFile).toBeDefined();
      expect(nodesFile?.content).toBeDefined();
    });
  });

  describe('findFileByPath', () => {
    it('should find root, files, and nested files', () => {
      const state = createState();
      const tree = generateFileTree(state);

      expect(findFileByPath(tree, '/')?.name).toBe('test_project');
      expect(findFileByPath(tree, 'pyproject.toml')?.type).toBe('file');
      expect(findFileByPath(tree, 'conf/base/catalog.yml')?.name).toBe('catalog.yml');
      expect(findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py')?.name).toBe('nodes.py');
      expect(findFileByPath(tree, 'conf/base')?.type).toBe('folder');
    });

    it('should return null for non-existent paths', () => {
      const state = createState();
      const tree = generateFileTree(state);

      expect(findFileByPath(tree, 'does/not/exist.txt')).toBeNull();
      expect(findFileByPath(tree, 'conf/base/nonexistent.yml')).toBeNull();
      expect(findFileByPath(tree, '')).toBeNull();
    });
  });

  describe('getFileLanguage', () => {
    it('should detect known file types', () => {
      expect(getFileLanguage('script.py')).toBe('python');
      expect(getFileLanguage('config.yml')).toBe('yaml');
      expect(getFileLanguage('data.yaml')).toBe('yaml');
      expect(getFileLanguage('pyproject.toml')).toBe('toml');
      expect(getFileLanguage('README.md')).toBe('markdown');
      expect(getFileLanguage('notes.txt')).toBe('text');
    });

    it('should default to text for unknown or missing extensions', () => {
      expect(getFileLanguage('.gitignore')).toBe('text');
      expect(getFileLanguage('unknown.xyz')).toBe('text');
      expect(getFileLanguage('Makefile')).toBe('text');
    });

    it('should handle paths with directories', () => {
      expect(getFileLanguage('src/module/script.py')).toBe('python');
      expect(getFileLanguage('conf/base/catalog.yml')).toBe('yaml');
    });
  });
});
