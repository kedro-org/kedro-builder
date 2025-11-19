/**
 * Generate file tree structure for code viewer
 */

import type { RootState } from '../types/redux';
import type { ProjectMetadata } from './export/staticFilesGenerator';

import { generateCatalog } from './export/catalogGenerator';
import { generateNodes } from './export/nodesGenerator';
import { generatePipeline } from './export/pipelineGenerator';
import {
  generateParametersConfig,
  generateCredentialsTemplate,
  generateGitignore,
  generateReadme,
  generateInitPy,
} from './export/staticFilesGenerator';
import { generatePyproject } from './export/pyprojectGenerator';
import {
  generatePipelineRegistry,
  generateSettings,
  generatePipelineInit,
} from './export/registryGenerator';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  expanded?: boolean;
}

/**
 * Generate complete file tree from Redux state
 * Only includes files with content (not empty folders)
 */
export function generateFileTree(state: RootState): FileNode {
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

  // Generate all file contents
  const files = {
    // Root files
    'pyproject.toml': generatePyproject(metadata, datasetTypes),
    'README.md': generateReadme(metadata),
    '.gitignore': generateGitignore(),

    // Config files
    'conf/base/catalog.yml': generateCatalog(datasetsList),
    'conf/base/parameters.yml': generateParametersConfig(),
    'conf/local/credentials.yml': generateCredentialsTemplate(),

    // Source files
    [`src/${pythonPackage}/__init__.py`]: generateInitPy(),
    [`src/${pythonPackage}/settings.py`]: generateSettings(),
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
              },
              {
                name: 'parameters.yml',
                type: 'file',
                path: 'conf/base/parameters.yml',
                content: files['conf/base/parameters.yml'],
              },
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
        children: [],
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
                      },
                      {
                        name: 'pipeline.py',
                        type: 'file',
                        path: `src/${pythonPackage}/pipelines/${pipelineName}/pipeline.py`,
                        content: files[`src/${pythonPackage}/pipelines/${pipelineName}/pipeline.py`],
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
