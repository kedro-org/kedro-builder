import React from 'react';
import { Trash2, Copy, X } from 'lucide-react';
import { Button } from '../../UI/Button/Button';
import './BulkActionsToolbar.scss';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedType: 'nodes' | 'edges' | 'mixed';
  onDelete: () => void;
  onDuplicate?: () => void;
  onClear: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  selectedType,
  onDelete,
  onDuplicate,
  onClear,
}) => {
  // Show toolbar for:
  // - Multiple items (nodes/datasets/edges)
  // - Single edge (exception: edges don't have config panel)
  if (selectedCount === 0) return null;
  if (selectedCount === 1 && selectedType !== 'edges') return null;

  return (
    <div className="bulk-actions-toolbar">
      <div className="bulk-actions-toolbar__info">
        <span className="bulk-actions-toolbar__count">{selectedCount}</span>
        <span className="bulk-actions-toolbar__label">
          {selectedType === 'nodes' ? 'node' : selectedType === 'edges' ? 'edge' : 'item'}
          {selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="bulk-actions-toolbar__actions">
        {selectedType === 'nodes' && onDuplicate && (
          <Button
            variant="ghost"
            onClick={onDuplicate}
            title="Duplicate (Cmd+D)"
          >
            <Copy size={16} />
            Duplicate
          </Button>
        )}

        <Button
          variant="danger"
          onClick={onDelete}
          title="Delete (Delete/Backspace)"
        >
          <Trash2 size={16} />
          Delete
        </Button>

        <button
          className="bulk-actions-toolbar__close"
          onClick={onClear}
          title="Clear selection (Esc)"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
