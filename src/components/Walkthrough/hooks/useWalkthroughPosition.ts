import { useState, useCallback, useEffect } from 'react';
import type { WalkthroughStep } from '../walkthroughContent';

interface CirclePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  x: number;
  y: number;
}

const TOOLTIP_WIDTH = 400;
const TOOLTIP_HEIGHT = 200;
const SPOTLIGHT_PADDING = 10;
const MAX_SPOTLIGHT_DIAMETER = 150;
const TOOLTIP_OFFSET = 30;

/**
 * Custom hook to calculate positions for walkthrough spotlight and tooltip
 */
export const useWalkthroughPosition = (step: WalkthroughStep) => {
  const [circlePosition, setCirclePosition] = useState<CirclePosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  const calculateTooltipPosition = useCallback(
    (rect: DOMRect): TooltipPosition => {
      let tooltipX = 0;
      let tooltipY = 0;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      switch (step.position) {
        case 'right':
          tooltipX = rect.right + TOOLTIP_OFFSET;
          tooltipY = rect.top + rect.height / 2;
          // Check if tooltip goes off screen right
          if (tooltipX + TOOLTIP_WIDTH > windowWidth) {
            tooltipX = rect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
          }
          break;

        case 'bottom':
          tooltipX = rect.left + rect.width / 2;
          tooltipY = rect.bottom + TOOLTIP_OFFSET;
          // Check if tooltip goes off screen bottom
          if (tooltipY + TOOLTIP_HEIGHT > windowHeight) {
            tooltipY = rect.top - TOOLTIP_HEIGHT - TOOLTIP_OFFSET;
          }
          // Check if tooltip goes off screen right
          if (tooltipX + TOOLTIP_WIDTH / 2 > windowWidth) {
            tooltipX = windowWidth - TOOLTIP_WIDTH / 2 - 20;
          }
          break;

        case 'left':
          tooltipX = rect.left - TOOLTIP_OFFSET;
          tooltipY = rect.top + rect.height / 2;
          // Check if tooltip goes off screen left
          if (tooltipX - TOOLTIP_WIDTH < 0) {
            tooltipX = rect.right + TOOLTIP_OFFSET;
          }
          break;

        case 'top':
          tooltipX = rect.left + rect.width / 2;
          tooltipY = rect.top - TOOLTIP_OFFSET;
          // Check if tooltip goes off screen top
          if (tooltipY - TOOLTIP_HEIGHT < 0) {
            tooltipY = rect.bottom + TOOLTIP_OFFSET;
          }
          break;

        default:
          tooltipX = rect.left + rect.width / 2;
          tooltipY = rect.bottom + TOOLTIP_OFFSET;
      }

      return { x: tooltipX, y: tooltipY };
    },
    [step.position]
  );

  const updatePositions = useCallback(() => {
    if (!step.target) {
      // Center modal - no spotlight or specific positioning
      setCirclePosition(null);
      setTooltipPosition(null);
      return;
    }

    const targetElement = document.querySelector(`[data-walkthrough="${step.target}"]`);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();

      // Circle position (center of target element)
      // Use the larger dimension to ensure it's a perfect circle
      const diameter = Math.min(Math.max(rect.width, rect.height) + SPOTLIGHT_PADDING, MAX_SPOTLIGHT_DIAMETER);

      setCirclePosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: diameter,
        height: diameter,
      });

      // Tooltip position
      setTooltipPosition(calculateTooltipPosition(rect));
    }
  }, [step.target, calculateTooltipPosition]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  return {
    circlePosition,
    tooltipPosition,
  };
};
