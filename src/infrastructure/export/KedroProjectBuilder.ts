/**
 * Builder pattern for generating Kedro projects
 * Provides a fluent API for customizable project generation
 */

import JSZip from 'jszip';
import type { RootState } from '../../types/redux';
import type { KedroNode, KedroDataset, KedroConnection } from '../../types/kedro';
import type { ProjectMetadata } from './staticFilesGenerator';

import { generateCatalog } from './catalogGenerator';
import { generateNodes } from './nodesGenerator';
import { generatePipeline } from './pipelineGenerator';
import {
  generateParametersConfig,
  generateCredentialsTemplate,
  generateGitignore,
  generateReadme,
  generateInitPy,
  generateMainPy,
  generateGitkeep,
  generateTelemetry,
} from './staticFilesGenerator';
import { generatePyproject } from './pyprojectGenerator';
import {
  generatePipelineRegistry,
  generateSettings,
  generatePipelineInit,
} from './registryGenerator';

/**
 * Options for customizing project generation
 */
export interface ProjectBuildOptions {
  /** Include README.md */
  includeReadme: boolean;
  /** Include .gitignore */
  includeGitignore: boolean;
  /** Include .telemetry file */
  includeTelemetry: boolean;
  /** Include data directories with .gitkeep */
  includeDataDirectories: boolean;
  /** Include logs directory */
  includeLogsDirectory: boolean;
  /** Compression level (0-9, 0 = no compression) */
  compressionLevel: number;
}

const DEFAULT_OPTIONS: ProjectBuildOptions = {
  includeReadme: true,
  includeGitignore: true,
  includeTelemetry: true,
  includeDataDirectories: true,
  includeLogsDirectory: true,
  compressionLevel: 6,
};

const DATA_LAYERS = [
  '01_raw',
  '02_intermediate',
  '03_primary',
  '04_feature',
  '05_model_input',
  '06_models',
  '07_model_output',
  '08_reporting',
] as const;

/**
 * Builder class for generating Kedro projects
 *
 * @example
 * ```typescript
 * const blob = await new KedroProjectBuilder(state, metadata)
 *   .withCatalog()
 *   .withPipeline()
 *   .withNodes()
 *   .withConfiguration()
 *   .withRootFiles()
 *   .withDataDirectories()
 *   .build();
 * ```
 */
export class KedroProjectBuilder {
  private zip: JSZip;
  private metadata: ProjectMetadata;
  private options: ProjectBuildOptions;

  // Extracted data from state
  private nodes: KedroNode[];
  private datasets: Record<string, KedroDataset>;
  private datasetsList: KedroDataset[];
  private connections: KedroConnection[];

  constructor(state: RootState, metadata: ProjectMetadata, options: Partial<ProjectBuildOptions> = {}) {
    this.zip = new JSZip();
    this.metadata = metadata;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Extract data from state
    this.nodes = state.nodes.allIds.map((id) => state.nodes.byId[id]);
    this.datasets = state.datasets.byId;
    this.datasetsList = state.datasets.allIds.map((id) => this.datasets[id]);
    this.connections = state.connections.allIds.map((id) => state.connections.byId[id]);
  }

  /**
   * Add catalog.yml to the project
   */
  withCatalog(): this {
    this.zip.file('conf/base/catalog.yml', generateCatalog(this.datasetsList));
    return this;
  }

  /**
   * Add pipeline.py to the project
   */
  withPipeline(): this {
    const { pythonPackage, pipelineName } = this.metadata;
    const pipelineDir = `src/${pythonPackage}/pipelines/${pipelineName}`;
    this.zip.file(
      `${pipelineDir}/pipeline.py`,
      generatePipeline(this.nodes, this.connections, this.datasets, pipelineName)
    );
    return this;
  }

  /**
   * Add nodes.py to the project
   */
  withNodes(): this {
    const { pythonPackage, pipelineName } = this.metadata;
    const pipelineDir = `src/${pythonPackage}/pipelines/${pipelineName}`;
    this.zip.file(
      `${pipelineDir}/nodes.py`,
      generateNodes(this.nodes, this.connections, this.datasets, pipelineName)
    );
    return this;
  }

