/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import uiReducer, {
  completeTutorial,
  openCodeViewer,
  nextTutorialStep,
} from './uiSlice';
import type { UIState } from '../../types/redux';

describe('uiSlice', () => {
  const initialState: UIState = {
    showTutorial: false,
    tutorialStep: 1,
    tutorialCompleted: false,
    showWalkthrough: false,
    walkthroughStep: 1,
    walkthroughCompleted: false,
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

  it('completeTutorial should close tutorial AND auto-start walkthrough', () => {
    const tutorialActive: UIState = {
      ...initialState,
      showTutorial: true,
      tutorialStep: 5,
    };

    const state = uiReducer(tutorialActive, completeTutorial());

    // Tutorial finished
    expect(state.showTutorial).toBe(false);
    expect(state.tutorialCompleted).toBe(true);
    expect(state.tutorialStep).toBe(1); // reset

    // Walkthrough auto-started
    expect(state.showWalkthrough).toBe(true);
    expect(state.walkthroughStep).toBe(1);
  });

  it('openCodeViewer should set default file when none selected', () => {
    const state = uiReducer(initialState, openCodeViewer());

    expect(state.showCodeViewer).toBe(true);
    expect(state.selectedCodeFile).toBe('conf/base/catalog.yml');
  });

  it('nextTutorialStep should cap at step 7', () => {
    const atStep7: UIState = { ...initialState, tutorialStep: 7 };

    const state = uiReducer(atStep7, nextTutorialStep());

    expect(state.tutorialStep).toBe(7); // does not exceed 7
  });
});
