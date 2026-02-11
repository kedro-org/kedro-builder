import { Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { CANVAS } from '@/constants/canvas';
import './CanvasControls.scss';

interface CanvasControlsProps {
  getNodeColor: (node: Node) => string;
}

/**
 * Extracted component for ReactFlow canvas controls (background, zoom, minimap)
 */
export const CanvasControls = ({ getNodeColor }: CanvasControlsProps) => {
  return (
    <>
      <Background
        variant={BackgroundVariant.Dots}
        gap={CANVAS.BACKGROUND.DOT_GAP}
        size={CANVAS.BACKGROUND.DOT_SIZE}
        color="var(--color-canvas-dot)"
      />
      <Controls showZoom showFitView showInteractive={false} position="bottom-left" />
      <MiniMap
        nodeColor={getNodeColor}
        maskColor="var(--color-minimap-mask)"
        className="canvas-controls__minimap"
        position="bottom-right"
      />
    </>
  );
};
