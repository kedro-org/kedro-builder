import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  nextWalkthroughStep,
  prevWalkthroughStep,
  completeWalkthrough,
  skipWalkthrough,
} from '../../features/ui/uiSlice';
import { walkthroughSteps } from './walkthroughContent';
import { useWalkthroughPosition } from './hooks/useWalkthroughPosition';
import { WalkthroughCard } from './WalkthroughCard';
import './WalkthroughOverlay.scss';

export const WalkthroughOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const currentStep = useSelector((state: RootState) => state.ui.walkthroughStep);

  const step = walkthroughSteps[currentStep - 1];
  const isLastStep = currentStep === walkthroughSteps.length;

  // Get positions from custom hook
  const { circlePosition, tooltipPosition } = useWalkthroughPosition(step);

  const handleNext = () => {
    if (isLastStep) {
      dispatch(completeWalkthrough());
    } else {
      dispatch(nextWalkthroughStep());
    }
  };

  const handleBack = () => {
    dispatch(prevWalkthroughStep());
  };

  const handleSkip = () => {
    dispatch(skipWalkthrough());
  };

  const isModal = step.target === null;

  return (
    <div className="walkthrough-overlay">
      {/* Semi-transparent backdrop */}
      <div className="walkthrough-overlay__backdrop" />

      {/* Animated spotlight circle */}
      {circlePosition && (
        <div
          className="walkthrough-overlay__spotlight"
          style={{
            left: `${circlePosition.x}px`,
            top: `${circlePosition.y}px`,
            width: `${circlePosition.width}px`,
            height: `${circlePosition.height}px`,
          }}
        />
      )}

      {/* Walkthrough card (tooltip or center modal) */}
      {(isModal || tooltipPosition) && (
        <WalkthroughCard
          step={step}
          currentStep={currentStep}
          totalSteps={walkthroughSteps.length}
          isLastStep={isLastStep}
          isModal={isModal}
          position={tooltipPosition}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
};
