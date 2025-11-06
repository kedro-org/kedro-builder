import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import './FeedbackButton.scss';

/**
 * Floating feedback button component
 * Appears in bottom-right corner for easy access
 */
export const FeedbackButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        className="feedback-button"
        onClick={handleOpen}
        title="Send feedback"
        aria-label="Send feedback"
      >
        <MessageSquareText size={24} />
      </button>

      <FeedbackModal isOpen={isModalOpen} onClose={handleClose} />
    </>
  );
};
