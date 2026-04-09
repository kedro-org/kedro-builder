/**
 * Generate file tree structure for code viewer
 */

import type { KedroProject, KedroNode, KedroDataset, KedroConnection } from '../types/kedro';
import type { ProjectMetadata } from '../infrastructure/export/staticFilesGenerator';

/** Narrow input for generateFileTree — only the slices it actually reads */
export interface FileTreeInput {
  project: { current: KedroProject | null };
  nodes: { byId: Record<string, KedroNode>; allIds: string[] };
  datasets: { byId: Record<string, KedroDataset>; allIds: string[] };
  connections: { byId: Record<string, KedroConnection>; allIds: string[] };
}

import { generateCatalog, generateGenAIConfig } from '../infrastructure/export/catalogGenerator';
import { generateNodes } from '../infrastructure/export/nodesGenerator';
import { generatePipeline } from '../infrastructure/export/pipelineGenerator';
import { getPromptDatasetIds, getLLMContextOutputDatasetIds } from '../infrastructure/export/helpers';
import {
  generateParametersConfig,
  generateCredentialsTemplate,
  generateGitignore,
  generateReadme,
  generateInitPy,
} from '../infrastructure/export/staticFilesGenerator';
import { generatePyproject } from '../infrastructure/export/pyprojectGenerator';
import {
  generatePipelineRegistry,
  generateSettings,
  generatePipelineInit,
} from '../infrastructure/export/registryGenerator';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  expanded?: boolean;
  isKeyFile?: boolean; // Highlights important files like catalog.yml, nodes.py, pipeline.py
}

/**
 * Generate complete file tree from Redux state
 * Only includes files with content (not empty folders)
 */
