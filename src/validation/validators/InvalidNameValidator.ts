/**
 * Invalid Name Validator
 * Checks for invalid characters in node and dataset names
 */

import type { RootState } from '@/store';
import { type ValidationError, ValidationCode } from '../types';
import type { Validator } from './Validator';
import { NODE_NAME_PATTERN, DATASET_NAME_PATTERN } from '../inputValidation';

export class InvalidNameValidator implements Validator {
  readonly id = 'invalid-name';
  readonly name = 'Invalid Name Check';
  readonly severity = 'error' as const;

  validate(state: RootState): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check nodes - allow letters, numbers, spaces, underscores
    state.nodes.allIds.forEach((nodeId) => {
      const node = state.nodes.byId[nodeId];
      if (node && node.name) {
        const trimmed = node.name.trim();
        if (!NODE_NAME_PATTERN.test(trimmed)) {
          errors.push({
            id: `error-invalid-node-name-${nodeId}`,
            code: ValidationCode.INVALID_NAME,
            severity: 'error',
            componentId: nodeId,
            componentType: 'node',
            message: `Invalid node name "${node.name}"`,
            suggestion: 'Use only letters, numbers, spaces, and underscores. Must start with a letter.',
          });
        }
      }
    });

    // Check datasets - require snake_case
    state.datasets.allIds.forEach((datasetId) => {
      const dataset = state.datasets.byId[datasetId];
      if (dataset && dataset.name) {
        const trimmed = dataset.name.trim();
        if (!DATASET_NAME_PATTERN.test(trimmed)) {
          errors.push({
            id: `error-invalid-dataset-name-${datasetId}`,
            code: ValidationCode.INVALID_NAME,
            severity: 'error',
            componentId: datasetId,
            componentType: 'dataset',
            message: `Invalid dataset name "${dataset.name}"`,
            suggestion: 'Use snake_case: lowercase letters, numbers, and underscores only (no spaces allowed).',
          });
        }
      }
    });

    return errors;
  }
}
