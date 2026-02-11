# ADR-002: ReactFlow Architecture Patterns

## Status

**Proposed** | 2026-02-11

## Context

Kedro Builder uses `@xyflow/react` v12.8.6 to render a visual pipeline editor. Users drag task nodes and dataset nodes from a palette onto a canvas, connect them with edges, configure properties, and export the result as a Kedro project ZIP.

### Current Implementation Summary

| Aspect | Current State | Problem |
|--------|--------------|---------|
| **Node types** | 2 custom nodes (`kedroNode` at 56 LOC, `datasetNode` at 120 LOC) + 1 custom edge (`kedroEdge` at 42 LOC) | No shared base; `datasetNode` 2x size of `kedroNode`; no `ParameterNode` |
| **State ownership** | Redux is source of truth. ReactFlow gets its own copy via `useNodesState`/`useEdgesState`. `useLayoutEffect` syncs Redux -> ReactFlow every time Redux changes. Position changes during drag dispatch Redux actions on every `position` change event. | Dual-state causes jank: `useLayoutEffect` replaces the entire nodes array mid-drag, resetting ReactFlow's internal tracking. Every pixel of drag fires `updateNodePosition` dispatch -> selector recompute -> `useLayoutEffect` sync -> ReactFlow re-render. |
| **Memoization** | `CustomNode` and `DatasetNode` are wrapped with `memo()` (good). `CustomEdge` is wrapped with `memo()` (good). However, `CanvasControls` and `GhostPreview` are not memoized. | `memo()` is present but undermined by the `useLayoutEffect` sync which replaces node/edge arrays on every Redux change, causing all nodes to receive new object references. |
| **Hooks** | 10 hooks compose the canvas behavior: `useCanvasState`, `useConnectionHandlers`, `useNodeHandlers`, `useSelectionHandlers`, `useDeleteConfirmation`, `useCopyPaste`, `useCanvasKeyboardShortcuts`, `useGhostPreview`, `useDragToCreate`, `useClearSelections` | Hooks are tightly coupled through prop drilling of state setters. `useConnectionHandlers` receives `setEdges` as a `React.Dispatch<React.SetStateAction<Edge[]>>`. `useNodeHandlers` receives `onNodesChange` from ReactFlow's internal state. This makes hooks hard to test in isolation. |
| **Connection validation** | `isValidConnection` checks bipartite rule (node<->dataset only). `wouldCreateCycle` runs DFS at connection time. | Validation is correct but split across `useConnectionHandlers` (bipartite check) and inline in `handleConnect` (cycle detection with direct `store.getState()` call). No visual feedback beyond CSS class toggle. |
| **Canvas component** | `PipelineCanvas.tsx` at 271 lines | Orchestrates 4 hooks, 2 confirm dialogs, ghost preview, overlay, controls. Too many responsibilities. |

### Files Under Consideration

```
src/components/Canvas/PipelineCanvas.tsx              (271 lines)
src/components/Canvas/hooks/useCanvasState.ts         (187 lines)
src/components/Canvas/hooks/useConnectionHandlers.ts  (211 lines)
src/components/Canvas/hooks/useNodeHandlers.ts        (267 lines)
src/components/Canvas/hooks/useSelectionHandlers.ts   (203 lines)
src/components/Canvas/hooks/useDeleteConfirmation.ts  (107 lines)
src/components/Canvas/hooks/useCopyPaste.ts           (179 lines)
src/components/Canvas/hooks/useCanvasKeyboardShortcuts.ts (97 lines)
src/components/Canvas/hooks/useGhostPreview.ts        (70 lines)
src/components/Canvas/hooks/useDragToCreate.ts        (149 lines)
src/components/Canvas/hooks/utils/cycleDetection.ts   (103 lines)
src/components/Canvas/CustomNode/CustomNode.tsx        (63 lines)
src/components/Canvas/DatasetNode/DatasetNode.tsx      (133 lines)
src/components/Canvas/CustomEdge/CustomEdge.tsx        (45 lines)
src/features/canvas/canvasSelectors.ts                (107 lines)
src/types/reactflow.ts                                (14 lines)
```

---

## Decisions

### 1. State Ownership: Option B -- ReactFlow Owns Visual State, Redux Owns Domain State

**Decision:** Make ReactFlow the owner of ephemeral visual state (positions, viewport, selection highlights) and Redux the owner of persistent domain state (node names, types, function code, dataset configs, connections). Synchronize from ReactFlow to Redux only on drag-end, not on every pixel.

**Rationale:**

The current approach (Option A: Redux as sole source) creates an inherently adversarial relationship with ReactFlow. ReactFlow v12 (`@xyflow/react`) is designed to manage its own node positions internally for smooth 60fps drag performance. When we override that with `useLayoutEffect(() => setNodes(initialNodes), [initialNodes])`, we:

1. Replace ReactFlow's internal node array reference on every Redux state change
2. Break ReactFlow's internal `onNodeDrag` tracking because the node objects it is tracking get swapped out mid-drag
3. Force every `memo()`-wrapped node to re-render because all node `data` objects are new references (reconstructed in `useMemo`)
4. Fire Redux dispatches at 60fps during drag (`updateNodePosition` on every `position` change event), which triggers auto-save middleware, selector recomputation, and the `useLayoutEffect` sync loop

