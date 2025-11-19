import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../Button/Button';
import './ConfirmDialog.scss';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-dialog__overlay" />
        <Dialog.Content className="confirm-dialog__content">
          <div className="confirm-dialog__header">
            <div className="confirm-dialog__icon confirm-dialog__icon--danger">
              <AlertTriangle size={24} />
            </div>
            <Dialog.Title className="confirm-dialog__title">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="confirm-dialog__close" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="confirm-dialog__message">
            {message}
          </Dialog.Description>

          <div className="confirm-dialog__actions">
            <Button variant="secondary" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button variant="danger" onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
