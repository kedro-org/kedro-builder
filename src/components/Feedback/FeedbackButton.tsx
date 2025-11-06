import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import './FeedbackButton.scss';

interface FeedbackButtonProps {
  showConfigPanel: boolean;
}

/**
 * Floating feedback button component
 * Appears on the right side, vertically centered
 * Hides when config panel is open
 */
export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ showConfigPanel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  // Hide button when config panel is open
  if (showConfigPanel) {
    return null;
  }

  return (
    <>
      <button
        className="feedback-button"
        onClick={handleOpen}
        title="Send feedback"
        aria-label="Send feedback"
      >
        <MessageSquareText size={18} />
        <span className="feedback-button__text">Feedback</span>
      </button>

      <FeedbackModal isOpen={isModalOpen} onClose={handleClose} />
    </>
  );
};
