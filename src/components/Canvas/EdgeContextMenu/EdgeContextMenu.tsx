import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Trash2, Tag } from 'lucide-react';
import './EdgeContextMenu.scss';

interface EdgeContextMenuProps {
  edgeId: string;
  x: number;
  y: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onAddLabel?: () => void;
}

export const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  x,
  y,
  open,
  onOpenChange,
  onDelete,
  onAddLabel,
}) => {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="edge-context-menu"
          align="start"
          sideOffset={5}
        >
          {onAddLabel && (
            <DropdownMenu.Item className="edge-context-menu__item" onSelect={onAddLabel}>
              <Tag size={16} />
              <span>Add Label</span>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="edge-context-menu__separator" />

          <DropdownMenu.Item
            className="edge-context-menu__item edge-context-menu__item--danger"
            onSelect={onDelete}
          >
            <Trash2 size={16} />
            <span>Delete Connection</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