**New data flow:**

```
Drag start:
  ReactFlow handles drag internally (no Redux dispatch)

Drag in progress:
  ReactFlow updates position at 60fps internally
  Edges re-route smoothly (ReactFlow handles this natively)
  NO Redux dispatches

Drag end:
  onNodeDragStop fires once
  Dispatch updateNodePosition to Redux
  Redux auto-save middleware persists
  
Domain changes (name, type, config):
  User edits in config panel
  Dispatch to Redux
  Redux selector recomputes
  Node receives new `data` prop via conversion
  memo() allows re-render only for changed node
```

**Implementation pattern:**

```typescript
// src/components/Canvas/hooks/useCanvasNodes.ts

import { useMemo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectAllNodes } from '@/features/nodes/nodesSelectors';
import { selectAllDatasets } from '@/features/datasets/datasetsSelectors';
import { selectSelectedNodeIdsSet } from '@/features/canvas/canvasSelectors';
import { updateNodePosition } from '@/features/nodes/nodesSlice';
import { updateDatasetPosition } from '@/features/datasets/datasetsSlice';
import { isNodeId, isDatasetId } from '@/domain/IdGenerator';
import type { Node, NodeDragHandler, OnNodesChange } from '@xyflow/react';

/**
 * Converts Redux domain state to ReactFlow nodes.
 * Returns initial nodes for ReactFlow and a drag-stop handler 
 * that syncs final positions back to Redux.
 */
export function useCanvasNodes() {
  const dispatch = useAppDispatch();
  const reduxNodes = useAppSelector(selectAllNodes);
  const reduxDatasets = useAppSelector(selectAllDatasets);
  const selectedIdsSet = useAppSelector(selectSelectedNodeIdsSet);

  // Build ReactFlow nodes from Redux state.
  // This is the INITIAL conversion -- ReactFlow owns positions after this.
  // Re-runs only when Redux domain data changes (name, type, config)
  // or selection changes.
  const initialNodes: Node[] = useMemo(() => {
    const taskNodes: Node[] = reduxNodes.map((node) => ({
      id: node.id,
      type: 'taskNode' as const,
      position: node.position,
      data: {
        label: node.name,
        nodeType: node.type,
        kedroId: node.id,
      },
      selected: selectedIdsSet.has(node.id),
      draggable: true,
    }));

    const datasetNodes: Node[] = reduxDatasets.map((ds) => ({
      id: ds.id,
      type: 'datasetNode' as const,
      position: ds.position,
      data: {
        label: ds.name,
        datasetType: ds.type,
        kedroId: ds.id,
      },
      selected: selectedIdsSet.has(ds.id),
      draggable: true,
    }));

    return [...taskNodes, ...datasetNodes];
  }, [reduxNodes, reduxDatasets, selectedIdsSet]);

  // Sync final position to Redux on drag end (NOT during drag)
  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      if (isNodeId(node.id)) {
        dispatch(updateNodePosition({ id: node.id, position: node.position }));
      } else if (isDatasetId(node.id)) {
        dispatch(updateDatasetPosition({ id: node.id, position: node.position }));
      }
    },
    [dispatch]
  );

  // Batch version for multi-node drag
  const onSelectionDragStop: NodeDragHandler = useCallback(
    (_event, _node, nodes) => {
      nodes.forEach((n) => {
        if (isNodeId(n.id)) {
          dispatch(updateNodePosition({ id: n.id, position: n.position }));
        } else if (isDatasetId(n.id)) {
          dispatch(updateDatasetPosition({ id: n.id, position: n.position }));
        }
      });
    },
    [dispatch]
  );

  return {
    initialNodes,
    onNodeDragStop,
    onSelectionDragStop,
  };
}
```

**Key change from current:** Remove `useNodesState`/`useEdgesState` + `useLayoutEffect` sync loop. Instead, pass `initialNodes` as the `defaultNodes` prop (uncontrolled mode) and use `onNodeDragStop` for position sync. For domain data changes that need to update node appearance (name changes, validation state changes), use `useReactFlow().setNodes()` with a targeted update.

**Handling domain data updates (names, configs):**

```typescript
// src/components/Canvas/hooks/useNodeDataSync.ts

import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAppSelector } from '@/store/hooks';
import { selectAllNodes } from '@/features/nodes/nodesSelectors';
import { selectAllDatasets } from '@/features/datasets/datasetsSelectors';

/**
 * Syncs domain data (name, type, config) changes from Redux 
 * into ReactFlow nodes WITHOUT replacing position data.
 * 
 * This is a targeted update: only the `data` property of changed 
 * nodes is updated. Position is left untouched because ReactFlow 
 * owns it.
 */
export function useNodeDataSync() {
  const { setNodes } = useReactFlow();
  const reduxNodes = useAppSelector(selectAllNodes);
  const reduxDatasets = useAppSelector(selectAllDatasets);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render -- defaultNodes handles initial state
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Build a lookup of current domain data
    const domainData = new Map<string, Record<string, unknown>>();
    reduxNodes.forEach((node) => {
      domainData.set(node.id, {
        label: node.name,
        nodeType: node.type,
        kedroId: node.id,
      });
    });
    reduxDatasets.forEach((ds) => {
      domainData.set(ds.id, {
        label: ds.name,
        datasetType: ds.type,
        kedroId: ds.id,
      });
    });

    // Update only the data property -- preserve position
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const newData = domainData.get(node.id);
        if (!newData) {
          // Node was deleted from Redux -- remove from ReactFlow
          return null;
        }
        return { ...node, data: newData };
      }).filter(Boolean) as Node[]
    );
  }, [reduxNodes, reduxDatasets, setNodes]);
}
```

