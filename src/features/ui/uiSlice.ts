import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../../types/redux';

const initialState: UIState = {
  // Tutorial state
  showTutorial: false, // Will be set based on localStorage
  tutorialStep: 1,
  tutorialCompleted: false,

  // Walkthrough state
  showWalkthrough: false,
  walkthroughStep: 1,
  walkthroughCompleted: false,

  // Project setup state
  showProjectSetup: false,
  hasActiveProject: false,

  // UI component state
  selectedComponent: null,
  showConfigPanel: false,
  showCodePreview: false,
  showValidationPanel: false,
  canvasZoom: 1,
  canvasPosition: { x: 0, y: 0 },

  // Code viewer state
  showCodeViewer: false,
  selectedCodeFile: null,

  // Export wizard state
  showExportWizard: false,

  // Pending component tracking
  pendingComponentId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowTutorial: (state, action: PayloadAction<boolean>) => {
      state.showTutorial = action.payload;
    },
    setTutorialStep: (state, action: PayloadAction<number>) => {
      state.tutorialStep = action.payload;
    },
    nextTutorialStep: (state) => {
      if (state.tutorialStep < 5) {
        state.tutorialStep += 1;
      }
    },
    prevTutorialStep: (state) => {
      if (state.tutorialStep > 1) {
        state.tutorialStep -= 1;
      }
    },
    completeTutorial: (state) => {
      state.showTutorial = false;
      state.tutorialCompleted = true;
      state.tutorialStep = 1;
      // Save to localStorage
      localStorage.setItem('kedro_builder_tutorial_completed', 'true');
      // Auto-start walkthrough after tutorial
      state.showWalkthrough = true;
      state.walkthroughStep = 1;
    },
    openTutorial: (state) => {
      state.showTutorial = true;
      state.tutorialStep = 1;
    },
    // Walkthrough actions
    startWalkthrough: (state) => {
      state.showWalkthrough = true;
      state.walkthroughStep = 1;
    },
    setWalkthroughStep: (state, action: PayloadAction<number>) => {
      state.walkthroughStep = action.payload;
    },
    nextWalkthroughStep: (state) => {
      if (state.walkthroughStep < 4) {
        state.walkthroughStep += 1;
      }
    },
    prevWalkthroughStep: (state) => {
      if (state.walkthroughStep > 1) {
        state.walkthroughStep -= 1;
      }
    },
    completeWalkthrough: (state) => {
      state.showWalkthrough = false;
      state.walkthroughCompleted = true;
      state.walkthroughStep = 1;
      // Save to localStorage
      localStorage.setItem('kedro_builder_walkthrough_completed', 'true');
    },
    skipWalkthrough: (state) => {
      state.showWalkthrough = false;
      state.walkthroughCompleted = true;
      localStorage.setItem('kedro_builder_walkthrough_completed', 'true');
    },
    reopenWalkthrough: (state) => {
      state.showWalkthrough = true;
      state.walkthroughStep = 1;
    },
    // Project setup actions
    openProjectSetup: (state) => {
      state.showProjectSetup = true;
    },
    closeProjectSetup: (state) => {
      state.showProjectSetup = false;
    },
    setHasActiveProject: (state, action: PayloadAction<boolean>) => {
      state.hasActiveProject = action.payload;
    },
    openConfigPanel: (
      state,
      action: PayloadAction<{ type: 'node' | 'dataset'; id: string }>
    ) => {
      state.selectedComponent = action.payload;
      state.showConfigPanel = true;
    },
    closeConfigPanel: (state) => {
      state.showConfigPanel = false;
      state.selectedComponent = null;
    },
    toggleCodePreview: (state) => {
      state.showCodePreview = !state.showCodePreview;
    },
    setShowCodePreview: (state, action: PayloadAction<boolean>) => {
      state.showCodePreview = action.payload;
    },
    setShowValidationPanel: (state, action: PayloadAction<boolean>) => {
      state.showValidationPanel = action.payload;
    },
    setCanvasZoom: (state, action: PayloadAction<number>) => {
      state.canvasZoom = action.payload;
    },
    setCanvasPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.canvasPosition = action.payload;
    },
    // Code viewer actions
    openCodeViewer: (state) => {
      state.showCodeViewer = true;
      // Set default file if not set
      if (!state.selectedCodeFile) {
        state.selectedCodeFile = 'conf/base/catalog.yml';
      }
    },
    closeCodeViewer: (state) => {
      state.showCodeViewer = false;
    },
    selectCodeFile: (state, action: PayloadAction<string>) => {
      state.selectedCodeFile = action.payload;
    },
    // Export wizard actions
    openExportWizard: (state) => {
      state.showExportWizard = true;
    },
    closeExportWizard: (state) => {
      state.showExportWizard = false;
    },
    // Pending component actions
    setPendingComponent: (
      state,
      action: PayloadAction<{ type: 'node' | 'dataset'; id: string } | null>
    ) => {
      state.pendingComponentId = action.payload;
    },
    clearPendingComponent: (state) => {
      state.pendingComponentId = null;
    },
  },
});

export const {
  // Tutorial actions
  setShowTutorial,
  setTutorialStep,
  nextTutorialStep,
  prevTutorialStep,
  completeTutorial,
  openTutorial,
  // Walkthrough actions
  startWalkthrough,
  setWalkthroughStep,
  nextWalkthroughStep,
  prevWalkthroughStep,
  completeWalkthrough,
  skipWalkthrough,
  reopenWalkthrough,
  // Project setup actions
  openProjectSetup,
  closeProjectSetup,
  setHasActiveProject,
  // UI component actions
  openConfigPanel,
  closeConfigPanel,
  toggleCodePreview,
  setShowCodePreview,
  setShowValidationPanel,
  setCanvasZoom,
  setCanvasPosition,
  // Code viewer actions
  openCodeViewer,
  closeCodeViewer,
  selectCodeFile,
  // Export wizard actions
  openExportWizard,
  closeExportWizard,
  // Pending component actions
  setPendingComponent,
  clearPendingComponent,
} = uiSlice.actions;

export default uiSlice.reducer;
