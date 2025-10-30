import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import { Database } from 'lucide-react';
import classNames from 'classnames';
import type { KedroDataset } from '../../../types/kedro';
import type { RootState } from '../../../types/redux';
import './DatasetNode.scss';

export const DatasetNode = memo<NodeProps>(({ data, selected }) => {
  const datasetData = data as KedroDataset;
  const validationErrors = useSelector((state: RootState) => state.validation.errors);
  const validationWarnings = useSelector((state: RootState) => state.validation.warnings);

  // Check if this dataset has any validation issues
  const hasError = validationErrors.some(
    (err) => err.componentId === datasetData.id && err.componentType === 'dataset'
  );
  const hasWarning = validationWarnings.some(
    (warn) => warn.componentId === datasetData.id && warn.componentType === 'dataset'
  );

  return (
    <div
      className={classNames('dataset-node', `dataset-node--${datasetData.type}`, {
        'dataset-node--selected': selected,
        'dataset-node--error': hasError,
        'dataset-node--warning': !hasError && hasWarning,
      })}
    >
      {/* Top Handle for connections from above */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="dataset-node__handle dataset-node__handle--top"
      />

      {/* Dataset content - only database icon and name */}
      <div className="dataset-node__content">
        <div className="dataset-node__icon">
          <Database size={20} />
        </div>
        <h4 className="dataset-node__name">{datasetData.name || 'Unnamed Dataset'}</h4>
      </div>

      {/* Bottom Handle for connections to below */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="dataset-node__handle dataset-node__handle--bottom"
      />
    </div>
  );
});

DatasetNode.displayName = 'DatasetNode';
