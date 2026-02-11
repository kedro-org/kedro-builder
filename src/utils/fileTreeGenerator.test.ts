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

    it('should generate minimal project structure with no nodes or datasets', () => {
      const state = createState();
      const tree = generateFileTree(state);

      expect(tree.name).toBe('test_project');
      expect(tree.type).toBe('folder');
      expect(tree.path).toBe('/');
      expect(tree.expanded).toBe(true);
      expect(tree.children).toBeDefined();
    });

    it('should include all required root folders', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const folderNames = tree.children!.map((c) => c.name);
      expect(folderNames).toContain('conf');
      expect(folderNames).toContain('data');
      expect(folderNames).toContain('notebooks');
      expect(folderNames).toContain('src');
    });

    it('should include all required root files', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const fileNames = tree.children!.map((c) => c.name);
      expect(fileNames).toContain('pyproject.toml');
      expect(fileNames).toContain('README.md');
      expect(fileNames).toContain('.gitignore');
    });

    it('should generate conf/base structure with catalog and parameters', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const confFolder = tree.children!.find((c) => c.name === 'conf');
      expect(confFolder).toBeDefined();

      const baseFolder = confFolder!.children!.find((c) => c.name === 'base');
      expect(baseFolder).toBeDefined();

      const baseFiles = baseFolder!.children!.map((c) => c.name);
      expect(baseFiles).toContain('catalog.yml');
      expect(baseFiles).toContain('parameters.yml');
    });

    it('should generate conf/local structure with credentials', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const confFolder = tree.children!.find((c) => c.name === 'conf');
      const localFolder = confFolder!.children!.find((c) => c.name === 'local');
      expect(localFolder).toBeDefined();

      const localFiles = localFolder!.children!.map((c) => c.name);
      expect(localFiles).toContain('credentials.yml');
    });

    it('should generate all data layer folders', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const dataFolder = tree.children!.find((c) => c.name === 'data');
      expect(dataFolder).toBeDefined();

      const layerNames = dataFolder!.children!.map((c) => c.name);
      expect(layerNames).toContain('01_raw');
      expect(layerNames).toContain('02_intermediate');
      expect(layerNames).toContain('03_primary');
      expect(layerNames).toContain('04_feature');
      expect(layerNames).toContain('05_model_input');
      expect(layerNames).toContain('06_models');
      expect(layerNames).toContain('07_model_output');
      expect(layerNames).toContain('08_reporting');
    });

    it('should generate src package structure', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const srcFolder = tree.children!.find((c) => c.name === 'src');
      expect(srcFolder).toBeDefined();

      const packageFolder = srcFolder!.children!.find((c) => c.name === 'test_project');
      expect(packageFolder).toBeDefined();

      const packageFiles = packageFolder!.children!.map((c) => c.name);
      expect(packageFiles).toContain('__init__.py');
      expect(packageFiles).toContain('settings.py');
      expect(packageFiles).toContain('pipeline_registry.py');
      expect(packageFiles).toContain('pipelines');
    });

    it('should generate pipeline structure with nodes and pipeline files', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const srcFolder = tree.children!.find((c) => c.name === 'src');
      const packageFolder = srcFolder!.children!.find((c) => c.name === 'test_project');
      const pipelinesFolder = packageFolder!.children!.find((c) => c.name === 'pipelines');
      expect(pipelinesFolder).toBeDefined();

      const defaultPipeline = pipelinesFolder!.children!.find((c) => c.name === 'default');
      expect(defaultPipeline).toBeDefined();

      const pipelineFiles = defaultPipeline!.children!.map((c) => c.name);
      expect(pipelineFiles).toContain('__init__.py');
      expect(pipelineFiles).toContain('nodes.py');
      expect(pipelineFiles).toContain('pipeline.py');
    });

    it('should mark key files with isKeyFile flag', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');
      expect(catalogFile?.isKeyFile).toBe(true);

      const nodesFile = findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py');
      expect(nodesFile?.isKeyFile).toBe(true);

      const pipelineFile = findFileByPath(tree, 'src/test_project/pipelines/default/pipeline.py');
      expect(pipelineFile?.isKeyFile).toBe(true);
    });

    it('should generate content for all files', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const pyprojectFile = tree.children!.find((c) => c.name === 'pyproject.toml');
      expect(pyprojectFile?.content).toBeDefined();
      expect(pyprojectFile?.content).toContain('[tool.kedro]');

      const readmeFile = tree.children!.find((c) => c.name === 'README.md');
      expect(readmeFile?.content).toBeDefined();
      expect(readmeFile?.content).toContain('# test_project');

      const gitignoreFile = tree.children!.find((c) => c.name === '.gitignore');
      expect(gitignoreFile?.content).toBeDefined();
    });

    it('should use custom project metadata', () => {
      const state = createState([], [], [], {
        name: 'custom_project',
        pythonPackage: 'custom_package',
        pipelineName: 'custom_pipeline',
        description: 'Custom description',
      });

      const tree = generateFileTree(state);

      expect(tree.name).toBe('custom_project');

      const srcFolder = tree.children!.find((c) => c.name === 'src');
      const packageFolder = srcFolder!.children!.find((c) => c.name === 'custom_package');
      expect(packageFolder).toBeDefined();

      const pipelinesFolder = packageFolder!.children!.find((c) => c.name === 'pipelines');
      const customPipeline = pipelinesFolder!.children!.find((c) => c.name === 'custom_pipeline');
      expect(customPipeline).toBeDefined();
    });

    it('should generate catalog with datasets', () => {
      const datasets: KedroDataset[] = [
        {
          id: 'dataset-1',
          name: 'raw_data',
          type: 'csv',
          filepath: 'data/01_raw/raw_data.csv',
          position: { x: 0, y: 0 },
        },
        {
          id: 'dataset-2',
          name: 'processed_data',
          type: 'parquet',
          filepath: 'data/02_intermediate/processed.parquet',
          position: { x: 100, y: 0 },
        },
      ];

      const state = createState([], datasets);
      const tree = generateFileTree(state);

      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');
      expect(catalogFile).toBeDefined();
      expect(catalogFile?.content).toContain('raw_data:');
      expect(catalogFile?.content).toContain('processed_data:');
    });

    it('should generate nodes.py with nodes', () => {
      const nodes: KedroNode[] = [
        {
          id: 'node-1',
          name: 'process_data',
          type: 'data_processing',
          inputs: [],
          outputs: [],
          functionCode: 'return data',
          position: { x: 0, y: 0 },
        },
      ];

      const state = createState(nodes);
      const tree = generateFileTree(state);

      const nodesFile = findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py');
      expect(nodesFile).toBeDefined();
      expect(nodesFile?.content).toContain('def process_data');
    });

    it('should generate pipeline.py with connections', () => {
      const nodes: KedroNode[] = [
        {
          id: 'node-1',
          name: 'load_data',
          type: 'data_ingestion',
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
          position: { x: 100, y: 0 },
        },
      ];

      const connections: KedroConnection[] = [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'dataset-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const state = createState(nodes, datasets, connections);
      const tree = generateFileTree(state);

      const pipelineFile = findFileByPath(tree, 'src/test_project/pipelines/default/pipeline.py');
      expect(pipelineFile).toBeDefined();
      expect(pipelineFile?.content).toContain('node(');
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

    it('should set correct file paths', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');
      expect(catalogFile?.path).toBe('conf/base/catalog.yml');

      const nodesFile = findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py');
      expect(nodesFile?.path).toBe('src/test_project/pipelines/default/nodes.py');

      const pyprojectFile = tree.children!.find((c) => c.name === 'pyproject.toml');
      expect(pyprojectFile?.path).toBe('pyproject.toml');
    });

    it('should handle complex pipeline with multiple nodes and datasets', () => {
      const nodes: KedroNode[] = [
        {
          id: 'node-1',
          name: 'load',
          type: 'data_ingestion',
          inputs: [],
          outputs: [],
          position: { x: 0, y: 0 },
        },
        {
          id: 'node-2',
          name: 'clean',
          type: 'data_processing',
          inputs: [],
          outputs: [],
          position: { x: 200, y: 0 },
        },
        {
          id: 'node-3',
          name: 'train',
          type: 'model_training',
          inputs: [],
          outputs: [],
          position: { x: 400, y: 0 },
        },
      ];

      const datasets: KedroDataset[] = [
        {
          id: 'dataset-1',
          name: 'raw',
          type: 'csv',
          layer: '01_raw',
          position: { x: 100, y: 0 },
        },
        {
          id: 'dataset-2',
          name: 'clean',
          type: 'parquet',
          layer: '02_intermediate',
          position: { x: 300, y: 0 },
        },
        {
          id: 'dataset-3',
          name: 'model',
          type: 'pickle',
          layer: '06_models',
          position: { x: 500, y: 0 },
        },
      ];

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
        {
          id: 'conn-4',
          source: 'dataset-2',
          target: 'node-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'conn-5',
          source: 'node-3',
          target: 'dataset-3',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ];

      const state = createState(nodes, datasets, connections);
      const tree = generateFileTree(state);

      expect(tree).toBeDefined();
      expect(tree.children).toBeDefined();

      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');
      expect(catalogFile?.content).toContain('raw:');
      expect(catalogFile?.content).toContain('clean:');
      expect(catalogFile?.content).toContain('model:');
    });

    it('should include dataset types for dependency generation', () => {
      const datasets: KedroDataset[] = [
        {
          id: 'dataset-1',
          name: 'data',
          type: 'parquet',
          position: { x: 0, y: 0 },
        },
      ];

      const state = createState([], datasets);
      const tree = generateFileTree(state);

      const pyprojectFile = tree.children!.find((c) => c.name === 'pyproject.toml');
      expect(pyprojectFile?.content).toBeDefined();
      // Should include parquet dataset extra for kedro-datasets
      expect(pyprojectFile?.content).toContain('pandas-parquetdataset');
    });
  });

  describe('findFileByPath', () => {
    it('should find root node by path', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, '/');

      expect(found).toBeDefined();
      expect(found?.name).toBe('test_project');
    });

    it('should find file in root', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, 'pyproject.toml');

      expect(found).toBeDefined();
      expect(found?.name).toBe('pyproject.toml');
      expect(found?.type).toBe('file');
    });

    it('should find nested file', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, 'conf/base/catalog.yml');

      expect(found).toBeDefined();
      expect(found?.name).toBe('catalog.yml');
      expect(found?.type).toBe('file');
    });

    it('should find deeply nested file', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py');

      expect(found).toBeDefined();
      expect(found?.name).toBe('nodes.py');
      expect(found?.type).toBe('file');
    });

    it('should find folder by path', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, 'conf/base');

      expect(found).toBeDefined();
      expect(found?.name).toBe('base');
      expect(found?.type).toBe('folder');
    });

    it('should return null for non-existent path', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, 'does/not/exist.txt');

      expect(found).toBeNull();
    });

    it('should return null for partial path match', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, 'conf/base/nonexistent.yml');

      expect(found).toBeNull();
    });

    it('should handle empty path', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const found = findFileByPath(tree, '');

      expect(found).toBeNull();
    });

    it('should find all data layer folders', () => {
      const state = createState();
      const tree = generateFileTree(state);

      const layers = [
        'data/01_raw',
        'data/02_intermediate',
        'data/03_primary',
        'data/04_feature',
        'data/05_model_input',
        'data/06_models',
        'data/07_model_output',
        'data/08_reporting',
      ];

      layers.forEach((layer) => {
        const found = findFileByPath(tree, layer);
        expect(found).toBeDefined();
        expect(found?.type).toBe('folder');
      });
    });
  });

  describe('getFileLanguage', () => {
    it('should detect Python files', () => {
      expect(getFileLanguage('script.py')).toBe('python');
      expect(getFileLanguage('module.py')).toBe('python');
      expect(getFileLanguage('__init__.py')).toBe('python');
    });

    it('should detect YAML files', () => {
      expect(getFileLanguage('config.yml')).toBe('yaml');
      expect(getFileLanguage('data.yaml')).toBe('yaml');
      expect(getFileLanguage('catalog.yml')).toBe('yaml');
    });

    it('should detect TOML files', () => {
      expect(getFileLanguage('pyproject.toml')).toBe('toml');
      expect(getFileLanguage('config.toml')).toBe('toml');
    });

    it('should detect Markdown files', () => {
      expect(getFileLanguage('README.md')).toBe('markdown');
      expect(getFileLanguage('CHANGELOG.md')).toBe('markdown');
    });

    it('should detect text files', () => {
      expect(getFileLanguage('notes.txt')).toBe('text');
      expect(getFileLanguage('data.txt')).toBe('text');
    });

    it('should detect .gitignore as text', () => {
      expect(getFileLanguage('.gitignore')).toBe('text');
    });

    it('should default to text for unknown extensions', () => {
      expect(getFileLanguage('unknown.xyz')).toBe('text');
      expect(getFileLanguage('noextension')).toBe('text');
    });

    it('should handle files with multiple extensions', () => {
      expect(getFileLanguage('archive.tar.gz')).toBe('text');
      expect(getFileLanguage('data.json.txt')).toBe('text');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileLanguage('SCRIPT.PY')).toBe('text'); // Case-sensitive check
      expect(getFileLanguage('script.PY')).toBe('text');
    });

    it('should handle files with no extension', () => {
      expect(getFileLanguage('Makefile')).toBe('text');
      expect(getFileLanguage('LICENSE')).toBe('text');
    });

    it('should handle paths with directories', () => {
      expect(getFileLanguage('src/module/script.py')).toBe('python');
      expect(getFileLanguage('conf/base/catalog.yml')).toBe('yaml');
    });
  });

  describe('edge cases', () => {
    it('should handle project with empty description', () => {
      const state = createState([], [], [], {
        description: '',
      });

      const tree = generateFileTree(state);
      expect(tree).toBeDefined();
    });

    it('should handle project with very long name', () => {
      const longName = 'a'.repeat(100);
      const state = createState([], [], [], {
        name: longName,
      });

      const tree = generateFileTree(state);
      expect(tree.name).toBe(longName);
    });

    it('should handle project with special characters in name', () => {
      const state = createState([], [], [], {
        name: 'my-project-2023',
        pythonPackage: 'my_project_2023',
      });

      const tree = generateFileTree(state);
      expect(tree.name).toBe('my-project-2023');

      const srcFolder = tree.children!.find((c) => c.name === 'src');
      const packageFolder = srcFolder!.children!.find((c) => c.name === 'my_project_2023');
      expect(packageFolder).toBeDefined();
    });

    it('should handle state with no datasets but has nodes', () => {
      const nodes: KedroNode[] = [
        {
          id: 'node-1',
          name: 'process',
          type: 'custom',
          inputs: [],
          outputs: [],
          position: { x: 0, y: 0 },
        },
      ];

      const state = createState(nodes, []);
      const tree = generateFileTree(state);

      const catalogFile = findFileByPath(tree, 'conf/base/catalog.yml');
      expect(catalogFile).toBeDefined();
      expect(catalogFile?.content).toContain('# No datasets defined');
    });

    it('should handle state with no nodes but has datasets', () => {
      const datasets: KedroDataset[] = [
        {
          id: 'dataset-1',
          name: 'data',
          type: 'csv',
          position: { x: 0, y: 0 },
        },
      ];

      const state = createState([], datasets);
      const tree = generateFileTree(state);

      const nodesFile = findFileByPath(tree, 'src/test_project/pipelines/default/nodes.py');
      expect(nodesFile).toBeDefined();
      expect(nodesFile?.content).toBeDefined();
    });
  });
});
