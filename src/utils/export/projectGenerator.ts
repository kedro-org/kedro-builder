/**
 * Main orchestrator for generating complete Kedro project
 */

import JSZip from 'jszip';
import type { RootState } from '../../types/redux';
import type { ProjectMetadata } from './staticFilesGenerator';

import { generateCatalog } from './catalogGenerator';
import { generateNodes } from './nodesGenerator';
import { generatePipeline } from './pipelineGenerator';
import {
  generateLoggingConfig,
  generateParametersConfig,
  generateCredentialsTemplate,
  generateGitignore,
  generateReadme,
  generateInitPy,
  generateGitkeep,
} from './staticFilesGenerator';
import { generatePyproject } from './pyprojectGenerator';
import {
  generatePipelineRegistry,
  generateSettings,
  generatePipelineInit,
} from './registryGenerator';

/**
 * Generate complete Kedro project as ZIP file
 */
export async function generateKedroProject(
  state: RootState,
  metadata: ProjectMetadata
): Promise<Blob> {
  const { pythonPackage, pipelineName } = metadata;

  // Create ZIP instance
  const zip = new JSZip();

  // Get data from state
  const nodes = state.nodes.allIds.map((id) => state.nodes.byId[id]);
  const datasets = state.datasets.byId;
  const datasetsList = state.datasets.allIds.map((id) => datasets[id]);
  const connections = state.connections.allIds.map((id) => state.connections.byId[id]);

  // ========================================
  // ROOT LEVEL FILES
  // ========================================

  zip.file('pyproject.toml', generatePyproject(metadata));
  zip.file('README.md', generateReadme(metadata));
  zip.file('.gitignore', generateGitignore());

  // ========================================
  // CONFIGURATION FILES (conf/)
  // ========================================

  // Base configuration
  zip.file('conf/base/catalog.yml', generateCatalog(datasetsList));
  zip.file('conf/base/parameters.yml', generateParametersConfig());
  zip.file('conf/base/logging.yml', generateLoggingConfig(pythonPackage));

  // Local configuration (templates)
  zip.file('conf/local/credentials.yml', generateCredentialsTemplate());

  // ========================================
  // SOURCE CODE (src/)
  // ========================================

  // Package root
  zip.file(`src/${pythonPackage}/__init__.py`, generateInitPy());
  zip.file(`src/${pythonPackage}/settings.py`, generateSettings());
  zip.file(`src/${pythonPackage}/pipeline_registry.py`, generatePipelineRegistry());

  // Pipeline code
  const pipelineDir = `src/${pythonPackage}/pipelines/${pipelineName}`;
  zip.file(`${pipelineDir}/__init__.py`, generatePipelineInit(pipelineName));
  zip.file(`${pipelineDir}/nodes.py`, generateNodes(nodes, connections, datasets, pipelineName));
  zip.file(`${pipelineDir}/pipeline.py`, generatePipeline(nodes, connections, datasets, pipelineName));

  // Empty pipelines __init__.py
  zip.file(`src/${pythonPackage}/pipelines/__init__.py`, generateInitPy());

  // ========================================
  // DATA DIRECTORIES (data/)
  // ========================================

  const dataLayers = [
    '01_raw',
    '02_intermediate',
    '03_primary',
    '04_feature',
    '05_model_input',
    '06_models',
    '07_model_output',
    '08_reporting',
  ];

  dataLayers.forEach((layer) => {
    zip.file(`data/${layer}/.gitkeep`, generateGitkeep());
  });

  // ========================================
  // LOGS DIRECTORY (logs/)
  // ========================================

  zip.file('logs/.gitkeep', generateGitkeep());

  // ========================================
  // GENERATE ZIP BLOB
  // ========================================

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Trigger browser download of the ZIP file
 */
export function downloadProject(blob: Blob, projectName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
