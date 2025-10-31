/**
 * Canvas-related constants for positioning and sizing
 */

export const CANVAS = {
  DEFAULT_DATASET_POSITION: { x: 400, y: 250 },
  DEFAULT_NODE_POSITION: { x: 600, y: 250 },
  ICON_SIZE: {
    SMALL: 14,
    MEDIUM: 16,
    LARGE: 20,
  },
  BACKGROUND: {
    DOT_GAP: 20,
    DOT_SIZE: 1.5,
  },
  EDGE: {
    STROKE_WIDTH_DEFAULT: 3,
    STROKE_WIDTH_SELECTED: 4,
  },
} as const;