export function generateFileTree(state: FileTreeInput): FileNode {
  const project = state.project.current;
  if (!project) {
    throw new Error('No active project');
  }

  const metadata: ProjectMetadata = {
    projectName: project.name,
    pythonPackage: project.pythonPackage,
    pipelineName: project.pipelineName,
    description: project.description || '',
  };

  const { pythonPackage, pipelineName } = metadata;

  // Get data from state
  const nodes = state.nodes.allIds.map((id) => state.nodes.byId[id]);
  const datasets = state.datasets.byId;
  const datasetsList = state.datasets.allIds.map((id) => datasets[id]);
  const connections = state.connections.allIds.map((id) => state.connections.byId[id]);

  // Extract dataset types for dependency generation
  const datasetTypes = datasetsList.map((d) => d.type).filter(Boolean);

  // Compute GenAI context
  const llmNodes = nodes.filter((n) => n.nodeKind === 'llm_context');
  const hasGenAI = llmNodes.length > 0;
  const llmProviders = [...new Set(llmNodes.map((n) => n.llmProvider ?? 'openai'))];
  const genAIOptions = hasGenAI ? { providers: llmProviders } : undefined;

  // Exclude prompt datasets and LLM context outputs from catalog.
  // Prompts go in genai-config.yml; LLM context outputs are in-memory Python
  // objects (LLMContext) that Kedro handles as MemoryDataset automatically.
  const promptIds = getPromptDatasetIds(nodes, connections, datasets);
  const llmOutputIds = getLLMContextOutputDatasetIds(nodes, connections);
  const catalogDatasets = datasetsList.filter(
    (ds) => !promptIds.has(ds.id) && !llmOutputIds.has(ds.id)
  );

  // Generate all file contents
  const files: Record<string, string> = {
    // Root files
    'pyproject.toml': generatePyproject(metadata, datasetTypes, genAIOptions),
    'README.md': generateReadme(metadata),
    '.gitignore': generateGitignore(),

    // Config files
    'conf/base/catalog.yml': generateCatalog(catalogDatasets),
    'conf/base/parameters.yml': generateParametersConfig(),
    'conf/local/credentials.yml': generateCredentialsTemplate(
      hasGenAI ? { llmProviders } : undefined
    ),

    // Source files
    [`src/${pythonPackage}/__init__.py`]: generateInitPy(),
    [`src/${pythonPackage}/settings.py`]: generateSettings({ hasGenAI }),
    [`src/${pythonPackage}/pipeline_registry.py`]: generatePipelineRegistry(),
    [`src/${pythonPackage}/pipelines/${pipelineName}/__init__.py`]: generatePipelineInit(pipelineName),
    [`src/${pythonPackage}/pipelines/${pipelineName}/nodes.py`]: generateNodes(
      nodes,
      connections,
      datasets,
      pipelineName
    ),
    [`src/${pythonPackage}/pipelines/${pipelineName}/pipeline.py`]: generatePipeline(
      nodes,
      connections,
      datasets,
      pipelineName
    ),
  };

  // Add genai-config.yml when LLM context nodes are present
  const genaiConfig = generateGenAIConfig(nodes, connections, datasets);
  if (genaiConfig) {
    files['conf/base/genai-config.yml'] = genaiConfig;
  }

  // Build tree structure
  const root: FileNode = {
    name: project.name,
    type: 'folder',
    path: '/',
    expanded: true,
    children: [
      {
        name: 'conf',
        type: 'folder',
        path: 'conf',
        expanded: true,
        children: [
          {
            name: 'base',
            type: 'folder',
            path: 'conf/base',
            expanded: true,
            children: [
              {
                name: 'catalog.yml',
                type: 'file',
                path: 'conf/base/catalog.yml',
                content: files['conf/base/catalog.yml'],
                isKeyFile: true,
              },
              {
                name: 'parameters.yml',
                type: 'file',
                path: 'conf/base/parameters.yml',
                content: files['conf/base/parameters.yml'],
              },
              ...(files['conf/base/genai-config.yml']
                ? [
                    {
                      name: 'genai-config.yml',
                      type: 'file' as const,
                      path: 'conf/base/genai-config.yml',
                      content: files['conf/base/genai-config.yml'],
                      isKeyFile: true,
                    },
                  ]
                : []),
            ],
          },
          {
            name: 'local',
            type: 'folder',
            path: 'conf/local',
            expanded: false,
            children: [
              {
                name: 'credentials.yml',
                type: 'file',
                path: 'conf/local/credentials.yml',
                content: files['conf/local/credentials.yml'],
              },
            ],
          },
        ],
      },
      {
        name: 'data',
        type: 'folder',
        path: 'data',
        expanded: false,
        children: [
          {
            name: '01_raw',
            type: 'folder',
            path: 'data/01_raw',
            expanded: false,
            children: [],
          },
          {
            name: '02_intermediate',
            type: 'folder',
            path: 'data/02_intermediate',
            expanded: false,
            children: [],
          },
          {
            name: '03_primary',
            type: 'folder',
            path: 'data/03_primary',
            expanded: false,
            children: [],
          },
          {
            name: '04_feature',
            type: 'folder',
            path: 'data/04_feature',
            expanded: false,
            children: [],
          },
          {
            name: '05_model_input',
            type: 'folder',
            path: 'data/05_model_input',
            expanded: false,
            children: [],
          },
          {
            name: '06_models',
            type: 'folder',
            path: 'data/06_models',
            expanded: false,
            children: [],
          },
          {
            name: '07_model_output',
            type: 'folder',
            path: 'data/07_model_output',
            expanded: false,
            children: [],
          },
          {
            name: '08_reporting',
            type: 'folder',
            path: 'data/08_reporting',
            expanded: false,
            children: [],
          },
        ],
      },
      {
        name: 'notebooks',
        type: 'folder',
        path: 'notebooks',
        expanded: false,
        children: [],
      },      
      {
        name: 'src',
        type: 'folder',
        path: 'src',
        expanded: true,
        children: [
          {
            name: pythonPackage,
            type: 'folder',
            path: `src/${pythonPackage}`,
            expanded: true,
            children: [
              {
                name: '__init__.py',
                type: 'file',
                path: `src/${pythonPackage}/__init__.py`,
                content: files[`src/${pythonPackage}/__init__.py`],
              },
              {
                name: 'settings.py',
                type: 'file',
                path: `src/${pythonPackage}/settings.py`,
                content: files[`src/${pythonPackage}/settings.py`],
              },
              {
                name: 'pipeline_registry.py',
                type: 'file',
                path: `src/${pythonPackage}/pipeline_registry.py`,
                content: files[`src/${pythonPackage}/pipeline_registry.py`],
              },
              {
                name: 'pipelines',
                type: 'folder',
                path: `src/${pythonPackage}/pipelines`,
                expanded: true,
                children: [
                  {
                    name: pipelineName,
                    type: 'folder',
                    path: `src/${pythonPackage}/pipelines/${pipelineName}`,
                    expanded: true,
                    children: [
                      {
                        name: '__init__.py',
                        type: 'file',
                        path: `src/${pythonPackage}/pipelines/${pipelineName}/__init__.py`,
                        content: files[`src/${pythonPackage}/pipelines/${pipelineName}/__init__.py`],
                      },
                      {
                        name: 'nodes.py',
                        type: 'file',
                        path: `src/${pythonPackage}/pipelines/${pipelineName}/nodes.py`,
                        content: files[`src/${pythonPackage}/pipelines/${pipelineName}/nodes.py`],
                        isKeyFile: true,
                      },
                      {
                        name: 'pipeline.py',
                        type: 'file',
                        path: `src/${pythonPackage}/pipelines/${pipelineName}/pipeline.py`,
                        content: files[`src/${pythonPackage}/pipelines/${pipelineName}/pipeline.py`],
                        isKeyFile: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'pyproject.toml',
        type: 'file',
        path: 'pyproject.toml',
        content: files['pyproject.toml'],
      },
      {
        name: 'README.md',
        type: 'file',
        path: 'README.md',
        content: files['README.md'],
      },
      {
        name: '.gitignore',
        type: 'file',
        path: '.gitignore',
        content: files['.gitignore'],
      },
    ],
  };

  return root;
}

/**
 * Find file node by path (recursive search)
 */
export function findFileByPath(root: FileNode, path: string): FileNode | null {
  if (root.path === path) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findFileByPath(child, path);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Get language for syntax highlighting based on filename
 */
export function getFileLanguage(filename: string): string {
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
  if (filename.endsWith('.toml')) return 'toml';
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.txt')) return 'text';
  if (filename === '.gitignore') return 'text';
  return 'text';
}
