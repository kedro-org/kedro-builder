/**
 * Validation utilities barrel export
 *
 * This module provides:
 * - Input validation for real-time form validation
 * - Pipeline validation for export validation
 * - Strategy pattern validators for extensible validation
 */

// Types
export type {
  InputValidationResult,
  ValidationError,
  ValidationResult,
} from './types';

// Input validation (real-time form validation)
export {
  PYTHON_KEYWORDS,
  isPythonKeyword,
  validateNodeName,
  validateDatasetName,
  sanitizeForPython,
} from './inputValidation';

// Pipeline validation (export validation)
export {
  validatePipeline,
  checkCircularDependencies,
  checkDuplicateNames,
  checkInvalidNames,
  checkEmptyNames,
  checkOrphanedNodes,
  checkOrphanedDatasets,
  checkMissingCode,
  checkMissingConfig,
} from './pipelineValidation';

// Strategy pattern validators
export {
  type Validator,
  ValidatorRegistry,
  CircularDependencyValidator,
  DuplicateNameValidator,
  InvalidNameValidator,
  EmptyNameValidator,
  OrphanedNodeValidator,
  OrphanedDatasetValidator,
  MissingCodeValidator,
  MissingConfigValidator,
  createDefaultValidatorRegistry,
  getDefaultValidatorRegistry,
} from './validators';
