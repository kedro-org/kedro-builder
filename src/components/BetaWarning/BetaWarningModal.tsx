import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { acknowledgeBetaWarning } from '../../features/ui/uiSlice';
import './BetaWarningModal.scss';

export const BetaWarningModal = () => {
  const dispatch = useAppDispatch();
  const showBetaWarning = useAppSelector((state) => state.ui.showBetaWarning);

  useEffect(() => {
    if (showBetaWarning) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBetaWarning]);

  const handleContinue = () => {
    dispatch(acknowledgeBetaWarning());
  };

  if (!showBetaWarning) return null;

  return (
    <div className="beta-warning-modal">
      <div className="beta-warning-modal__backdrop" />
      <div className="beta-warning-modal__container">
        <div className="beta-warning-modal__content">
          {/* Title */}
          <h2 className="beta-warning-modal__title">
            Welcome to Kedro Builder
            <span className="beta-warning-modal__badge">BETA</span>
          </h2>

          {/* Warning Content */}
          <div className="beta-warning-modal__warning">
            <h3 className="beta-warning-modal__warning-title">
              Important: This Tool is in Beta Testing
            </h3>
            <ul className="beta-warning-modal__list">
              <li>
                <strong>Internal Testing Only:</strong> Kedro Builder is currently in active
                development and testing phase.
              </li>
              <li>
                <strong>Not for Production Use:</strong> This tool is NOT intended for client
                development projects or production deployments.
              </li>
              <li>
                <strong>Your Feedback Matters:</strong> We encourage you to explore and
                experiment. Share your feedback using the feedback button on the right side of the
                screen.
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <p className="beta-warning-modal__disclaimer">
            By continuing, you acknowledge this is for internal testing only.
          </p>

          {/* Action Button */}
          <div className="beta-warning-modal__actions">
            <button
              className="beta-warning-modal__button beta-warning-modal__button--primary"
              onClick={handleContinue}
            >
              I Understand, Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
