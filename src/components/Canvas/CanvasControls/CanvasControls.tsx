import { Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react';
import type { Node } from '@xyflow/react';

interface CanvasControlsProps {
  theme: 'light' | 'dark';
  getNodeColor: (node: Node) => string;
}

/**
 * Extracted component for ReactFlow canvas controls (background, zoom, minimap)
 */
export const CanvasControls = ({ theme, getNodeColor }: CanvasControlsProps) => {
  return (
    <>
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.5}
        color={theme === 'dark' ? '#3a3a3a' : '#d0d0d0'}
      />
      <Controls showZoom showFitView showInteractive={false} position="bottom-left" />
      <MiniMap
        nodeColor={getNodeColor}
        maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'}
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border-line)',
          borderRadius: '4px',
        }}
        position="bottom-right"
      />
    </>
  );
};
