import { useState } from 'react';
import { X } from 'lucide-react';
import { trackEvent } from '../../utils/telemetry';
import { store } from '../../store';
import toast from 'react-hot-toast';
import './FeedbackModal.scss';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SatisfactionLevel = 1 | 2 | 3 | 4 | 5;

const EMOJI_RATINGS = [
  { value: 1, emoji: '😠', label: 'Very unsatisfied' },
  { value: 2, emoji: '🙁', label: 'Unsatisfied' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Satisfied' },
  { value: 5, emoji: '😃', label: 'Very satisfied' },
] as const;

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel | null>(null);
  const [isUseful, setIsUseful] = useState<'yes' | 'no' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!satisfaction) {
      toast.error('Please select a satisfaction level');
      return;
    }

    setIsSubmitting(true);

    try {
      const state = store.getState();

      // Track feedback submission via Heap Analytics
      trackEvent('feedback_submitted', {
        satisfaction,
        isUseful,
        comment: comment.trim(),
        hasProject: state.ui.hasActiveProject,
      });

      // Show success message
      toast.success('Thank you for your feedback!', {
        duration: 4000,
        position: 'bottom-right',
      });

      // Reset and close
      setSatisfaction(null);
      setIsUseful(null);
      setComment('');
      onClose();
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (satisfaction || isUseful || comment.trim()) {
      trackEvent('feedback_cancelled', {
        hadPartialData: true,
      });
    }
    onClose();
  };

  return (
    <div className="feedback-modal">
      <div className="feedback-modal__overlay" onClick={handleClose} />
      <div className="feedback-modal__content">
        <button
          className="feedback-modal__close"
          onClick={handleClose}
          aria-label="Close feedback form"
          type="button"
        >
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit} className="feedback-modal__form">
          <h2 className="feedback-modal__title">
            How satisfied are you with Kedro Builder?
          </h2>

          {/* Emoji Rating */}
          <div className="feedback-modal__rating">
            {EMOJI_RATINGS.map((rating) => (
              <button
                key={rating.value}
                type="button"
                className={`feedback-modal__emoji ${
                  satisfaction === rating.value ? 'feedback-modal__emoji--selected' : ''
                }`}
                onClick={() => setSatisfaction(rating.value)}
                title={rating.label}
                aria-label={rating.label}
              >
                <span className="feedback-modal__emoji-icon">{rating.emoji}</span>
              </button>
            ))}
          </div>

          {satisfaction && (
            <p className="feedback-modal__rating-label">
              {EMOJI_RATINGS.find((r) => r.value === satisfaction)?.label}
            </p>
          )}

          {/* Usefulness Question */}
          <div className="feedback-modal__question">
            <label className="feedback-modal__question-label">
              Is this visual way of creating Kedro projects useful?
            </label>
            <div className="feedback-modal__radio-group">
              <label className="feedback-modal__radio">
                <input
                  type="radio"
                  name="useful"
                  checked={isUseful === 'yes'}
                  onChange={() => setIsUseful('yes')}
                />
                <span>Yes</span>
              </label>
              <label className="feedback-modal__radio">
                <input
                  type="radio"
                  name="useful"
                  checked={isUseful === 'no'}
                  onChange={() => setIsUseful('no')}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Comment Textarea */}
          <textarea
            className="feedback-modal__textarea"
            placeholder="Tell us more about your experience... (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            maxLength={1000}
          />

          {/* Submit Button */}
          <button
            type="submit"
            className="feedback-modal__submit"
            disabled={!satisfaction || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};
