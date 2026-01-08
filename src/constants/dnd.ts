/**
 * Drag and Drop MIME Type Constants
 *
 * Centralizes the MIME types used for drag-and-drop operations.
 * These are used when dragging components from the palette to the canvas.
 *
 * IMPORTANT: Do NOT change these values - they are used to identify
 * what type of component is being dragged.
 */

export const DND_TYPES = {
  /**
   * MIME type for dragging node components
   * Used by: NodeCard, ComponentPalette (node drag)
   * Consumed by: useNodeHandlers (drop handler)
   */
  NODE: 'application/kedro-builder',

  /**
   * MIME type for dragging dataset components
   * Used by: DatasetCard, ComponentPalette (dataset drag)
   * Consumed by: useNodeHandlers (drop handler)
   */
  DATASET: 'application/kedro-builder-dataset',
} as const;

/**
 * Type for DnD type values
 */
export type DndType = (typeof DND_TYPES)[keyof typeof DND_TYPES];

/**
 * Check if a drag event contains a node type
 */
export function hasNodeData(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes(DND_TYPES.NODE);
}

/**
 * Check if a drag event contains a dataset type
 */
export function hasDatasetData(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes(DND_TYPES.DATASET);
}

/**
 * Get node type from drag event
 */
export function getNodeData(dataTransfer: DataTransfer): string {
  return dataTransfer.getData(DND_TYPES.NODE);
}

/**
 * Get dataset type from drag event
 */
export function getDatasetData(dataTransfer: DataTransfer): string {
  return dataTransfer.getData(DND_TYPES.DATASET);
}

/**
 * Set node type data on drag event
 */
export function setNodeData(dataTransfer: DataTransfer, nodeType: string): void {
  dataTransfer.setData(DND_TYPES.NODE, nodeType);
}

/**
 * Set dataset type data on drag event
 */
export function setDatasetData(dataTransfer: DataTransfer, datasetType: string): void {
  dataTransfer.setData(DND_TYPES.DATASET, datasetType);
}
