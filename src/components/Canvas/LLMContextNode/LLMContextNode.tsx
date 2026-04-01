import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import classNames from 'classnames';
import { Brain } from 'lucide-react';
import type { KedroNode } from '@/types/kedro';
import { useAppSelector } from '@/store/hooks';
import { makeSelectNodeValidationStatus } from '@/features/validation/validationSelectors';
import { UNNAMED_NODE_DEFAULT } from '@/constants/ui';
import './LLMContextNode.scss';

export const LLMContextNode = memo<NodeProps>(({ data, selected }) => {
  const nodeData = data as KedroNode;

  const selectValidation = useMemo(() => makeSelectNodeValidationStatus(nodeData.id), [nodeData.id]);
  const { hasError, hasWarning } = useAppSelector(selectValidation);

  const providerLabel = (nodeData.llmProvider ?? 'openai').charAt(0).toUpperCase() +
    (nodeData.llmProvider ?? 'openai').slice(1);
  const promptCount = (nodeData.promptNames ?? []).filter((p) => p.trim().length > 0).length;
  const subtitle = [
    providerLabel,
    nodeData.modelName ?? 'No model',
    `${promptCount} prompt${promptCount !== 1 ? 's' : ''}`,
  ].join(' \u00B7 ');

  const nodeClasses = classNames(
    'llm-context-node',
    {
      'llm-context-node--selected': selected,
      'llm-context-node--unnamed': !nodeData.name || nodeData.name.trim() === '',
      'llm-context-node--error': hasError,
      'llm-context-node--warning': !hasError && hasWarning,
    }
  );

  return (
    <div className={nodeClasses}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="llm-context-node__handle llm-context-node__handle--top"
      />

      <div className="llm-context-node__content">
        <div className="llm-context-node__icon">
          <Brain size={20} />
        </div>
        <div className="llm-context-node__info">
          <h4 className="llm-context-node__name">
            {nodeData.name && nodeData.name.trim() !== '' ? nodeData.name : UNNAMED_NODE_DEFAULT}
          </h4>
          <span className="llm-context-node__subtitle">{subtitle}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="llm-context-node__handle llm-context-node__handle--bottom"
      />
    </div>
  );
});

LLMContextNode.displayName = 'LLMContextNode';
