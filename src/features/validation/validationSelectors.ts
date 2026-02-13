import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { ValidationError } from '../../utils/validation';

// Plain selectors — no memoization needed for simple property access
const selectValidationErrors = (state: RootState) => state.validation.errors;
const selectValidationWarnings = (state: RootState) => state.validation.warnings;
const selectValidationIsValid = (state: RootState) => state.validation.isValid;
const selectValidationLastChecked = (state: RootState) => state.validation.lastChecked;

/**
 * Select validation summary with computed properties
 */
export const selectValidationSummary = createSelector(
  [selectValidationErrors, selectValidationWarnings, selectValidationIsValid, selectValidationLastChecked],
  (errors, warnings, isValid, lastChecked) => ({
    errors,
    warnings,
    isValid,
    lastChecked,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
    totalIssues: errors.length + warnings.length,
  })
);

/**
 * Create a memoized index of validation issues by component ID
 * This allows O(1) lookup instead of O(n) filtering per component
 */
export const selectValidationByComponentId = createSelector(
  [selectValidationErrors, selectValidationWarnings],
  (errors, warnings) => {
    const byComponentId: Record<string, { errors: ValidationError[]; warnings: ValidationError[] }> = {};

    // Index errors
    errors.forEach((error) => {
      if (error.componentId) {
        if (!byComponentId[error.componentId]) {
          byComponentId[error.componentId] = { errors: [], warnings: [] };
        }
        byComponentId[error.componentId].errors.push(error);
      }
    });

    // Index warnings
    warnings.forEach((warning) => {
      if (warning.componentId) {
        if (!byComponentId[warning.componentId]) {
          byComponentId[warning.componentId] = { errors: [], warnings: [] };
        }
        byComponentId[warning.componentId].warnings.push(warning);
      }
    });

    return byComponentId;
  }
);

/**
 * Select validation status for a specific node
 * Uses the indexed lookup for O(1) performance
 */
export const selectNodeValidationStatus = createSelector(
  [selectValidationByComponentId, (_state: RootState, nodeId: string) => nodeId],
  (byComponentId, nodeId) => {
    const validation = byComponentId[nodeId];
    const nodeErrors = validation?.errors.filter((e) => e.componentType === 'node') || [];
    const nodeWarnings = validation?.warnings.filter((w) => w.componentType === 'node') || [];

    return {
      hasError: nodeErrors.length > 0,
      hasWarning: nodeWarnings.length > 0,
      errors: nodeErrors,
      warnings: nodeWarnings,
    };
  }
);

/**
 * Select validation status for a specific dataset
 * Uses the indexed lookup for O(1) performance
 */
export const selectDatasetValidationStatus = createSelector(
  [selectValidationByComponentId, (_state: RootState, datasetId: string) => datasetId],
  (byComponentId, datasetId) => {
    const validation = byComponentId[datasetId];
    const datasetErrors = validation?.errors.filter((e) => e.componentType === 'dataset') || [];
    const datasetWarnings = validation?.warnings.filter((w) => w.componentType === 'dataset') || [];

    return {
      hasError: datasetErrors.length > 0,
      hasWarning: datasetWarnings.length > 0,
      errors: datasetErrors,
      warnings: datasetWarnings,
    };
  }
);

