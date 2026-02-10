import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootState } from '../../types/redux';
import type { ProjectMetadata } from './staticFilesGenerator';
import { generateKedroProject, downloadProject } from './projectGenerator';
import { buildKedroProject } from './KedroProjectBuilder';
import { createMockState } from '../../test/utils/mockStore';

vi.mock('./KedroProjectBuilder', () => ({
  buildKedroProject: vi.fn(),
}));

describe('projectGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates project generation to buildKedroProject', async () => {
    const expectedBlob = new Blob(['zip-content']);
    vi.mocked(buildKedroProject).mockResolvedValue(expectedBlob);

    const state = createMockState() as RootState;
    const metadata: ProjectMetadata = {
      projectName: 'demo',
      pythonPackage: 'demo_pkg',
      pipelineName: 'data_pipeline',
      description: 'Test project',
    };

    const result = await generateKedroProject(state, metadata);

    expect(result).toBe(expectedBlob);
    expect(buildKedroProject).toHaveBeenCalledWith(state, metadata);
    expect(buildKedroProject).toHaveBeenCalledTimes(1);
  });

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
