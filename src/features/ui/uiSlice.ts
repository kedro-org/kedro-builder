import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../../types/redux';

const initialState: UIState = {
  // Project setup state
  showProjectSetup: false,
  hasActiveProject: false,

  // UI component state
  selectedComponent: null,
  showConfigPanel: false,
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
  // Project setup actions
  openProjectSetup,
  closeProjectSetup,
  setHasActiveProject,
  // UI component actions
  openConfigPanel,
  closeConfigPanel,
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
