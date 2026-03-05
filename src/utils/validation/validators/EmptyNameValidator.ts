/**
 * Empty Name Validator
 * Checks for empty or default names
 */

import type { RootState } from '@/store';
import type { ValidationError } from '../types';
import type { Validator } from './Validator';

export class EmptyNameValidator implements Validator {
  readonly id = 'empty-name';
  readonly name = 'Empty Name Check';
  readonly severity = 'error' as const;

  validate(state: RootState): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check nodes
    state.nodes.allIds.forEach((nodeId) => {
      const node = state.nodes.byId[nodeId];
      if (node) {
        const name = node.name?.trim() || '';
        if (!name || name === 'Unnamed Node') {
          errors.push({
            id: `error-empty-node-name-${nodeId}`,
            severity: 'error',
            componentId: nodeId,
            componentType: 'node',
            message: 'Node has no name',
            suggestion: 'Give this node a descriptive name',
          });
        }
      }
    });

    // Check datasets
    state.datasets.allIds.forEach((datasetId) => {
      const dataset = state.datasets.byId[datasetId];
      if (dataset) {
        const name = dataset.name?.trim() || '';
        if (!name || name === 'Unnamed Dataset') {
          errors.push({
            id: `error-empty-dataset-name-${datasetId}`,
            severity: 'error',
            componentId: datasetId,
            componentType: 'dataset',
            message: 'Dataset has no name',
            suggestion: 'Give this dataset a descriptive name',
          });
        }
      }
    });

    return errors;
  }
}