**Why not Option C (Zustand)?**

The project already has a mature Redux store with 7 slices, normalized `byId`/`allIds` patterns, auto-save middleware, and branded ID types. Migrating to Zustand would be a high-risk rewrite that touches every feature. The dual-state problem is not caused by Redux itself but by the sync pattern. Fixing the sync pattern within Redux is lower risk and preserves all existing infrastructure.

---

### 2. Node Type System

**Decision:** Introduce a three-tier node type system with a shared base layout pattern, keeping `taskNode` and `datasetNode` and adding `parameterNode`.

#### 2.1 ReactFlow Node Type Registration

```typescript
// src/components/Canvas/nodes/index.ts
// CRITICAL: Defined outside any component to prevent re-registration

import { TaskNode } from './TaskNode/TaskNode';
import { DatasetNode } from './DatasetNode/DatasetNode';
import { ParameterNode } from './ParameterNode/ParameterNode';
import type { NodeTypes } from '@xyflow/react';

export const nodeTypes: NodeTypes = {
  taskNode: TaskNode,
  datasetNode: DatasetNode,
  parameterNode: ParameterNode,
} as const;
```

**Naming change:** Rename `kedroNode` to `taskNode` because "kedro node" is ambiguous (everything in Kedro is a "node"). The term `taskNode` maps directly to Kedro's concept of a pipeline node that executes a Python function.

#### 2.2 Node Data Types

```typescript
// src/types/flow.ts

import type { Node, Edge } from '@xyflow/react';

/** Base data shared by all node types on the canvas */
interface BaseNodeData {
  readonly kedroId: string;   // Branded ID from domain layer
  readonly label: string;     // Display name (empty = "Unnamed")
}

/** Task node data -- represents a Kedro pipeline node */
export interface TaskNodeData extends BaseNodeData {
  readonly nodeType: NodeType;  // data_ingestion | data_processing | etc.
}

/** Dataset node data -- represents a Kedro catalog entry */
export interface DatasetNodeData extends BaseNodeData {
  readonly datasetType: DatasetType;  // csv | parquet | json | etc.
}

/** Parameter node data -- represents Kedro parameters.yml entries */
export interface ParameterNodeData extends BaseNodeData {
  readonly parameterScope: 'global' | 'pipeline';
}

/** Union of all node data types for type narrowing */
export type KedroFlowNodeData = TaskNodeData | DatasetNodeData | ParameterNodeData;

/** Typed ReactFlow node aliases */
export type TaskFlowNode = Node<TaskNodeData, 'taskNode'>;
export type DatasetFlowNode = Node<DatasetNodeData, 'datasetNode'>;
export type ParameterFlowNode = Node<ParameterNodeData, 'parameterNode'>;
export type KedroFlowNode = TaskFlowNode | DatasetFlowNode | ParameterFlowNode;
```

**Key design choice:** Node data is `readonly` and contains only display-relevant fields (`label`, `nodeType`, `datasetType`). The full domain object (`KedroNode`, `KedroDataset`) stays in Redux. This prevents non-serializable or large objects from leaking into ReactFlow's internal state.

#### 2.3 Parameter Node

Kedro pipelines have three component types: nodes (tasks), datasets, and parameters. The current builder is missing parameter support. Adding it completes the domain model.

```typescript
// src/components/Canvas/nodes/ParameterNode/ParameterNode.tsx

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Settings2 } from 'lucide-react';
import classNames from 'classnames';
import { useAppSelector } from '@/store/hooks';
import { selectNodeValidationStatus } from '@/features/validation/validationSelectors';
import type { ParameterNodeData } from '@/types/flow';
import './ParameterNode.scss';

const ParameterNode = memo<NodeProps<ParameterNodeData>>(({ data, selected }) => {
  const { hasError, hasWarning } = useAppSelector((state) =>
    selectNodeValidationStatus(state, data.kedroId)
  );

  return (
    <div
      className={classNames('parameter-node', {
        'parameter-node--selected': selected,
        'parameter-node--unnamed': !data.label || data.label.trim() === '',
        'parameter-node--error': hasError,
        'parameter-node--warning': !hasError && hasWarning,
      })}
    >
      {/* Parameters are INPUT-ONLY: no source handle */}
      <div className="parameter-node__content">
        <div className="parameter-node__icon">
          <Settings2 size={16} />
        </div>
        <span className="parameter-node__label">
          {data.label || 'Unnamed Parameter'}
        </span>
        <span className="parameter-node__scope">{data.parameterScope}</span>
      </div>

      {/* Output handle only -- parameters flow INTO task nodes */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="parameter-node__handle"
      />
    </div>
  );
});

ParameterNode.displayName = 'ParameterNode';
export { ParameterNode };
```

**Connection rule for parameters:** Parameter -> Task is valid. Task -> Parameter, Dataset -> Parameter, and Parameter -> Dataset are all invalid. This is enforced in the connection validation system (see Decision 4).

