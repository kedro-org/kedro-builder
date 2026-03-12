/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import uiReducer, { openCodeViewer } from './uiSlice';
import type { UIState } from '../../types/redux';

describe('uiSlice', () => {
  const initialState: UIState = {
    showProjectSetup: false,
    hasActiveProject: false,
    selectedComponent: null,
    showConfigPanel: false,
    showValidationPanel: false,
    canvasZoom: 1,
    canvasPosition: { x: 0, y: 0 },
    showCodeViewer: false,
    selectedCodeFile: null,
    showExportWizard: false,
    pendingComponentId: null,
  };

  it('openCodeViewer should set default file when none selected', () => {
    const state = uiReducer(initialState, openCodeViewer());

    expect(state.showCodeViewer).toBe(true);
    expect(state.selectedCodeFile).toBe('conf/base/catalog.yml');
  });
});
