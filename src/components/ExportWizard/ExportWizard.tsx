import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../types/redux';
import type { ValidationResult } from '../../utils/validation';
import { X, GripHorizontal } from 'lucide-react';
import { StepIndicator } from './StepIndicator';
import { ValidationStepContent } from './ValidationStepContent';
import { ConfigureStepContent } from './ConfigureStepContent';
import './ExportWizard.scss';

export type WizardStep = 'validation' | 'configure';

interface ExportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ValidationResult | null;
  onExport: (metadata: {
    projectName: string;
    pythonPackage: string;
    pipelineName: string;
    description: string;
  }) => void;
}

export const ExportWizard: React.FC<ExportWizardProps> = ({
  isOpen,
  onClose,
  validationResult,
  onExport,
}) => {
  const currentProject = useSelector((state: RootState) => state.project.current);
  const nodesCount = useSelector((state: RootState) => state.nodes.allIds.length);
  const datasetsCount = useSelector((state: RootState) => state.datasets.allIds.length);

  const [currentStep, setCurrentStep] = useState<WizardStep>('validation');
  const [projectName, setProjectName] = useState(currentProject?.name || '');
  const [panelHeight, setPanelHeight] = useState<number>(400);
  const [isDragging, setIsDragging] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      const deltaY = dragStartY.current - e.clientY; // Inverted: dragging up increases height
      const newHeight = Math.max(300, Math.min(window.innerHeight - 100, dragStartHeight.current + deltaY));
      setPanelHeight(newHeight);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  if (!isOpen || !currentProject || !validationResult) return null;

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;

  const handleContinue = () => {
    if (!hasErrors) {
      setCurrentStep('configure');
    }
  };

  const handleBack = () => {
    setCurrentStep('validation');
  };

  const handleConfirmExport = () => {
    // Auto-generate python package from project name
    const pythonPackage = projectName.replace(/-/g, '_').toLowerCase();

    onExport({
      projectName,
      pythonPackage,
      pipelineName: currentProject.pipelineName || '__default__',
      description: '', // No longer collected in UI
    });
  };

  return (
    <div
      ref={panelRef}
      className={`export-wizard export-wizard--step-${currentStep} ${isDragging ? 'export-wizard--dragging' : ''}`}
      style={{ height: `${panelHeight}px` }}
    >
      {/* Drag Handle */}
      <div
        className="export-wizard__drag-handle"
        onMouseDown={handleDragStart}
        aria-label="Drag to resize"
      >
        <GripHorizontal size={20} />
      </div>

      {/* Header with close button */}
      <div className="export-wizard__header">
        <h2 className="export-wizard__title">Export Kedro Project</h2>
        <button
          className="export-wizard__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Body with Steps and Content */}
      <div className="export-wizard__body">
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          validationPassed={!hasErrors}
        />

        {/* Step Content */}
        <div className="export-wizard__content">
          {currentStep === 'validation' && (
            <ValidationStepContent
              validationResult={validationResult}
              onContinue={handleContinue}
              onClose={onClose}
            />
          )}

          {currentStep === 'configure' && (
            <ConfigureStepContent
              projectName={projectName}
              nodesCount={nodesCount}
              datasetsCount={datasetsCount}
              hasWarnings={hasWarnings}
              warningsCount={validationResult.warnings.length}
              onProjectNameChange={setProjectName}
              onBack={handleBack}
              onExport={handleConfirmExport}
            />
          )}
        </div>
      </div>
    </div>
  );
};
