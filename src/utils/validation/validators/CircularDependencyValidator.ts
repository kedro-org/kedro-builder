/**
 * Circular Dependency Validator
 * Detects cycles in the pipeline graph
 */

import type { RootState } from '@/types/redux';
import type { KedroConnection } from '@/types/kedro';
import type { ValidationError } from '../types';
import type { Validator } from './Validator';
import { buildDependencyGraph, detectCycles } from '@/domain/PipelineGraph';

export class CircularDependencyValidator implements Validator {
  readonly id = 'circular-dependency';
  readonly name = 'Circular Dependency Check';
  readonly severity = 'error' as const;

  validate(state: RootState): ValidationError[] {
    const errors: ValidationError[] = [];
    const connections = this.getConnectionsArray(state);
    const graph = buildDependencyGraph(state.nodes.allIds, connections);
    const cycles = detectCycles(graph);

    cycles.forEach((cycle) => {
      if (cycle.hasCycle && cycle.cyclePath.length > 0) {
        const nodeId = cycle.cyclePath[0];
        const cycleNames = cycle.cyclePath
          .map((id) => state.nodes.byId[id]?.name || id)
          .join(' → ');

        errors.push({
          id: `error-circular-${nodeId}`,
          severity: 'error',
          componentId: nodeId,
          componentType: 'pipeline',
          message: `Circular dependency detected: ${cycleNames}`,
          suggestion: 'Remove one connection to break the cycle',
        });
      }
    });

    return errors;
  }

  private getConnectionsArray(state: RootState): KedroConnection[] {
    return state.connections.allIds.map((id) => state.connections.byId[id]).filter(Boolean);
  }
}
