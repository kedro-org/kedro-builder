import { describe, expect, it, vi } from 'vitest';
import { KedroProjectBuilder, downloadProject } from './KedroProjectBuilder';
import { createTestState } from '../../test/utils/mockStore';
import type { ProjectMetadata } from './staticFilesGenerator';
import type { KedroNode, KedroDataset, KedroConnection } from '../../types/kedro';

const metadata: ProjectMetadata = {
  projectName: 'demo_project',
  pythonPackage: 'demo_project',
  pipelineName: 'default',
  description: 'A demo pipeline',
};

const node: KedroNode = {
  id: 'node-1',
  name: 'clean_data',
  type: 'data_processing',
  inputs: ['raw_data'],
  outputs: ['clean_data'],
  position: { x: 0, y: 0 },
};

const dataset: KedroDataset = {
  id: 'ds-1',
  name: 'raw_data',
  type: 'csv',
  filepath: 'data/01_raw/raw.csv',
  layer: '01_raw',
  position: { x: 0, y: 0 },
};

const connection: KedroConnection = {
  id: 'conn-1',
  source: 'node-1',
  target: 'ds-1',
  sourceHandle: 'output-0',
  targetHandle: 'input-0',
};

describe('KedroProjectBuilder', () => {
  it('withAllFiles produces the complete expected file set', () => {
    const state = createTestState([node], [dataset], [connection], {});
    const builder = new KedroProjectBuilder(state, metadata);
    builder.withAllFiles();

    const files = builder.getFileList();

    // Core pipeline files
    expect(files).toContain('src/demo_project/pipelines/default/pipeline.py');
    expect(files).toContain('src/demo_project/pipelines/default/nodes.py');
    expect(files).toContain('conf/base/catalog.yml');

    // Package structure
    expect(files).toContain('src/demo_project/__init__.py');
    expect(files).toContain('src/demo_project/pipeline_registry.py');
    expect(files).toContain('src/demo_project/settings.py');

    // Root files
    expect(files).toContain('pyproject.toml');
    expect(files).toContain('README.md');
    expect(files).toContain('.gitignore');

    // Data directories (8 layers + logs)
    expect(files).toContain('data/01_raw/.gitkeep');
    expect(files).toContain('data/08_reporting/.gitkeep');
    expect(files).toContain('logs/.gitkeep');
  });

  it('withCatalog adds catalog.yml to conf/base/', () => {
    const state = createTestState([node], [dataset], [connection], {});
    const builder = new KedroProjectBuilder(state, metadata);
    builder.withCatalog();

    const files = builder.getFileList();
    expect(files).toContain('conf/base/catalog.yml');
    // Only catalog-related entries (directory + file), nothing else
    expect(files.filter((f) => !f.endsWith('/'))).toEqual(['conf/base/catalog.yml']);
  });

  it('includeReadme=false skips README.md', () => {
    const state = createTestState([node], [dataset], [connection], {});
    const builder = new KedroProjectBuilder(state, metadata, { includeReadme: false });
    builder.withRootFiles();

    const files = builder.getFileList();
    expect(files).not.toContain('README.md');
    // Other root files should still be present
    expect(files).toContain('pyproject.toml');
    expect(files).toContain('.gitignore');
  });
});

describe('downloadProject', () => {
  it('creates download link, clicks it, and revokes object URL', () => {
    const blob = new Blob(['zip-content']);
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadProject(blob, 'kedro-demo');

    expect(createObjectUrlSpy).toHaveBeenCalledWith(blob);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(link.download).toBe('kedro-demo.zip');
    expect(link.href).toBe('blob:mock-url');

    expect(removeChildSpy).toHaveBeenCalledWith(link);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:mock-url');
  });
});
