import React, { useMemo } from 'react';
import type { WalkthroughStep } from './walkthroughContent';

/**
 * Safely parse description text and render links as React elements
 * Only allows <a> tags with href, target, and rel attributes - all other HTML is escaped
 */
function SafeDescription({ text }: { text: string }) {
  const elements = useMemo(() => {
    // Regex to match anchor tags with attributes
    const linkRegex = /<a\s+href="([^"]+)"(?:\s+target="([^"]*)")?(?:\s+rel="([^"]*)")?\s*>([^<]+)<\/a>/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the link as a React element (safe - no innerHTML)
      const [, href, target, rel, linkText] = match;
      parts.push(
        <a
          key={key++}
          href={href}
          target={target || '_blank'}
          rel={rel || 'noopener noreferrer'}
        >
          {linkText}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last link
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  }, [text]);

  return <>{elements}</>;
}

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
        <p className="walkthrough-overlay__description">
          <SafeDescription text={step.description} />
        </p>
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
