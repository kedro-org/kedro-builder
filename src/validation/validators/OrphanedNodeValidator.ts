/**
 * Orphaned Node Validator
 * Checks for nodes with no connections
 */

import type { RootState } from '@/store';
import { type ValidationError, ValidationCode } from '../types';
import type { Validator } from './Validator';
import { findOrphanedNodes } from '@/domain/PipelineGraph';
import { getConnectionsArray } from './helpers';

export class OrphanedNodeValidator implements Validator {
  readonly id = 'orphaned-node';
  readonly name = 'Orphaned Node Check';
  readonly severity = 'warning' as const;

  validate(state: RootState): ValidationError[] {
    const warnings: ValidationError[] = [];
    const connections = getConnectionsArray(state);
    const orphanedNodeIds = findOrphanedNodes(state.nodes.allIds, connections);

    orphanedNodeIds.forEach((nodeId) => {
      const node = state.nodes.byId[nodeId];
      warnings.push({
        id: `warning-orphan-node-${nodeId}`,
        code: ValidationCode.ORPHANED_NODE,
        severity: 'warning',
        componentId: nodeId,
        componentType: 'node',
        message: `Node "${node.name}" is not connected to any datasets`,
        suggestion: 'Connect this node or remove it from the pipeline',
      });
    });

    return warnings;
  }
}
