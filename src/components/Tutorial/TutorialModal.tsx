import { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { completeTutorial, nextTutorialStep, prevTutorialStep } from '../../features/ui/uiSlice';
import { tutorialSteps } from './tutorialContent';
import './TutorialModal.scss';

export const TutorialModal = () => {
  const dispatch = useAppDispatch();
  const showTutorial = useAppSelector((state) => state.ui.showTutorial);
  const currentStep = useAppSelector((state) => state.ui.tutorialStep);

  const step = tutorialSteps[currentStep - 1];
  const Icon = step.icon;

  useEffect(() => {
    if (showTutorial) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTutorial]);

  const handleNext = () => {
    if (currentStep === 5) {
      dispatch(completeTutorial());
    } else {
      dispatch(nextTutorialStep());
    }
  };

  const handleBack = () => {
    dispatch(prevTutorialStep());
  };

  const handleSkip = () => {
    dispatch(completeTutorial());
  };

  if (!showTutorial) return null;

  return (
    <div className="tutorial-modal">
      <div className="tutorial-modal__backdrop" onClick={handleSkip} />
      <div className="tutorial-modal__container">
        <div className="tutorial-modal__content">
          {/* Left Panel */}
          <div className="tutorial-modal__left">
            <header className="tutorial-modal__header">
              <h2 className="tutorial-modal__main-title">Introduction to Kedro</h2>
              <button
                className="tutorial-modal__close"
                onClick={handleSkip}
                aria-label="Close tutorial"
              >
                <X size={20} />
              </button>
            </header>

            {/* Progress Indicators */}
            <div className="tutorial-modal__progress">
              {tutorialSteps.map((s, index) => (
                <div
                  key={s.id}
                  className={`tutorial-modal__progress-dot ${
                    index + 1 === currentStep
                      ? 'tutorial-modal__progress-dot--active'
                      : index + 1 < currentStep
                      ? 'tutorial-modal__progress-dot--completed'
                      : ''
                  }`}
                />
              ))}
            </div>

            {/* Step Content */}
            <div className="tutorial-modal__step-content">
              <h3 className="tutorial-modal__step-title">{step.title}</h3>
              <p className="tutorial-modal__step-description">{step.content}</p>
            </div>

            {/* Action Buttons */}
            <div className="tutorial-modal__actions">
              <div className="tutorial-modal__actions-left">
                <button
                  className="tutorial-modal__button tutorial-modal__button--skip"
                  onClick={handleSkip}
                >
                  Skip tutorial
                </button>
              </div>
              <div className="tutorial-modal__actions-right">
                {currentStep > 1 && (
                  <button
                    className="tutorial-modal__button tutorial-modal__button--back"
                    onClick={handleBack}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                )}
                <button
                  className="tutorial-modal__button tutorial-modal__button--primary"
                  onClick={handleNext}
                >
                  {step.buttonText}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Icon */}
          <div className="tutorial-modal__right">
            <div className="tutorial-modal__icon-container">
              <Icon className="tutorial-modal__icon" size={80} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