---

### 3. Custom Node Component Pattern

**Decision:** All node components follow a strict contract: `memo()` wrapping, `displayName`, minimal `data` prop consumption, and validation subscription via parameterized selector.

#### 3.1 Standard Node Contract

Every custom node component MUST:

1. Be wrapped with `memo()` as the outermost wrapper
2. Set `displayName` for React DevTools and error messages
3. Consume ONLY `data` and `selected` from `NodeProps` (not `xPos`, `yPos`, `dragging`, etc. unless required for specific visual behavior)
4. Subscribe to validation state via `selectNodeValidationStatus(state, data.kedroId)`, which returns `{ hasError, hasWarning }` using an O(1) indexed lookup
5. Use `classNames` (already in deps) for conditional CSS class composition
6. Export as named export (not default) for explicit import tracking
7. Keep total LOC under 80 (excluding imports and styles)

#### 3.2 Handle Configuration

```typescript
// src/components/Canvas/nodes/handles.ts

import { Position } from '@xyflow/react';

/**
 * Standardized handle IDs used across all node types.
 * Connection validation references these IDs.
 */
export const HANDLE_IDS = {
  INPUT: 'input',
  OUTPUT: 'output',
} as const;

/**
 * Handle position follows the vertical layout convention:
 * - Inputs arrive from the top
 * - Outputs depart from the bottom
 * 
 * This matches the current implementation and Kedro-Viz conventions.
 */
export const HANDLE_POSITIONS = {
  INPUT: Position.Top,
  OUTPUT: Position.Bottom,
} as const;
```

| Node Type | Target Handle (input) | Source Handle (output) |
|-----------|----------------------|----------------------|
| `taskNode` | Yes (`input`) | Yes (`output`) |
| `datasetNode` | Yes (`input`) | Yes (`output`) |
| `parameterNode` | No | Yes (`output`) |

#### 3.3 Style System

Node styles continue using SCSS modules (`.scss` files per node type) with CSS custom properties for theming. This is consistent with the existing codebase and avoids introducing a second styling paradigm.

```scss
// Shared CSS custom properties (already defined in theme)
// --color-node-data-ingestion
// --color-node-data-processing
// --color-node-model-training
// --color-node-model-evaluation
// --color-node-custom
// --color-dataset
// --color-parameter (NEW)
// --color-primary (selection highlight)
```

#### 3.4 Interaction Patterns

| Interaction | Behavior | Handler Location |
|-------------|----------|-----------------|
| **Single click** | Select node, open config panel | `onNodeClick` in `useNodeInteractions` hook |
| **Cmd/Ctrl+Click** | Toggle multi-select, do NOT open config panel | `onNodeClick` with modifier key check |
| **Hover** | CSS-only hover state (`:hover` pseudo-class) | No JavaScript handler needed |
| **Right-click** | Future: context menu (not in this phase) | Reserved, no-op for now |
| **Double-click** | Future: inline rename (not in this phase) | Reserved, no-op for now |

---

### 4. Connection Validation System

**Decision:** Centralize all connection validation into a single pure function module with three layers: structural validation, bipartite rule enforcement, and cycle detection. Provide real-time visual feedback.

#### 4.1 Validation Architecture

```typescript
// src/components/Canvas/validation/connectionValidator.ts

import type { Connection, Node } from '@xyflow/react';
import { isNodeId, isDatasetId } from '@/domain/IdGenerator';

export interface ConnectionValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
}

/**
 * Pure function: validates whether a proposed connection is allowed.
 * Called by ReactFlow's `isValidConnection` prop at ~60fps during 
 * connection drag, so this MUST be fast (no store access, no side effects).
 */
export function validateConnection(
  connection: Connection,
  getNode: (id: string) => Node | undefined,
): ConnectionValidationResult {
  const { source, target, sourceHandle, targetHandle } = connection;

  // Layer 1: Structural validation
  if (!source || !target) {
    return { valid: false, reason: 'Missing source or target' };
  }
  if (source === target) {
    return { valid: false, reason: 'Cannot connect to self' };
  }
  if (sourceHandle && sourceHandle !== 'output') {
    return { valid: false, reason: 'Invalid source handle' };
  }
  if (targetHandle && targetHandle !== 'input') {
    return { valid: false, reason: 'Invalid target handle' };
  }

  // Layer 2: Bipartite graph enforcement
  const isSourceNode = isNodeId(source);
  const isSourceDataset = isDatasetId(source);
  const isTargetNode = isNodeId(target);
  const isTargetDataset = isDatasetId(target);

  // Parameter nodes: source only (parameters -> task nodes)
  const sourceNode = getNode(source);
  const targetNode = getNode(target);

  if (sourceNode?.type === 'parameterNode') {
    if (!isTargetNode || targetNode?.type !== 'taskNode') {
      return { valid: false, reason: 'Parameters can only connect to task nodes' };
    }
    return { valid: true };
  }

  if (targetNode?.type === 'parameterNode') {
    return { valid: false, reason: 'Nothing can connect into a parameter node' };
  }

  // Standard bipartite rule: node <-> dataset only
  const isValidBipartite =
    (isSourceNode && isTargetDataset) || (isSourceDataset && isTargetNode);

  if (!isValidBipartite) {
    const sameType = (isSourceNode && isTargetNode) ? 'task nodes'
      : (isSourceDataset && isTargetDataset) ? 'datasets'
      : 'unknown types';
    return {
      valid: false,
      reason: `Cannot connect two ${sameType} directly`,
    };
  }

  return { valid: true };
}
```

