/**
 * Pipeline validation for export
 *
 * Delegates to the Strategy pattern ValidatorRegistry.
 * Each validation concern is implemented as a separate Validator class.
 */

import type { RootState } from '../store';
import type { ValidationResult } from './types';
import { getDefaultValidatorRegistry } from './validators';

/**
 * Main validation function - runs all validators via the registry
 */
export function validatePipeline(state: RootState): ValidationResult {
  const registry = getDefaultValidatorRegistry();
  const allIssues = registry.validateAll(state);

  const errors = allIssues.filter((e) => e.severity === 'error');
  const warnings = allIssues.filter((e) => e.severity === 'warning');

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
