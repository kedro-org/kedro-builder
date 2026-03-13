/**
 * Redux state type definitions
 */

import {
  type KedroProject,
  type KedroNode,
  type KedroDataset,
  type KedroConnection,
} from './kedro';
import type { ValidationError } from '../validation/types';

export interface ProjectState {
  current: KedroProject | null;
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
  selected: string[];  // Array-based selection for consistency with nodes/connections
}

export interface ConnectionsState {
  byId: Record<string, KedroConnection>;
  allIds: string[];
  selected: string[];  // Added for multi-select edges
}

export interface OnboardingState {
  // Tutorial state
  showTutorial: boolean;
  tutorialStep: number;
  tutorialCompleted: boolean;

  // Walkthrough state
  showWalkthrough: boolean;
  walkthroughStep: number;
  walkthroughCompleted: boolean;
}

export interface UIState {
  // Project setup state
  showProjectSetup: boolean;
  hasActiveProject: boolean;

  // UI component state
  selectedComponent: { type: 'node' | 'dataset'; id: string } | null;
  showConfigPanel: boolean;
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

// Kept here (not re-exported from store) to avoid a circular import in middleware files
// that are themselves imported by store/index.ts.
export interface RootState {
  project: ProjectState;
  nodes: NodesState;
  datasets: DatasetsState;
  connections: ConnectionsState;
  onboarding: OnboardingState;
  ui: UIState;
  validation: ValidationState;
  theme: ThemeState;
}

