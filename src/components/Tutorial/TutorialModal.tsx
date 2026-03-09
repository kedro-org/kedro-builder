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
  const Icon = step && typeof step.icon !== 'string' ? step.icon : null;
  const iconPath = step && typeof step.icon === 'string' ? step.icon : null;

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
    if (currentStep === tutorialSteps.length) {
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
  if (!step) return null;

  return (
    <div className="tutorial-modal">
      <div className="tutorial-modal__backdrop" onClick={handleSkip} />
      <div className="tutorial-modal__container">
        <div className="tutorial-modal__content">
          {/* Left Panel */}
          <div className="tutorial-modal__left">
            {/* Header - Hidden for step 1 (beta slide) */}
            {currentStep !== 1 && (
              <header className="tutorial-modal__header">
                <h2 className="tutorial-modal__main-title">Introduction to Kedro</h2>
              </header>
            )}

            {/* Progress Indicators - Hidden for step 1 (beta slide) */}
            {currentStep !== 1 && (
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
            )}

            {/* Step Content */}
            <div className="tutorial-modal__step-content">
              {currentStep === 1 ? (
                // Beta slide with custom title and beta tag
                <>
                  <h3 className="tutorial-modal__step-title">
                    Kedro's Pipeline Builder{' '}
                    <span className="tutorial-modal__beta-tag">BETA</span>
                  </h3>
                  <div className="tutorial-modal__step-description">
                    <p><strong>Welcome to Kedro's Pipeline Builder!</strong></p>
                    <p>
                      We are currently in an <strong>internal testing phase</strong> for McKinsey colleagues,
                      and this feature is <strong>not yet intended for client development projects</strong>.
                      After trying it out, we encourage you to share your thoughts using our feedback form on the right.
                    </p>
                  </div>
                </>
              ) : (
                // Regular slides
                <>
                  <h3 className="tutorial-modal__step-title">{step.title}</h3>
                  <p className="tutorial-modal__step-description">{step.content}</p>
                </>
              )}
              {/* Kedro docs link - Hidden for step 1 (beta slide) */}
              {currentStep !== 1 && (
                <a
                  href="https://docs.kedro.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tutorial-modal__docs-link"
                >
                  View Kedro documentation →
                </a>
              )}
            </div>

            {/* Action Buttons */}
            <div className="tutorial-modal__actions">
              <div className="tutorial-modal__actions-left">
                {/* Skip button - Hidden for step 1 (beta slide) */}
                {currentStep !== 1 && (
                  <button
                    className="tutorial-modal__button tutorial-modal__button--skip"
                    onClick={handleSkip}
                  >
                    Skip tutorial
                  </button>
                )}
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

          {/* Right Panel - Icon or Kedro Logo */}
          <div className="tutorial-modal__right">
            <button
              className="tutorial-modal__close"
              onClick={handleSkip}
              aria-label="Close tutorial"
            >
              <X size={20} />
            </button>
            {currentStep === 1 ? (
              // Kedro Logo for beta slide
              <div className="tutorial-modal__logo-container">
                <svg className="tutorial-modal__kedro-logo" viewBox="0 0 32 32" fill="none">
                  <path d="M16 0L6.55651e-07 16L16 32L32 16L16 0Z" fill="var(--color-kedro-yellow)" />
                </svg>
              </div>
            ) : (
              // Icon for other slides
              <div className={`tutorial-modal__icon-container ${currentStep === tutorialSteps.length ? 'tutorial-modal__icon-container--template' : ''}`}>
                {iconPath ? (
                  <img src={iconPath} alt={step.title} className="tutorial-modal__icon" />
                ) : Icon ? (
                  <Icon className="tutorial-modal__icon" size={80} strokeWidth={1.5} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