#### 4.2 Cycle Detection

Cycle detection remains a separate concern because it requires access to the full graph state, which is too expensive for `isValidConnection` (called at 60fps). Instead, cycle detection runs once at connection commit time.

```typescript
// src/components/Canvas/validation/cycleDetection.ts
// (Refactored from current hooks/utils/cycleDetection.ts)
// Same DFS algorithm, but extracted to a standalone pure function module
// that receives graph data as arguments (no store access).

export function wouldCreateCycle(
  newSource: string,
  newTarget: string,
  connections: ReadonlyArray<{ source: string; target: string }>,
  nodeIds: readonly string[],
  datasetIds: readonly string[],
): boolean {
  // ... (existing DFS implementation, unchanged)
}
```

#### 4.3 Visual Feedback During Connection Drag

```
User drags from output handle:
  1. CSS class `pipeline-canvas--connecting` applied to canvas
  2. All INVALID target handles get CSS class `handle--invalid` (red/dimmed)
  3. All VALID target handles get CSS class `handle--valid` (green/bright)
  4. Ghost preview appears showing what will be created if dropped on empty canvas

User hovers over a valid target:
  5. Target node gets `node--connect-target` class (green border glow)

User hovers over an invalid target:
  6. Target node gets `node--connect-invalid` class (red border, shake animation)

User drops on valid target:
  7. Cycle detection runs (one-time DFS check)
  8. If cycle detected: toast.error with explanation, connection rejected
  9. If no cycle: connection created, edge appears with animation
```

The current implementation already has most of this wiring via `connectionState` and CSS classes. The refactoring centralizes the validation logic into `validateConnection()` and ensures the visual feedback is driven by it.

---

### 5. Drag-and-Drop System

**Decision:** Keep the current drag-and-drop architecture (palette-to-canvas with `onDrop`) but extract it into a dedicated hook with cleaner separation of concerns. Keep the drag-to-create feature (drag from handle to empty canvas to auto-create connected component).

#### 5.1 Palette to Canvas

```typescript
// src/components/Canvas/hooks/usePaletteDrop.ts

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAppDispatch } from '@/store/hooks';
import { addNode } from '@/features/nodes/nodesSlice';
import { addDataset } from '@/features/datasets/datasetsSlice';
import { openConfigPanel, setPendingComponent } from '@/features/ui/uiSlice';
import { clearSelection } from '@/features/nodes/nodesSlice';
import { clearConnectionSelection } from '@/features/connections/connectionsSlice';
import { generateId } from '@/domain/IdGenerator';
import { DND_TYPES } from '@/constants';
import { trackEvent } from '@/infrastructure/telemetry';
import type { NodeType, DatasetType } from '@/types/kedro';

/**
 * Handles drops from the sidebar palette onto the canvas.
 * Separated from connection-drag-to-create for clarity.
 */
export function usePaletteDrop() {
  const { screenToFlowPosition } = useReactFlow();
  const dispatch = useAppDispatch();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(DND_TYPES.NODE);
      const datasetType = event.dataTransfer.getData(DND_TYPES.DATASET);
      // Future: const paramType = event.dataTransfer.getData(DND_TYPES.PARAMETER);

      if (!nodeType && !datasetType) return;

      dispatch(clearSelection());
      dispatch(clearConnectionSelection());

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (nodeType) {
        const id = generateId('node');
        dispatch(addNode({
          id,
          name: '',
          type: nodeType as NodeType,
          inputs: [],
          outputs: [],
          position,
        }));
        dispatch(setPendingComponent({ type: 'node', id }));
        dispatch(openConfigPanel({ type: 'node', id }));
        trackEvent('node_added', { type: nodeType });
      } else if (datasetType) {
        const id = generateId('dataset');
        dispatch(addDataset({
          id,
          name: '',
          type: datasetType as DatasetType,
          position,
        }));
        dispatch(setPendingComponent({ type: 'dataset', id }));
        dispatch(openConfigPanel({ type: 'dataset', id }));
        trackEvent('dataset_added', { type: datasetType });
      }
    },
    [screenToFlowPosition, dispatch]
  );

  return { onDragOver, onDrop };
}
```

#### 5.2 Drag-to-Create (Handle to Empty Canvas)

The current `useDragToCreate` hook is well-structured. Refactoring recommendations:

1. **Remove `setTimeout` delays:** The 100ms `CONNECTION_CREATION_DELAY` is a workaround for the dual-state sync issue. With ReactFlow owning visual state (Decision 1), the new node is immediately available in ReactFlow's internal state, so the edge can be created synchronously.
2. **Keep the `connectionMadeRef` guard** to prevent duplicate creation when the user successfully connects to an existing node.
3. **Move into `useConnectionDragCreate`** (renamed for clarity).

#### 5.3 Ghost Preview

Keep the existing `useGhostPreview` hook. The DOM-querying proximity detection (`document.querySelectorAll('.react-flow__node')`) is acceptable for the expected graph sizes (< 200 nodes). For larger graphs, consider switching to ReactFlow's `getNodes()` API with position-based distance calculation, which avoids DOM reads.

