/**
 * Orphaned Dataset Validator
 * Checks for datasets with no connections
 */

import type { RootState } from '../../../types/redux';
import type { KedroConnection } from '../../../types/kedro';
import type { ValidationError } from '../types';
import type { Validator } from './Validator';
import { findOrphanedDatasets } from '../../../domain/PipelineGraph';

export class OrphanedDatasetValidator implements Validator {
  readonly id = 'orphaned-dataset';
  readonly name = 'Orphaned Dataset Check';
  readonly severity = 'warning' as const;

  validate(state: RootState): ValidationError[] {
    const warnings: ValidationError[] = [];
    const connections = this.getConnectionsArray(state);
    const orphanedDatasetIds = findOrphanedDatasets(state.datasets.allIds, connections);

    orphanedDatasetIds.forEach((datasetId) => {
      const dataset = state.datasets.byId[datasetId];
      warnings.push({
        id: `warning-orphan-dataset-${datasetId}`,
        severity: 'warning',
        componentId: datasetId,
        componentType: 'dataset',
        message: `Dataset "${dataset.name}" is not connected to any nodes`,
        suggestion: 'Connect this dataset or remove it from the pipeline',
      });
    });

    return warnings;
  }

  private getConnectionsArray(state: RootState): KedroConnection[] {
    return state.connections.allIds.map((id) => state.connections.byId[id]).filter(Boolean);
  }
}
