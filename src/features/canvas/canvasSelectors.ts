import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import { selectAllNodes } from '../nodes/nodesSelectors';
import { selectAllDatasets } from '../datasets/datasetsSelectors';
import { selectAllConnections } from '../connections/connectionsSelectors';

// Base selectors for canvas-specific state
const selectSelectedNodeIds = (state: RootState) => state.nodes.selected;
const selectSelectedEdgeIds = (state: RootState) => state.connections.selected;

/** Selected node IDs as a Set for O(1) lookups */
export const selectSelectedNodeIdsSet = createSelector(
  [selectSelectedNodeIds],
  (selectedIds) => new Set(selectedIds)
);

/** Selected edge IDs as a Set for O(1) lookups */
export const selectSelectedEdgeIdsSet = createSelector(
  [selectSelectedEdgeIds],
  (selectedIds) => new Set(selectedIds)
);

/**
 * Combined selector for pipeline data + selection state.
 * Theme is intentionally excluded — select it separately to avoid
 * invalidating node/edge memoization on theme toggle.
 */
export const selectCanvasData = createSelector(
  [
    selectAllNodes,
    selectAllDatasets,
    selectAllConnections,
    selectSelectedNodeIds,
    selectSelectedEdgeIds,
    selectSelectedNodeIdsSet,
    selectSelectedEdgeIdsSet,
  ],
  (nodes, datasets, connections, selectedNodeIds, selectedEdgeIds, selectedNodeIdsSet, selectedEdgeIdsSet) => ({
    nodes,
    datasets,
    connections,
    selectedNodeIds,
    selectedEdgeIds,
    selectedNodeIdsSet,
    selectedEdgeIdsSet,
  })
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
