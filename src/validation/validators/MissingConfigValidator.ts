/**
 * Missing Config Validator
 * Checks for datasets with missing configuration
 */

import type { RootState } from '@/store';
import { type ValidationError, ValidationCode } from '../types';
import type { Validator } from './Validator';
import { FILEPATH_EXEMPT_TYPES } from '../../constants/datasetTypes';

export class MissingConfigValidator implements Validator {
  readonly id = 'missing-config';
  readonly name = 'Missing Config Check';
  readonly severity = 'warning' as const;

  validate(state: RootState): ValidationError[] {
    const warnings: ValidationError[] = [];

    state.datasets.allIds.forEach((datasetId) => {
      const dataset = state.datasets.byId[datasetId];
      if (dataset) {
        const issues: string[] = [];

        if (!dataset.type) {
          issues.push('type');
        }

        if (!FILEPATH_EXEMPT_TYPES.has(dataset.type ?? '') && !dataset.filepath?.trim()) {
          issues.push('filepath');
        }

        if (issues.length > 0) {
          warnings.push({
            id: `warning-missing-config-${datasetId}`,
            code: ValidationCode.MISSING_CONFIG,
            severity: 'warning',
            componentId: datasetId,
            componentType: 'dataset',
            message: `Dataset "${dataset.name}" is missing: ${issues.join(', ')}`,
            suggestion: 'Configure this dataset in the config panel',
          });
        }
      }
    });

    return warnings;
  }
}
