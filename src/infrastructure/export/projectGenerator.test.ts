import { describe, expect, it, vi } from 'vitest';
import { downloadProject } from './KedroProjectBuilder';

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