  /**
   * Add all configuration files (parameters, credentials templates)
   */
  withConfiguration(): this {
    this.zip.file('conf/base/parameters.yml', generateParametersConfig());
    this.zip.file('conf/local/credentials.yml', generateCredentialsTemplate());
    return this;
  }

  /**
   * Add root level files (pyproject.toml, README, .gitignore, etc.)
   */
  withRootFiles(): this {
    const datasetTypes = this.datasetsList.map((d) => d.type).filter(Boolean);
    this.zip.file('pyproject.toml', generatePyproject(this.metadata, datasetTypes));

    if (this.options.includeReadme) {
      this.zip.file('README.md', generateReadme(this.metadata));
    }

    if (this.options.includeGitignore) {
      this.zip.file('.gitignore', generateGitignore());
    }

    if (this.options.includeTelemetry) {
      this.zip.file('.telemetry', generateTelemetry());
    }

    return this;
  }

  /**
   * Add package structure (__init__.py, settings.py, pipeline_registry.py)
   */
  withPackageStructure(): this {
    const { pythonPackage, pipelineName } = this.metadata;

    // Package root
    this.zip.file(`src/${pythonPackage}/__init__.py`, generateInitPy());
    this.zip.file(`src/${pythonPackage}/__main__.py`, generateMainPy(pythonPackage));
    this.zip.file(`src/${pythonPackage}/settings.py`, generateSettings());
    this.zip.file(`src/${pythonPackage}/pipeline_registry.py`, generatePipelineRegistry());

    // Pipelines directory
    this.zip.file(`src/${pythonPackage}/pipelines/__init__.py`, generateInitPy());

    // Pipeline __init__.py
    const pipelineDir = `src/${pythonPackage}/pipelines/${pipelineName}`;
    this.zip.file(`${pipelineDir}/__init__.py`, generatePipelineInit(pipelineName));

    return this;
  }

  /**
   * Add data layer directories with .gitkeep files
   */
  withDataDirectories(): this {
    if (!this.options.includeDataDirectories) {
      return this;
    }

    DATA_LAYERS.forEach((layer) => {
      this.zip.file(`data/${layer}/.gitkeep`, generateGitkeep());
    });

    return this;
  }

  /**
   * Add logs directory with .gitkeep
   */
  withLogsDirectory(): this {
    if (!this.options.includeLogsDirectory) {
      return this;
    }

    this.zip.file('logs/.gitkeep', generateGitkeep());
    return this;
  }

  /**
   * Add a custom file to the project
   */
  withCustomFile(path: string, content: string): this {
    this.zip.file(path, content);
    return this;
  }

  /**
   * Add all standard project files (convenience method)
   * Equivalent to calling all with* methods
   */
  withAllFiles(): this {
    return this
      .withRootFiles()
      .withConfiguration()
      .withPackageStructure()
      .withCatalog()
      .withNodes()
      .withPipeline()
      .withDataDirectories()
      .withLogsDirectory();
  }

  /**
   * Build the ZIP file and return as Blob
   */
  async build(): Promise<Blob> {
    return await this.zip.generateAsync({
      type: 'blob',
      compression: this.options.compressionLevel > 0 ? 'DEFLATE' : 'STORE',
      compressionOptions: { level: this.options.compressionLevel },
    });
  }

  /**
   * Build and get the ZIP instance for further manipulation
   */
  getZip(): JSZip {
    return this.zip;
  }

  /**
   * Get list of files that will be included in the ZIP
   */
  getFileList(): string[] {
    const files: string[] = [];
    this.zip.forEach((relativePath) => {
      files.push(relativePath);
    });
    return files.sort();
  }
}

/**
 * Generate complete Kedro project as ZIP file
 */
export async function generateKedroProject(
  state: RootState,
  metadata: ProjectMetadata,
  options?: Partial<ProjectBuildOptions>
): Promise<Blob> {
  return new KedroProjectBuilder(state, metadata, options)
    .withAllFiles()
    .build();
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
