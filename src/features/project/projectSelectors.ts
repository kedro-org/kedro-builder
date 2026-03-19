import type { RootState } from '../../store';
import type { KedroProject } from '../../types/kedro';

export const selectCurrentProject = (state: RootState): KedroProject | null => {
  return state.project.current;
};

export const selectProjectName = (state: RootState): string => {
  return state.project.current?.name || 'Untitled Project';
};
