import { memo } from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { CANVAS } from '@/constants/canvas';
import './CustomEdge.scss';

export const CustomEdge = memo<EdgeProps>(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    selected,
    markerEnd,
  }) => {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? 'var(--color-primary)' : 'var(--color-connection)',
          strokeWidth: selected ? CANVAS.EDGE.STROKE_WIDTH_SELECTED : CANVAS.EDGE.STROKE_WIDTH_DEFAULT,
        }}
        className={`custom-edge ${selected ? 'custom-edge--selected' : ''}`}
      />
    );
  }
);

CustomEdge.displayName = 'CustomEdge';
