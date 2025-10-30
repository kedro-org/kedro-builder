import { EmptyState } from '../EmptyState/EmptyState';
import { BulkActionsToolbar } from '../BulkActionsToolbar/BulkActionsToolbar';

interface CanvasOverlayProps {
  isEmpty: boolean;
  isDraggingOver: boolean;
  totalSelected: number;
  selectionType: 'nodes' | 'edges' | 'mixed';
  onBulkDelete: () => void;
  onBulkClear: () => void;
}

/**
 * Extracted component for canvas overlays (empty state and bulk actions toolbar)
 */
export const CanvasOverlay = ({
  isEmpty,
  isDraggingOver,
  totalSelected,
  selectionType,
  onBulkDelete,
  onBulkClear,
}: CanvasOverlayProps) => {
  return (
    <>
      {/* Empty State - Show when no nodes or datasets */}
      {isEmpty && <EmptyState isDragging={isDraggingOver} />}

      {/* Bulk Actions Toolbar - Shows when nodes/datasets/edges are selected */}
      <BulkActionsToolbar
        selectedCount={totalSelected}
        selectedType={selectionType}
        onDelete={onBulkDelete}
        onClear={onBulkClear}
      />
    </>
  );
};