---

### 6. Performance Optimization Strategy

#### 6.1 Node Memoization (Already Partially Done)

Current state: `CustomNode`, `DatasetNode`, and `CustomEdge` are already wrapped with `memo()`. This is good. The problem is that `memo()` is defeated by the `useLayoutEffect` sync which replaces all node objects every time Redux changes.

**Fix:** With Decision 1 (ReactFlow owns visual state), the `memo()` wrapping becomes effective because:
- ReactFlow only passes new `data` to a node when its specific data changes
- Position changes during drag do not create new `data` objects
- Selection changes use ReactFlow's internal `selected` prop, which ReactFlow diffs efficiently

#### 6.2 Selector Memoization

The existing `canvasSelectors.ts` uses `createSelector` with proper input selector composition. This is correct. Additional optimization:

```typescript
// Create per-node memoized selectors for config panel data
// These prevent the config panel from re-rendering when 
// unrelated nodes change.

import { createSelector } from '@reduxjs/toolkit';

export const makeSelectNodeById = () =>
  createSelector(
    [(state: RootState) => state.nodes.byId, (_state: RootState, id: string) => id],
    (byId, id) => byId[id] ?? null
  );

export const makeSelectDatasetById = () =>
  createSelector(
    [(state: RootState) => state.datasets.byId, (_state: RootState, id: string) => id],
    (byId, id) => byId[id] ?? null
  );
```

#### 6.3 Component Memoization Additions

Components that are NOT currently memoized but should be:

| Component | Why Memoize |
|-----------|------------|
| `CanvasControls` | Re-renders on every parent render; props (`getNodeColor`) are already stable via `useCallback` |
| `GhostPreview` | Re-renders at mousemove frequency during connection drag |
| `CanvasOverlay` | Re-renders when canvas state changes even if overlay props are unchanged |

```typescript
// CanvasControls should be memo()'d
export const CanvasControls = memo(({ getNodeColor }: CanvasControlsProps) => {
  // ...existing implementation
});
CanvasControls.displayName = 'CanvasControls';
```

#### 6.4 Position Update Batching

Current problem: During drag, the current code dispatches `updateNodePosition` on every `position` change (60fps). This triggers:
1. Redux reducer
2. Auto-save middleware (debounced at 500ms, but still queuing)
3. `createSelector` recomputation in `selectCanvasDataWithSets`
4. `useLayoutEffect` sync
5. Full ReactFlow node array replacement

**Fix with Decision 1:** Position changes during drag are handled entirely by ReactFlow. Redux only receives the final position on `onNodeDragStop`. This eliminates 60x per-second Redux dispatches and all downstream effects.

For the edge case where another component needs to know the current drag position in real-time (e.g., snap-to-grid indicators), use ReactFlow's `useNodes()` hook locally rather than reading from Redux.

#### 6.5 Large Graph Considerations

For graphs with 100+ nodes (possible but not the primary use case):

1. **Do NOT enable `onlyRenderVisibleElements` by default.** In ReactFlow v12, this is handled automatically with viewport culling. The old prop-based approach is deprecated.
2. **Avoid subscribing to `useNodes()` globally.** Each call returns ALL nodes and re-renders on any change. Use `useNodesData(nodeId)` for targeted subscriptions.
3. **Minimap performance:** The current minimap uses `nodeColor` callback which is already stable via `useCallback`. No change needed.

---

### 7. PipelineCanvas Component Decomposition

**Decision:** Split `PipelineCanvas.tsx` (271 lines) into three layers.

```
PipelineCanvas (wrapper)
  └── ReactFlowProvider
        └── PipelineCanvasInner (ReactFlow instance + core props)
              ├── CanvasBackground (Background + grid)
              ├── CanvasControls (Controls + MiniMap)
              ├── GhostPreview (connection drag feedback)
              ├── CanvasOverlay (empty state + toolbar)
              └── DeleteConfirmDialogs (confirmation modals)
```

**Hook consolidation:**

| Current (10 hooks) | Proposed (6 hooks) | Change |
|----|----|----|
| `useCanvasState` | Removed | Replaced by `useCanvasNodes` + `useCanvasEdges` + direct Redux selectors |
| `useConnectionHandlers` | `useConnectionHandlers` | Simplified: no longer receives `setEdges` as prop |
| `useNodeHandlers` | `useNodeInteractions` | Renamed; no longer receives `onNodesChange` as prop |
| `useSelectionHandlers` | `useSelectionHandlers` | Simplified: fewer props needed |
| `useDeleteConfirmation` | `useDeleteConfirmation` | Unchanged |
| `useCopyPaste` | `useCopyPaste` | Unchanged |
| `useCanvasKeyboardShortcuts` | `useCanvasKeyboardShortcuts` | Unchanged |
| `useGhostPreview` | `useGhostPreview` | Unchanged |
| `useDragToCreate` | `useConnectionDragCreate` | Renamed; setTimeout removed |
| `useClearSelections` | `useClearSelections` | Unchanged |
| -- | `usePaletteDrop` (NEW) | Extracted from `useNodeHandlers` |
| -- | `useNodeDataSync` (NEW) | Handles Redux -> ReactFlow data sync |

