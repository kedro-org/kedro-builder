import React from 'react';
import type { WalkthroughStep } from './walkthroughContent';

interface WalkthroughCardProps {
  step: WalkthroughStep;
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  isModal: boolean;
  position?: { x: number; y: number } | null;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

/**
 * Reusable card component for walkthrough tooltip or modal
 */
export const WalkthroughCard: React.FC<WalkthroughCardProps> = ({
  step,
  currentStep,
  totalSteps,
  isLastStep,
  isModal,
  position,
  onNext,
  onBack,
  onSkip,
}) => {
  const className = isModal
    ? 'walkthrough-overlay__modal'
    : `walkthrough-overlay__tooltip walkthrough-overlay__tooltip--${step.position}`;

  const style = !isModal && position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined;

  return (
    <div className={className} style={style}>
      <div className={isModal ? 'walkthrough-overlay__modal-header' : 'walkthrough-overlay__tooltip-header'}>
        <span className="walkthrough-overlay__step-indicator">
          {currentStep} / {totalSteps}
        </span>
      </div>

      <div className={isModal ? 'walkthrough-overlay__modal-content' : 'walkthrough-overlay__tooltip-content'}>
        <h2 className="walkthrough-overlay__title">{step.title}</h2>
        <p className="walkthrough-overlay__description">{step.description}</p>
      </div>

      <div className={isModal ? 'walkthrough-overlay__modal-footer' : 'walkthrough-overlay__tooltip-footer'}>
        <div className="walkthrough-overlay__footer-left">
          <button className="walkthrough-overlay__button walkthrough-overlay__button--skip" onClick={onSkip}>
            Skip tutorial
          </button>
          {isModal && (
            <span className="walkthrough-overlay__step-indicator-text">
              {currentStep} / {totalSteps}
            </span>
          )}
        </div>

        <div className="walkthrough-overlay__footer-right">
          {currentStep > 1 && (
            <button className="walkthrough-overlay__button walkthrough-overlay__button--back" onClick={onBack}>
              Back
            </button>
          )}
          <button className="walkthrough-overlay__button walkthrough-overlay__button--primary" onClick={onNext}>
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
