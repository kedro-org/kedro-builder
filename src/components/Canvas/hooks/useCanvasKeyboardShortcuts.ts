import { useEffect } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { selectNodes } from '../../../features/nodes/nodesSlice';
import { closeConfigPanel } from '../../../features/ui/uiSlice';
import { useClearSelections } from '../../../hooks/useClearSelections';
import type { KedroNode, KedroDataset } from '../../../types/kedro';

interface KeyboardShortcutsProps {
  reduxNodes: KedroNode[];
  reduxDatasets: KedroDataset[];
  isPanMode: boolean;
  setIsPanMode: React.Dispatch<React.SetStateAction<boolean>>;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

/**
 * Hook for managing canvas keyboard shortcuts
 * Handles: Escape, Cmd+A, Spacebar (pan mode), Cmd+C, Cmd+V, Delete, Backspace
 */
export const useCanvasKeyboardShortcuts = ({
  reduxNodes,
  reduxDatasets,
  isPanMode,
  setIsPanMode,
  onCopy,
  onPaste,
  onDelete,
}: KeyboardShortcutsProps) => {
  const dispatch = useAppDispatch();
  const clearAllSelections = useClearSelections();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contentEditable element
      const target = event.target as HTMLElement;
      const isEditableElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Spacebar - enable pan mode (like Figma)
      // BUT: Don't intercept if user is typing in an editable field
      if (event.code === 'Space' && !isPanMode && !isEditableElement) {
        event.preventDefault();
        setIsPanMode(true);
      }

      // Escape key - clear selection and close config panel
      if (event.key === 'Escape') {
        clearAllSelections();
        dispatch(closeConfigPanel());
      }

      // Cmd/Ctrl + A - select all (only when not in an editable field)
      if ((event.metaKey || event.ctrlKey) && event.key === 'a' && !isEditableElement) {
        event.preventDefault();
        const allNodeIds = [...reduxNodes.map((n) => n.id), ...reduxDatasets.map((d) => d.id)];
        dispatch(selectNodes(allNodeIds));
      }

      // Cmd/Ctrl + C - copy selected items (only when not in an editable field)
      if ((event.metaKey || event.ctrlKey) && event.key === 'c' && !isEditableElement) {
        event.preventDefault();
        onCopy();
      }

      // Cmd/Ctrl + V - paste copied items (only when not in an editable field)
      if ((event.metaKey || event.ctrlKey) && event.key === 'v' && !isEditableElement) {
        event.preventDefault();
        onPaste();
      }

      // Delete or Backspace - delete selected items (only when not in an editable field)
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditableElement) {
        event.preventDefault();
        onDelete();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Spacebar released - disable pan mode
      if (event.code === 'Space' && isPanMode) {
        setIsPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch, clearAllSelections, reduxNodes, reduxDatasets, isPanMode, setIsPanMode, onCopy, onPaste, onDelete]);
};
