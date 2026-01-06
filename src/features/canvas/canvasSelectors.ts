import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import { selectAllNodes } from '../nodes/nodesSelectors';
import { selectAllDatasets } from '../datasets/datasetsSelectors';
import { selectAllConnections } from '../connections/connectionsSelectors';

// Base selectors for canvas-specific state
const selectSelectedNodeIds = (state: RootState) => state.nodes.selected;
const selectSelectedEdgeIds = (state: RootState) => state.connections.selected;
const selectTheme = (state: RootState) => state.theme.theme;

/**
 * Combined selector for canvas state
 * Reduces 6 separate selector calls to 1, improving re-render performance
 */
export const selectCanvasData = createSelector(
  [
    selectAllNodes,
    selectAllDatasets,
    selectAllConnections,
    selectSelectedNodeIds,
    selectSelectedEdgeIds,
    selectTheme,
  ],
  (nodes, datasets, connections, selectedNodeIds, selectedEdgeIds, theme) => ({
    nodes,
    datasets,
    connections,
    selectedNodeIds,
    selectedEdgeIds,
    theme,
  })
);

/**
 * Selector that provides selectedNodeIds as a Set for O(1) lookups
 * This is critical for performance when checking if nodes are selected
 */
export const selectSelectedNodeIdsSet = createSelector(
  [selectSelectedNodeIds],
  (selectedIds) => new Set(selectedIds)
);

/**
 * Selector that provides selectedEdgeIds as a Set for O(1) lookups
 */
export const selectSelectedEdgeIdsSet = createSelector(
  [selectSelectedEdgeIds],
  (selectedIds) => new Set(selectedIds)
);

/**
 * Combined selector with Sets for selection checking
 * Provides both arrays (for iteration) and Sets (for lookups)
 */
export const selectCanvasDataWithSets = createSelector(
  [
    selectAllNodes,
    selectAllDatasets,
    selectAllConnections,
    selectSelectedNodeIds,
    selectSelectedEdgeIds,
    selectSelectedNodeIdsSet,
    selectSelectedEdgeIdsSet,
    selectTheme,
  ],
  (nodes, datasets, connections, selectedNodeIds, selectedEdgeIds, selectedNodeIdsSet, selectedEdgeIdsSet, theme) => ({
    nodes,
    datasets,
    connections,
    selectedNodeIds,
    selectedEdgeIds,
    selectedNodeIdsSet,
    selectedEdgeIdsSet,
    theme,
  })
);

/**
 * Selector for canvas empty state
 */
export const selectIsCanvasEmpty = createSelector(
  [selectAllNodes, selectAllDatasets],
  (nodes, datasets) => nodes.length === 0 && datasets.length === 0
);

/**
 * Selector for selection type (nodes, edges, or mixed)
 */
export const selectSelectionType = createSelector(
  [selectSelectedNodeIds, selectSelectedEdgeIds],
  (nodeIds, edgeIds): 'nodes' | 'edges' | 'mixed' => {
    if (nodeIds.length > 0 && edgeIds.length > 0) return 'mixed';
    if (nodeIds.length > 0) return 'nodes';
    if (edgeIds.length > 0) return 'edges';
    return 'nodes';
  }
);

/**
 * Selector for total selected count
 */
export const selectTotalSelected = createSelector(
  [selectSelectedNodeIds, selectSelectedEdgeIds],
  (nodeIds, edgeIds) => nodeIds.length + edgeIds.length
);
