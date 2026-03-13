import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { ValidationError } from '../../validation';
import { selectNode } from '../../features/nodes/nodesSlice';
import { selectDataset } from '../../features/datasets/datasetsSlice';
import { openConfigPanel } from '../../features/ui/uiSlice';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { TIMING } from '../../constants/timing';
import { CANVAS } from '../../constants/canvas';
import { dispatchFocusNode } from '../../constants';
import './ValidationItem.scss';

interface ValidationItemProps {
  issue: ValidationError;
}

export const ValidationItem: React.FC<ValidationItemProps> = ({ issue }) => {
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.nodes.byId);
  const datasets = useSelector((state: RootState) => state.datasets.byId);

  const handleClick = () => {
    if (issue.componentType === 'node' && nodes[issue.componentId]) {
      dispatch(selectNode(issue.componentId));
      dispatch(openConfigPanel({ type: 'node', id: issue.componentId }));

      setTimeout(() => {
        dispatchFocusNode(issue.componentId);
      }, TIMING.FOCUS_DELAY);
    } else if (issue.componentType === 'dataset' && datasets[issue.componentId]) {
      dispatch(selectDataset(issue.componentId));
      dispatch(openConfigPanel({ type: 'dataset', id: issue.componentId }));

      setTimeout(() => {
        dispatchFocusNode(issue.componentId);
      }, TIMING.FOCUS_DELAY);
    }
  };

  const getComponentName = (): string => {
    if (issue.componentType === 'node') {
      return nodes[issue.componentId]?.name || 'Unknown Node';
    } else if (issue.componentType === 'dataset') {
      return datasets[issue.componentId]?.name || 'Unknown Dataset';
    } else if (issue.componentType === 'connection') {
      return 'Connection';
    }
    return 'Pipeline';
  };

  const isClickable = issue.componentType === 'node' || issue.componentType === 'dataset';

  return (
    <div
      className={`validation-item validation-item--${issue.severity} ${
        isClickable ? 'validation-item--clickable' : ''
      }`}
      onClick={isClickable ? handleClick : undefined}
    >
      <div className="validation-item__icon">
        {issue.severity === 'error' ? (
          <AlertCircle size={CANVAS.ICON_SIZE.MEDIUM} />
        ) : (
          <AlertTriangle size={CANVAS.ICON_SIZE.MEDIUM} />
        )}
      </div>

      <div className="validation-item__content">
        <div className="validation-item__header">
          <span className="validation-item__component-type">
            {issue.componentType}
          </span>
          <span className="validation-item__component-name">
            {getComponentName()}
          </span>
        </div>
        <p className="validation-item__message">{issue.message}</p>
        {issue.suggestion && (
          <div className="validation-item__suggestion">
            <Info size={CANVAS.ICON_SIZE.SMALL} />
            <span>{issue.suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
};
