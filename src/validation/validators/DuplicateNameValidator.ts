/**
 * Duplicate Name Validator
 * Checks for duplicate node and dataset names
 */

import type { RootState } from '@/store';
import { type ValidationError, ValidationCode } from '../types';
import type { Validator } from './Validator';

export class DuplicateNameValidator implements Validator {
  readonly id = 'duplicate-name';
  readonly name = 'Duplicate Name Check';
  readonly severity = 'error' as const;

  validate(state: RootState): ValidationError[] {
    const errors: ValidationError[] = [];
    const nodeNames = new Map<string, string[]>();
    const datasetNames = new Map<string, string[]>();

    // Collect node names
    state.nodes.allIds.forEach((nodeId) => {
      const node = state.nodes.byId[nodeId];
      if (node && node.name) {
        const name = node.name.trim().toLowerCase();
        if (!nodeNames.has(name)) nodeNames.set(name, []);
        nodeNames.get(name)!.push(nodeId);
      }
    });

    // Collect dataset names
    state.datasets.allIds.forEach((datasetId) => {
      const dataset = state.datasets.byId[datasetId];
      if (dataset && dataset.name) {
        const name = dataset.name.trim().toLowerCase();
        if (!datasetNames.has(name)) datasetNames.set(name, []);
        datasetNames.get(name)!.push(datasetId);
      }
    });

    // Check for duplicate node names
    nodeNames.forEach((nodeIds) => {
      if (nodeIds.length > 1) {
        nodeIds.forEach((nodeId) => {
          errors.push({
            id: `error-duplicate-node-${nodeId}`,
            code: ValidationCode.DUPLICATE_NAME,
            severity: 'error',
            componentId: nodeId,
            componentType: 'node',
            message: `Duplicate node name "${state.nodes.byId[nodeId].name}" found in ${nodeIds.length} nodes`,
            suggestion: 'Rename this node to make it unique',
          });
        });
      }
    });

    // Check for duplicate dataset names
    datasetNames.forEach((datasetIds) => {
      if (datasetIds.length > 1) {
        datasetIds.forEach((datasetId) => {
          errors.push({
            id: `error-duplicate-dataset-${datasetId}`,
            code: ValidationCode.DUPLICATE_NAME,
            severity: 'error',
            componentId: datasetId,
            componentType: 'dataset',
            message: `Duplicate dataset name "${state.datasets.byId[datasetId].name}" found in ${datasetIds.length} datasets`,
            suggestion: 'Rename this dataset to make it unique',
          });
        });
      }
    });

    return errors;
  }
}
