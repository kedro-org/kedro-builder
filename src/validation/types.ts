/**
 * Validation type definitions
 */

/**
 * Validation error codes — use these instead of matching on message strings
 */
export const ValidationCode = {
  CIRCULAR_DEPENDENCY: 'circular-dependency',
  DUPLICATE_NAME: 'duplicate-name',
  INVALID_NAME: 'invalid-name',
  EMPTY_NAME: 'empty-name',
  ORPHANED_NODE: 'orphaned-node',
  ORPHANED_DATASET: 'orphaned-dataset',
  MISSING_CODE: 'missing-code',
  MISSING_CONFIG: 'missing-config',
  MISSING_PROMPT: 'missing-prompt',
} as const;

export type ValidationCode = (typeof ValidationCode)[keyof typeof ValidationCode];

/**
 * Result of real-time input validation
 */
export interface InputValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Validation error for pipeline validation
 */
export interface ValidationError {
  id: string;
  code: ValidationCode;
  severity: 'error' | 'warning';
  componentId: string;
  componentType: 'node' | 'dataset' | 'connection' | 'pipeline';
  field?: string;
  message: string;
  suggestion?: string;
}

/**
 * Result of pipeline validation
 */
export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
}
