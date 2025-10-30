import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../types/redux';
import { setShowValidationPanel } from '../../features/ui/uiSlice';
import { clearValidation } from '../../features/validation/validationSlice';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';
import { ValidationItem } from './ValidationItem';
import './ValidationPanel.scss';

export const ValidationPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { errors, warnings } = useSelector((state: RootState) => state.validation);
  const showValidationPanel = useSelector((state: RootState) => state.ui.showValidationPanel);

  if (!showValidationPanel) return null;

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const totalIssues = errors.length + warnings.length;

  const handleClose = () => {
    dispatch(setShowValidationPanel(false));
    dispatch(clearValidation());
  };

  return (
    <div className="validation-panel">
      {/* Header */}
      <div className="validation-panel__header">
        <div className="validation-panel__title">
          {hasErrors ? (
            <AlertCircle size={20} className="validation-panel__icon validation-panel__icon--error" />
          ) : (
            <AlertTriangle size={20} className="validation-panel__icon validation-panel__icon--warning" />
          )}
          <h3>Validation Results</h3>
          <span className="validation-panel__count">
            {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'}
          </span>
        </div>
        <button
          className="validation-panel__close"
          onClick={handleClose}
          aria-label="Close validation panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Summary */}
      <div className="validation-panel__summary">
        {hasErrors && (
          <div className="validation-panel__summary-item validation-panel__summary-item--error">
            <AlertCircle size={16} />
            <span>
              {errors.length} {errors.length === 1 ? 'error' : 'errors'} (must fix before export)
            </span>
          </div>
        )}
        {hasWarnings && (
          <div className="validation-panel__summary-item validation-panel__summary-item--warning">
            <AlertTriangle size={16} />
            <span>
              {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'} (can export)
            </span>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="validation-panel__content">
        {/* Errors Section */}
        {hasErrors && (
          <div className="validation-panel__section">
            <h4 className="validation-panel__section-title validation-panel__section-title--error">
              <AlertCircle size={16} />
              Errors
            </h4>
            <div className="validation-panel__issues">
              {errors.map((error) => (
                <ValidationItem key={error.id} issue={error} />
              ))}
            </div>
          </div>
        )}

        {/* Warnings Section */}
        {hasWarnings && (
          <div className="validation-panel__section">
            <h4 className="validation-panel__section-title validation-panel__section-title--warning">
              <AlertTriangle size={16} />
              Warnings
            </h4>
            <div className="validation-panel__issues">
              {warnings.map((warning) => (
                <ValidationItem key={warning.id} issue={warning} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
