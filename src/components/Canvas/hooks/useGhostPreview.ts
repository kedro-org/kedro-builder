import { useState, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { isNodeId } from '@/domain/IdGenerator';

export interface GhostPreviewState {
  sourceId: string;
  sourceType: 'node' | 'dataset';
  position: { x: number; y: number };
}

interface CachedBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const PROXIMITY_THRESHOLD = 80; // pixels

/**
 * Custom hook for managing ghost preview during connection drag
 * Shows a preview of what component will be created when dropping on empty canvas
 */
export const useGhostPreview = (connectionSource: string | null) => {
  const [ghostPreview, setGhostPreview] = useState<GhostPreviewState | null>(null);
  const { getNodes, getViewport, flowToScreenPosition } = useReactFlow();

  // Cache node screen bounds at drag start — zero DOM queries on mousemove
  const cachedBoundsRef = useRef<CachedBounds[]>([]);

  useEffect(() => {
    if (!connectionSource) {
      setGhostPreview(null);
      cachedBoundsRef.current = [];
      return;
    }

    // Snapshot node bounds once at drag start using ReactFlow's in-memory state.
    // flowToScreenPosition handles pan + zoom + container offset, giving true screen coords.
    const { zoom } = getViewport();
    cachedBoundsRef.current = getNodes().map((node) => {
      const w = (node.measured?.width ?? 0) * zoom;
      const h = (node.measured?.height ?? 0) * zoom;
      const screenTopLeft = flowToScreenPosition({ x: node.position.x, y: node.position.y });
      return {
        left: screenTopLeft.x,
        top: screenTopLeft.y,
        right: screenTopLeft.x + w,
        bottom: screenTopLeft.y + h,
      };
    });

    const handleMouseMove = (e: MouseEvent) => {
      // O(1) ref read — no DOM query per frame
      const isNear = cachedBoundsRef.current.some((b) => {
        const closestX = Math.max(b.left, Math.min(e.clientX, b.right));
        const closestY = Math.max(b.top, Math.min(e.clientY, b.bottom));
        const dx = e.clientX - closestX;
        const dy = e.clientY - closestY;
        return Math.sqrt(dx * dx + dy * dy) < PROXIMITY_THRESHOLD;
      });

      if (isNear) {
        setGhostPreview(null);
        return;
      }

      const sourceType = isNodeId(connectionSource) ? 'node' : 'dataset';
      setGhostPreview({
        sourceId: connectionSource,
        sourceType,
        position: { x: e.clientX, y: e.clientY },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [connectionSource, getNodes, getViewport, flowToScreenPosition]);

  return ghostPreview;
};
