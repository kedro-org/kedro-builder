/**
 * Redux state type definitions
 */

import {
  type KedroProject,
  type KedroNode,
  type KedroDataset,
  type KedroConnection,
  type ValidationError,
  type ProjectMetadata,
} from './kedro';

export interface ProjectState {
  current: KedroProject | null;
  savedList: ProjectMetadata[];
  lastSaved: number | null;
}

export interface NodesState {
  byId: Record<string, KedroNode>;
  allIds: string[];
  selected: string[];  // Changed to array for multi-select
  hovered: string | null;
}

export interface DatasetsState {
  byId: Record<string, KedroDataset>;
  allIds: string[];
  selected: string | null;
}

export interface ConnectionsState {
  byId: Record<string, KedroConnection>;
  allIds: string[];
  selected: string[];  // Added for multi-select edges
}

export interface UIState {
  // Tutorial state
  showTutorial: boolean;
  tutorialStep: number;
  tutorialCompleted: boolean;

  // Walkthrough state
  showWalkthrough: boolean;
  walkthroughStep: number;
  walkthroughCompleted: boolean;

  // Project setup state
  showProjectSetup: boolean;
  hasActiveProject: boolean;

  // UI component state
  selectedComponent: { type: 'node' | 'dataset'; id: string } | null;
  showConfigPanel: boolean;
  showCodePreview: boolean;
  showValidationPanel: boolean;
  canvasZoom: number;
  canvasPosition: { x: number; y: number };

  // Code viewer state
  showCodeViewer: boolean;
  selectedCodeFile: string | null;

  // Export wizard state
  showExportWizard: boolean;

  // Pending component tracking (for enforcing config completion)
  pendingComponentId: { type: 'node' | 'dataset'; id: string } | null;
}

export interface ValidationState {
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
  lastChecked: number | null;
}

export interface ThemeState {
  theme: 'light' | 'dark';
}

export interface RootState {
  project: ProjectState;
  nodes: NodesState;
  datasets: DatasetsState;
  connections: ConnectionsState;
  ui: UIState;
  validation: ValidationState;
  theme: ThemeState;
}
