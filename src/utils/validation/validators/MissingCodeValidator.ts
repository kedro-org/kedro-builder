/**
 * Missing Code Validator
 * Checks for nodes with no function code
 */

import type { RootState } from '../../../types/redux';
import type { ValidationError } from '../types';
import type { Validator } from './Validator';

export class MissingCodeValidator implements Validator {
  readonly id = 'missing-code';
  readonly name = 'Missing Code Check';
  readonly severity = 'warning' as const;

  validate(state: RootState): ValidationError[] {
    const warnings: ValidationError[] = [];

    state.nodes.allIds.forEach((nodeId) => {
      const node = state.nodes.byId[nodeId];
      if (node) {
        const code = node.functionCode?.trim() || '';
        if (!code) {
          warnings.push({
            id: `warning-no-code-${nodeId}`,
            severity: 'warning',
            componentId: nodeId,
            componentType: 'node',
            message: `Node "${node.name}" has no function code`,
            suggestion: 'Add Python code for this node or it will need to be implemented later',
          });
        }
      }
    });

    return warnings;
  }
}
