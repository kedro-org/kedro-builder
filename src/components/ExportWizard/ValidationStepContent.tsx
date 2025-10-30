import React, { useState, useEffect } from 'react';
import type { ValidationResult } from '../../utils/validation';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ValidationItem } from '../ValidationPanel/ValidationItem';

interface ValidationStepContentProps {
  validationResult: ValidationResult;
  onContinue: () => void;
  onClose: () => void;
}

export const ValidationStepContent: React.FC<ValidationStepContentProps> = ({
  validationResult,
  onContinue,
  onClose,
}) => {
  const { errors, warnings } = validationResult;

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isClean = !hasErrors && !hasWarnings;

  // Toggle state for errors/warnings tabs
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings'>(hasErrors ? 'errors' : 'warnings');

  // Automatically switch to warnings tab when errors are fixed but warnings remain
  useEffect(() => {
    if (!hasErrors && hasWarnings && activeTab === 'errors') {
      setActiveTab('warnings');
    }
  }, [hasErrors, hasWarnings, activeTab]);

  return (
    <div className="export-wizard__validation">
      {/* Success State */}
      {isClean && (
        <div className="export-wizard__validation-success">
          <CheckCircle size={48} />
          <h3>Validation Passed!</h3>
          <p>Your pipeline is ready to export with no issues.</p>
        </div>
      )}

      {/* Toggle Buttons (only show if there are errors or warnings) */}
      {(hasErrors || hasWarnings) && (
        <>
          <div className="export-wizard__validation-toggle">
            {hasErrors && (
              <button
                className={`export-wizard__validation-toggle-btn ${activeTab === 'errors' ? 'export-wizard__validation-toggle-btn--active export-wizard__validation-toggle-btn--errors' : ''}`}
                onClick={() => setActiveTab('errors')}
              >
                <XCircle size={16} />
                Errors ({errors.length})
              </button>
            )}
            {hasWarnings && (
              <button
                className={`export-wizard__validation-toggle-btn ${activeTab === 'warnings' ? 'export-wizard__validation-toggle-btn--active export-wizard__validation-toggle-btn--warnings' : ''}`}
                onClick={() => setActiveTab('warnings')}
              >
                <AlertTriangle size={16} />
                Warnings ({warnings.length})
              </button>
            )}
          </div>

          {/* Cannot Export Message (only for errors) */}
          {hasErrors && activeTab === 'errors' && (
            <div className="export-wizard__validation-message export-wizard__validation-message--error">
              Cannot Export - Fix these issues before exporting. Click on an error to view the component.
            </div>
          )}

          {/* Warning Message (only for warnings) */}
          {hasWarnings && activeTab === 'warnings' && (
            <div className="export-wizard__validation-message export-wizard__validation-message--warning">
              Review these warnings before exporting. Click on a warning to view the component.
            </div>
          )}

          {/* Validation Items List */}
          <div className="export-wizard__validation-list">
            {activeTab === 'errors' && errors.map((error) => (
              <ValidationItem key={error.id} issue={error} />
            ))}
            {activeTab === 'warnings' && warnings.map((warning) => (
              <ValidationItem key={warning.id} issue={warning} />
            ))}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="export-wizard__actions">
        <button
          className="export-wizard__button export-wizard__button--secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="export-wizard__button export-wizard__button--primary"
          onClick={onContinue}
          disabled={hasErrors}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
