/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import projectReducer, {
  createProject,
  updateProject,
  clearProject,
} from './projectSlice';
import type { ProjectState } from '../../types/redux';

describe('projectSlice', () => {
  const initialState: ProjectState = {
    current: null,
  };

  it('createProject should auto-generate id, createdAt, and updatedAt', () => {
    const before = Date.now();
    const state = projectReducer(
      initialState,
      createProject({
        name: 'my_pipeline',
        pythonPackage: 'my_pipeline',
        pipelineName: 'default',
        description: 'A test pipeline',
      })
    );
    const after = Date.now();

    expect(state.current).not.toBeNull();
    expect(state.current!.id).toMatch(/^project-\d+$/);
    expect(state.current!.name).toBe('my_pipeline');
    expect(state.current!.createdAt).toBeGreaterThanOrEqual(before);
    expect(state.current!.createdAt).toBeLessThanOrEqual(after);
    expect(state.current!.updatedAt).toBe(state.current!.createdAt);
  });

  it('updateProject should merge changes and bump updatedAt', () => {
    const stateWithProject: ProjectState = {
      ...initialState,
      current: {
        id: 'project-1',
        name: 'old_name',
        pythonPackage: 'old_name',
        pipelineName: 'default',
        description: '',
        createdAt: 1000,
        updatedAt: 1000,
      },
    };

    const state = projectReducer(
      stateWithProject,
      updateProject({ name: 'new_name' })
    );

    expect(state.current!.name).toBe('new_name');
    expect(state.current!.pythonPackage).toBe('old_name'); // untouched field
    expect(state.current!.updatedAt).toBeGreaterThan(1000);
  });

  it('clearProject should reset current to null', () => {
    const populated: ProjectState = {
      current: {
        id: 'project-1',
        name: 'test',
        pythonPackage: 'test',
        pipelineName: 'default',
        description: '',
        createdAt: 1000,
        updatedAt: 1000,
      },
    };

    const state = projectReducer(populated, clearProject());

    expect(state.current).toBeNull();
  });
});
