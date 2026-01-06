import { useState, useEffect, useCallback } from 'react';
import { isNodeId } from '../../../domain/IdGenerator';

export interface GhostPreviewState {
  sourceId: string;
  sourceType: 'node' | 'dataset';
  position: { x: number; y: number };
}

const PROXIMITY_THRESHOLD = 80; // pixels

/**
 * Custom hook for managing ghost preview during connection drag
 * Shows a preview of what component will be created when dropping on empty canvas
 */
export const useGhostPreview = (connectionSource: string | null) => {
  const [ghostPreview, setGhostPreview] = useState<GhostPreviewState | null>(null);

  // Check if cursor is near any existing component
  const isNearExistingComponent = useCallback((clientX: number, clientY: number): boolean => {
    const nodeElements = document.querySelectorAll('.react-flow__node');

    for (const nodeElement of nodeElements) {
      const rect = nodeElement.getBoundingClientRect();

      // Calculate distance from cursor to closest edge of node's bounding box
      const closestX = Math.max(rect.left, Math.min(clientX, rect.right));
      const closestY = Math.max(rect.top, Math.min(clientY, rect.bottom));
      const distanceX = clientX - closestX;
      const distanceY = clientY - closestY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < PROXIMITY_THRESHOLD) {
        return true;
      }
    }

    return false;
  }, []);

  // Track mouse movement during connection drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connectionSource) {
        // Hide ghost preview when cursor is near existing components
        if (isNearExistingComponent(e.clientX, e.clientY)) {
          setGhostPreview(null);
          return;
        }

        // Show ghost preview at cursor position
        const sourceType = isNodeId(connectionSource) ? 'node' : 'dataset';
        setGhostPreview({
          sourceId: connectionSource,
          sourceType,
          position: { x: e.clientX, y: e.clientY },
        });
      }
    };

    if (connectionSource) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    } else {
      setGhostPreview(null);
    }
  }, [connectionSource, isNearExistingComponent]);

  return ghostPreview;
};