Net result: 10 hooks become 6 canvas-specific hooks + 2 reusable hooks. The key improvement is that hooks no longer pass ReactFlow internal state setters (`setEdges`, `onNodesChange`) between each other. Each hook accesses ReactFlow's API via `useReactFlow()` directly.

---

### 8. Edge Type System

**Decision:** Keep the single `kedroEdge` custom edge type. Rename to `pipelineEdge` for clarity.

```typescript
// src/components/Canvas/edges/index.ts

import { PipelineEdge } from './PipelineEdge/PipelineEdge';
import type { EdgeTypes } from '@xyflow/react';

export const edgeTypes: EdgeTypes = {
  pipelineEdge: PipelineEdge,
} as const;
```

The `PipelineEdge` component remains minimal (Bezier path + selection styling). No changes to the edge component itself beyond renaming and ensuring `memo()` wrapping (already done).

---

## Migration Plan

This refactoring should be executed in 5 incremental steps. Each step results in a working application.

### Step 1: Extract Node Types and Edge Types to Dedicated Modules
- Move `nodeTypes` and `edgeTypes` from `PipelineCanvas.tsx` to `src/components/Canvas/nodes/index.ts` and `src/components/Canvas/edges/index.ts`
- Add `ParameterNode` component (non-functional placeholder -- can connect but no config panel yet)
- Rename `kedroNode` -> `taskNode`, `kedroEdge` -> `pipelineEdge`
- Update all references
- **Risk:** Low. Import path changes only.

### Step 2: Fix the Dual-State Sync
- Remove `useNodesState`/`useEdgesState` + `useLayoutEffect` sync
- Switch to controlled mode: `nodes` and `edges` props come from `useMemo()` over Redux state
- Replace per-pixel `updateNodePosition` dispatch with `onNodeDragStop` handler
- Add `useNodeDataSync` hook for domain data changes
- **Risk:** Medium. This changes the core data flow. Requires thorough testing of drag behavior, edge routing during drag, and position persistence.

### Step 3: Centralize Connection Validation
- Extract `validateConnection()` pure function
- Wire into `isValidConnection` prop
- Keep `wouldCreateCycle` at commit time
- Update visual feedback CSS classes
- **Risk:** Low. Validation logic is already correct; this is extraction only.

### Step 4: Decompose PipelineCanvas and Hooks
- Split `PipelineCanvas.tsx` into layers
- Consolidate hooks per the table above
- Extract `usePaletteDrop` from `useNodeHandlers`
- Remove prop drilling of `setEdges` and `onNodesChange` between hooks
- **Risk:** Medium. Hook composition changes require careful testing of all interaction flows.

### Step 5: Add Parameter Node Support
- Add `ParameterNode` config panel
- Add parameter to palette sidebar
- Update connection validation to enforce parameter -> task only
- Update export/code-generation to include `parameters.yml`
- **Risk:** Medium. New feature that touches palette, canvas, config panel, and code generation.

---

## Consequences

### Positive
1. **Drag performance:** Eliminating 60fps Redux dispatches during drag removes the #1 source of jank
2. **Effective memoization:** `memo()` on node components actually prevents re-renders because node data objects are stable during drag
3. **Testable validation:** `validateConnection()` is a pure function that can be unit tested without ReactFlow or Redux
4. **Reduced coupling:** Hooks access ReactFlow via `useReactFlow()` instead of receiving internal state setters as props
5. **Complete domain model:** Parameter node support completes the Kedro pipeline model
6. **Smaller components:** PipelineCanvas drops from 271 lines to ~120 lines

### Negative
1. **Position lag on crash:** If the browser crashes mid-drag, the final position is lost because Redux has not been updated yet. Mitigation: This is an edge case; auto-save on drag-end handles the normal case.
2. **Two sync directions:** Domain data flows Redux -> ReactFlow (via `useNodeDataSync`), positions flow ReactFlow -> Redux (via `onNodeDragStop`). This bidirectional flow must be well-documented to prevent confusion.
3. **Migration complexity:** Step 2 (fix dual-state sync) is a non-trivial change to the core data flow. It must be thoroughly tested before merging.

---

## Risks Considered

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `onNodeDragStop` does not fire if drag is cancelled by Escape key | Low | Medium | Test thoroughly; if needed, also listen to `onNodeDragStart` to capture initial position and restore on Escape |
| ReactFlow v12 controlled mode has subtle differences from v11 | Medium | Medium | Read `@xyflow/react` v12 migration guide; test with the specific version (12.8.6) |
| `useNodeDataSync` creates infinite loop if `setNodes` triggers a Redux change | Low | High | `setNodes` only updates ReactFlow internal state, never dispatches to Redux. The effect dependencies ensure one-directional flow. |
| Removing `useNodesState`/`useEdgesState` breaks existing tests | High | Low | Update tests to mock `useReactFlow` instead of `useNodesState`. Test coverage is currently minimal for canvas hooks. |
| Auto-save middleware receives fewer position updates | Low | Low | Auto-save triggers on any Redux state change. `onNodeDragStop` still dispatches, which triggers auto-save. The user just does not get position auto-saved mid-drag, which is acceptable. |
| Parameter node adds complexity to connection validation | Low | Low | The `validateConnection` function handles all node types in a single code path. Adding `parameterNode` is a 5-line addition to the existing bipartite check. |
| Renaming `kedroNode` -> `taskNode` breaks localStorage persistence of existing projects | Medium | High | Add a migration function in the auto-save loader that maps old type names to new ones. Run once on load. |

