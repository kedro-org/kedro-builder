import React from 'react';
import { Check } from 'lucide-react';
import type { WizardStep } from './ExportWizard';

interface StepIndicatorProps {
  currentStep: WizardStep;
  validationPassed: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  validationPassed,
}) => {
  const step1Status = currentStep === 'validation' ? 'active' : validationPassed ? 'complete' : 'error';
  const step2Status = currentStep === 'configure' ? 'active' : 'pending';

  return (
    <div className="export-wizard__steps">
      {/* Step 1: Validation */}
      <div className={`export-wizard__step export-wizard__step--${step1Status}`}>
        <div className="export-wizard__step-indicator">
          <span>1</span>
        </div>
        <div className="export-wizard__step-label">
          <span className="export-wizard__step-title">Validation</span>
          {step1Status === 'complete' && (
            <span className="export-wizard__step-badge export-wizard__step-badge--success">
              <Check size={12} />
              Passed
            </span>
          )}
        </div>
      </div>

      {/* Connector */}
      <div className={`export-wizard__step-connector ${step2Status === 'active' ? 'export-wizard__step-connector--active' : ''}`} />

      {/* Step 2: Review & Export */}
      <div className={`export-wizard__step export-wizard__step--${step2Status}`}>
        <div className="export-wizard__step-indicator">
          <span>2</span>
        </div>
        <div className="export-wizard__step-label">
          <span className="export-wizard__step-title">Review & Export</span>
        </div>
      </div>
    </div>
  );
};
