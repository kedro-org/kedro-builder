/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import validationReducer, {
  setValidationErrors,
  clearValidation,
} from './validationSlice';
import type { ValidationState } from '../../types/redux';
import type { ValidationError } from '../../utils/validation/types';

describe('validationSlice', () => {
  const initialState: ValidationState = {
    errors: [],
    warnings: [],
    isValid: true,
    lastChecked: null,
  };

  it('setValidationErrors should split errors/warnings and set isValid=false when errors exist', () => {
    const mixed: ValidationError[] = [
      {
        id: 'err-1',
        severity: 'error',
        componentId: 'node-1',
        componentType: 'node',
        message: 'Node has empty name',
      },
      {
        id: 'warn-1',
        severity: 'warning',
        componentId: 'ds-1',
        componentType: 'dataset',
        message: 'Dataset is orphaned',
      },
      {
        id: 'err-2',
        severity: 'error',
        componentId: 'node-2',
        componentType: 'node',
        message: 'Missing code',
      },
    ];

    const state = validationReducer(initialState, setValidationErrors(mixed));

    expect(state.errors).toHaveLength(2);
    expect(state.warnings).toHaveLength(1);
    expect(state.isValid).toBe(false);
    expect(state.lastChecked).toBeGreaterThan(0);
  });

  it('clearValidation should reset to pristine state', () => {
    const dirty: ValidationState = {
      errors: [{ id: 'e1', severity: 'error', componentId: 'n1', componentType: 'node', message: 'err' }],
      warnings: [{ id: 'w1', severity: 'warning', componentId: 'd1', componentType: 'dataset', message: 'warn' }],
      isValid: false,
      lastChecked: 99999,
    };

    const state = validationReducer(dirty, clearValidation());

    expect(state.errors).toEqual([]);
    expect(state.warnings).toEqual([]);
    expect(state.isValid).toBe(true);
    expect(state.lastChecked).toBeNull();
  });
});