---

## Appendix A: Current vs Proposed File Structure

```
CURRENT:
src/components/Canvas/
├── PipelineCanvas.tsx                    (271 lines)
├── PipelineCanvas.scss
├── CustomNode/
│   ├── CustomNode.tsx                    (63 lines)
│   └── CustomNode.scss
├── DatasetNode/
│   ├── DatasetNode.tsx                   (133 lines)
│   └── DatasetNode.scss
├── CustomEdge/
│   ├── CustomEdge.tsx                    (45 lines)
│   └── CustomEdge.scss
├── GhostPreview/
│   ├── GhostPreview.tsx                  (50 lines)
│   └── GhostPreview.scss
├── CanvasControls/
│   ├── CanvasControls.tsx                (31 lines)
│   └── CanvasControls.scss
├── CanvasOverlay/
│   └── CanvasOverlay.tsx
└── hooks/
    ├── useCanvasState.ts                 (187 lines)
    ├── useConnectionHandlers.ts          (211 lines)
    ├── useNodeHandlers.ts                (267 lines)
    ├── useSelectionHandlers.ts           (203 lines)
    ├── useDeleteConfirmation.ts          (107 lines)
    ├── useCopyPaste.ts                   (179 lines)
    ├── useCanvasKeyboardShortcuts.ts     (97 lines)
    ├── useGhostPreview.ts               (70 lines)
    ├── useDragToCreate.ts               (149 lines)
    └── utils/
        └── cycleDetection.ts             (103 lines)

PROPOSED:
src/components/Canvas/
├── PipelineCanvas.tsx                    (~120 lines, orchestrator only)
├── PipelineCanvas.scss
├── nodes/
│   ├── index.ts                          (nodeTypes registration)
│   ├── handles.ts                        (shared handle constants)
│   ├── TaskNode/
│   │   ├── TaskNode.tsx                  (~60 lines)
│   │   └── TaskNode.scss
│   ├── DatasetNode/
│   │   ├── DatasetNode.tsx               (~70 lines)
│   │   ├── DatasetNode.scss
│   │   └── datasetIcons.ts              (icon map, extracted)
│   └── ParameterNode/                    (NEW)
│       ├── ParameterNode.tsx             (~50 lines)
│       └── ParameterNode.scss
├── edges/
│   ├── index.ts                          (edgeTypes registration)
│   └── PipelineEdge/
│       ├── PipelineEdge.tsx              (~45 lines)
│       └── PipelineEdge.scss
├── validation/
│   ├── connectionValidator.ts            (pure function)
│   └── cycleDetection.ts                (pure function)
├── overlays/
│   ├── GhostPreview.tsx
│   ├── CanvasControls.tsx
│   └── CanvasOverlay.tsx
└── hooks/
    ├── useCanvasNodes.ts                 (Redux -> ReactFlow node conversion)
    ├── useCanvasEdges.ts                 (Redux -> ReactFlow edge conversion)
    ├── useNodeDataSync.ts                (domain data sync, NEW)
    ├── useConnectionHandlers.ts          (simplified)
    ├── useNodeInteractions.ts            (click, drag-stop, drop)
    ├── usePaletteDrop.ts                 (palette drag-and-drop, extracted)
    ├── useConnectionDragCreate.ts        (drag from handle to create, renamed)
    ├── useSelectionHandlers.ts           (simplified)
    ├── useDeleteConfirmation.ts          (unchanged)
    ├── useCopyPaste.ts                   (unchanged)
    ├── useCanvasKeyboardShortcuts.ts     (unchanged)
    └── useGhostPreview.ts               (unchanged)
```

---

## Appendix B: Type Mapping Reference

```
Domain Type (Redux)          ReactFlow Node Type      ReactFlow data Shape
──────────────────           ───────────────────      ────────────────────
KedroNode                    'taskNode'               TaskNodeData
KedroDataset                 'datasetNode'            DatasetNodeData
KedroParameter (NEW)         'parameterNode'          ParameterNodeData
KedroConnection              'pipelineEdge'           { kedroId: string }
```

---

## Appendix C: Connection Validity Matrix

```
Source \ Target   │ taskNode    │ datasetNode │ parameterNode
──────────────────┼─────────────┼─────────────┼──────────────
taskNode          │ INVALID     │ VALID       │ INVALID
datasetNode       │ VALID       │ INVALID     │ INVALID
parameterNode     │ VALID       │ INVALID     │ INVALID
```

**Rule summary:**
- Task nodes connect to dataset nodes (bidirectional)
- Parameter nodes connect to task nodes (unidirectional: param -> task only)
- Same-type connections are never allowed
- Self-connections are never allowed
- Cycles are detected and rejected at commit time

---

## References

- [ReactFlow v12 Migration Guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)
- [ReactFlow Performance Guide](https://reactflow.dev/learn/advanced-use/performance)
- [Kedro Data Catalog](https://docs.kedro.org/en/stable/data/data_catalog.html)
- [Kedro Pipeline Nodes](https://docs.kedro.org/en/stable/nodes_and_pipelines/nodes.html)
- [Kedro Parameters](https://docs.kedro.org/en/stable/configuration/parameters.html)