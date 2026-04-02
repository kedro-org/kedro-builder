/**
 * Missing Prompt Validator
 * Warns when an LLM context node has no prompt datasets connected
 */

import type { RootState } from '@/store';
import { type ValidationError, ValidationCode } from '../types';
import type { Validator } from './Validator';
import { PROMPT_DATASET_TYPES } from '../../constants/llm';

export class MissingPromptValidator implements Validator {
  readonly id = 'missing-prompt';
  readonly name = 'Missing Prompt Check';
  readonly severity = 'warning' as const;

  validate(state: RootState): ValidationError[] {
    const warnings: ValidationError[] = [];
    const { byId: nodesById, allIds: nodeIds } = state.nodes;
    const { byId: datasetsById } = state.datasets;
    const connections = state.connections.allIds.map((id) => state.connections.byId[id]);

    nodeIds.forEach((nodeId) => {
      const node = nodesById[nodeId];
      if (!node || node.nodeKind !== 'llm_context') return;

      const hasPrompt = connections.some((conn) => {
        if (conn.target !== node.id || !conn.source.startsWith('dataset-')) return false;
        const ds = datasetsById[conn.source];
        return ds != null && PROMPT_DATASET_TYPES.has(ds.type);
      });

      if (!hasPrompt) {
        warnings.push({
          id: `warning-missing-prompt-${nodeId}`,
          code: ValidationCode.MISSING_PROMPT,
          severity: 'warning',
          componentId: nodeId,
          componentType: 'node',
          message: `LLM context node "${node.name || 'Unnamed'}" has no prompt datasets connected`,
          suggestion: 'Connect at least one text or YAML dataset node as a prompt input',
        });
      }
    });

    return warnings;
  }
}
