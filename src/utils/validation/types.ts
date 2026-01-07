/**
 * Validation type definitions
 */

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
  severity: 'error' | 'warning';
  componentId: string;
  componentType: 'node' | 'dataset' | 'connection' | 'pipeline';
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
