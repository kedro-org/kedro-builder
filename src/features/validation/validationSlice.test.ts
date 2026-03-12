/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import validationReducer, {
  clearValidation,
} from './validationSlice';
import type { ValidationState } from '../../types/redux';

describe('validationSlice', () => {
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
