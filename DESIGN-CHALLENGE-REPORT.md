# Design Challenge Report: ADR-001 and ADR-002

## 1. Overall Assessment

These are well-researched, thorough ADRs that demonstrate a clear understanding of the codebase's current problems and propose sensible solutions. ADR-001 correctly identifies that the existing issues are not intrinsic to Redux and that a Zustand migration would introduce high risk with marginal benefit. ADR-002's proposal to split state ownership between ReactFlow (visual/ephemeral) and Redux (domain/persistent) is architecturally sound and directly addresses the worst performance issue in the codebase: the 60fps Redux dispatch cycle during drag.

However, there are several critical factual inaccuracies, a fundamental contradiction between the two ADRs, underestimated migration risks particularly around the `defaultNodes` approach in ReactFlow v12, and missing considerations around localStorage schema migration, undo/redo, and the SCSS-to-Tailwind question. The migration timeline is aggressive for a codebase with near-zero test coverage, meaning each step is being made without a safety net. The proposals need targeted amendments before they should move to "Accepted" status.

---

## 2. ADR-001 Challenges

### 2.1 [CRITICAL] Factual Error: "Zero React.memo Usage"

ADR-001 Section 1 and Section 2.10 state: "Zero `React.memo` usage" as a HIGH-priority issue and list adding `React.memo` to `CustomNode`, `DatasetNode`, `CustomEdge` as required work.

This is factually wrong. The actual codebase already wraps all three in `memo()`:

- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/CustomNode/CustomNode.tsx` line 9: `export const CustomNode = memo<NodeProps>(({ data, selected }) => {`
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/DatasetNode/DatasetNode.tsx` line 82: `export const DatasetNode = memo<NodeProps>(({ data, selected }) => {`
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/CustomEdge/CustomEdge.tsx` line 7: `export const CustomEdge = memo<EdgeProps>(`

The actual problem, which ADR-002 correctly identifies, is that the `useLayoutEffect` sync replaces entire node arrays every time Redux changes, defeating the `memo()` wrapping because all node objects get new references. ADR-001 misdiagnoses the symptom. The Metrics for Success table in Section 7 shows `React.memo on nodes/edges: Current = 0, Target = 3`, which is wrong. This undermines confidence in the discovery phase's accuracy. The DISCOVERY.md report at line 702 also states "zero `React.memo` usage" but the discovery's own file listing shows these components use `memo()`.

**Impact:** If implementers follow ADR-001 literally, they will waste time trying to add `memo()` that already exists instead of addressing the root cause (the `useLayoutEffect` sync pattern).

**Recommendation:** Correct the diagnosis. The issue is not "zero memo" but "memo defeated by array replacement." The fix is in ADR-002's approach, not in adding `memo()` calls.

### 2.2 [HIGH] Factual Error: localStorage Side Effects in themeSlice

ADR-001 Section 2.1 item 4 states: "Move all localStorage side effects into middleware (some still leak into reducers in `themeSlice`)." The MEMORY.md also claims side effects at `themeSlice.ts lines 19/24`.

Looking at the actual `themeSlice.ts` at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/theme/themeSlice.ts`, the reducers `setTheme` and `toggleTheme` contain zero localStorage calls. The localStorage read happens only in `getInitialTheme()`, which is a one-time initialization function, not a reducer. Reading from localStorage during initial state computation is a standard pattern and not a side effect in a reducer.

Similarly, `uiSlice.ts` at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/ui/uiSlice.ts` has no localStorage side effects. The entire slice is clean `createSlice` reducers.

**Impact:** Wasted effort fixing a non-existent problem. More concerning, this suggests the discovery phase had stale data or was examining a different version of the code.

**Recommendation:** Re-verify the localStorage side effect claims against the current `develop` branch (commit 287c4da). If the side effects were already fixed in the "Small refactor" commit, update the ADR to reflect current state.

### 2.3 [HIGH] CLAUDE.md Contradiction Not Adequately Resolved

The CLAUDE.md explicitly specifies Zustand as the state management solution, defines Zustand store patterns, and shows `useFlowStore` examples. ADR-001 decides to keep Redux, which contradicts the project's own configuration document. While the technical rationale for keeping Redux is sound, the ADR does not address the governance question: who has authority to override CLAUDE.md? If CLAUDE.md is the project's source of truth for architectural decisions, then this ADR needs explicit sign-off from whoever authored that document.

**Impact:** Future contributors reading CLAUDE.md will be confused when they find Redux. AI assistants reading CLAUDE.md will suggest Zustand patterns.

**Recommendation:** ADR-001 must explicitly state that CLAUDE.md should be updated to reflect Redux Toolkit as the state management solution. Add this as a Phase 2.2 deliverable. The current CLAUDE.md code patterns (Zustand store example, `useFlowStore` hook) must be replaced with the actual Redux patterns.

### 2.4 [HIGH] createEntityAdapter Migration Underestimates Coupling

ADR-001 Section 2.10 item 3 proposes migrating to `createEntityAdapter` for nodes, datasets, and connections slices. Section 5 Phase 2.4 schedules this in Week 2 alongside store restructuring.

The actual `nodesSlice.ts` at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/nodes/nodesSlice.ts` uses a `prepare` callback on `addNode` (lines 26-42) that allows callers to pass either a full `KedroNode` or a partial `{ type, position }` object. `createEntityAdapter` provides its own `addOne`/`addMany`/`removeMany` reducers, but integrating the `prepare` callback pattern with entity adapter requires careful work. The existing `selectNode`, `toggleNodeSelection`, `selectNodes`, `clearSelection`, and `hoverNode` actions manage selection state that is co-located in the same slice. `createEntityAdapter` does not handle selection state, so this must remain manual.

Additionally, 12 existing test files reference the current action shapes. Migrating to `createEntityAdapter` will change the internal state shape (e.g., `entities` vs `byId`, `ids` vs `allIds`), which breaks:
- All selectors that directly access `state.nodes.byId` and `state.nodes.allIds`
- The `saveProjectToLocalStorage` function at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/infrastructure/localStorage/localStorage.ts` lines 93-95 which directly maps `state.nodes.allIds` and `state.nodes.byId`
- The Zod schemas used for localStorage validation
- All existing slice tests

**Impact:** This is not a simple "swap" -- it is a coordinated change across slices, selectors, persistence layer, and tests. Scheduling it alongside other store restructuring in Week 2 is risky.

**Recommendation:** Either (a) keep the current byId/allIds pattern and just fix the O(n^2) issue with a `Set`, which is a 3-line change, or (b) schedule `createEntityAdapter` migration as its own isolated phase with explicit migration of the localStorage layer. I recommend option (a) for the refactoring and deferring (b) to a follow-up.

### 2.5 [MEDIUM] Missing Rollback Strategy

ADR-001 Section 5 defines a 7-phase migration plan but provides no rollback strategy. Each phase says "Verification: application works identically," but what happens if Phase 2.5 (Feature Module Extraction) step 8 of 11 fails? Do you revert all 7 previous steps? Do you keep a partial extraction?

**Impact:** Mid-migration failures could leave the codebase in a worse state than the starting point.

**Recommendation:** Add a rollback section. Each phase should be on a separate branch. If a phase fails verification, the branch is abandoned and the previous phase's branch becomes the baseline. The phases should also be individually mergeable to `develop` rather than accumulated.

### 2.6 [MEDIUM] Phase 2.5 Dependency Order May Be Wrong

Phase 2.5 extracts features in dependency order, with `pipeline-canvas` last (step 11). However, `useSelectionHandlers` at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/hooks/useSelectionHandlers.ts` imports from `../../../constants` (the `onFocusNode` event helper at line 20), and the `validation-panel` feature (step 6) dispatches focus events that target canvas nodes. This means `validation-panel` has a runtime dependency on `pipeline-canvas` through the event system, not just through the store.

**Impact:** Extracting `validation-panel` before `pipeline-canvas` is fine for imports, but the event-based coupling means you cannot test `validation-panel`'s "focus on error" feature in isolation without the canvas being present.

**Recommendation:** Document the event-based coupling explicitly. The extraction order is acceptable for file moves, but integration testing must account for this hidden dependency.

### 2.7 [MEDIUM] Missing Undo/Redo Consideration

ADR-001 does not mention undo/redo at all. The CLAUDE.md mentions it is "commonly requested." Redux inherently supports undo/redo through libraries like `redux-undo`, which wraps reducers with past/future state stacks. If undo/redo is planned for the future, the `createEntityAdapter` migration and store restructuring should be designed to accommodate it (e.g., deciding which slices should be undoable, structuring state to minimize undo stack size).

**Impact:** If undo/redo is added later without planning now, it may require another significant restructuring.

**Recommendation:** Add an explicit section in "Open Questions" about undo/redo. At minimum, state the decision: "Undo/redo is deferred but the feature-based architecture does not preclude adding `redux-undo` to individual slices later."

### 2.8 [LOW] SCSS Files in Target Structure

The target folder structure in Section 2.2 shows `Button.scss`, `app.scss`, and the styles directory with `globals.scss`, `_variables.scss`, etc. CLAUDE.md specifies Tailwind CSS. ADR-001 Section 6 acknowledges this mismatch and recommends deferring the migration. This is reasonable, but the target folder structure should not enshrine SCSS as the final state if Tailwind is the aspiration. Either label the SCSS files as "current, to be migrated" or update CLAUDE.md to drop the Tailwind aspiration.

---

## 3. ADR-002 Challenges

### 3.1 [CRITICAL] defaultNodes/Uncontrolled Mode is Not What ADR-002 Describes

ADR-002 Section 1 states: "Remove `useNodesState`/`useEdgesState` + `useLayoutEffect` sync loop. Instead, pass `initialNodes` as the `defaultNodes` prop (uncontrolled mode)."

This fundamentally misunderstands how `defaultNodes` works in `@xyflow/react` v12. The `defaultNodes` prop is for initial render only. After the first render, ReactFlow owns the state completely. If Redux domain data changes (e.g., user renames a node in the config panel), you cannot update the node's `data` through `defaultNodes` because ReactFlow ignores it after mount.

ADR-002 attempts to solve this with `useNodeDataSync`, which calls `setNodes()` from `useReactFlow()` inside a `useEffect`. This is essentially recreating the controlled mode pattern but with more complexity:

1. `defaultNodes` sets initial state
2. `useEffect` watches Redux changes
3. `setNodes()` updates ReactFlow's internal state
4. This is functionally equivalent to controlled mode but with a `useEffect` delay instead of direct prop passing

The `useNodeDataSync` implementation at ADR-002 lines 199-241 has a subtle bug: the `setNodes` callback filters out nodes not found in `domainData` (line 237: `if (!newData) return null`). This handles deletion, but what about nodes added to Redux after initial render? New nodes added via palette drop will be in Redux but not in ReactFlow's internal state, so `setNodes` will not add them -- it only maps over `currentNodes`.

**Impact:** The proposed architecture will break node creation and deletion after initial render. The "uncontrolled" approach does not work for a dynamic graph builder where nodes are constantly added and removed.

**Recommendation:** Use controlled mode explicitly. Pass `nodes` and `edges` as props (not `defaultNodes`/`defaultEdges`). Handle `onNodesChange` to let ReactFlow manage position changes internally while still using the controlled API. The key optimization is to stop dispatching `updateNodePosition` on every drag frame and instead only dispatch on `onNodeDragStop`. The controlled mode with selective change handling is the correct pattern for v12:

```typescript
// Controlled mode with selective sync
const onNodesChange = useCallback((changes: NodeChange[]) => {
  // Apply all changes to local state for smooth rendering
  setLocalNodes((nds) => applyNodeChanges(changes, nds));
  
  // Only dispatch position to Redux on drag stop (handled separately)
}, []);
```

### 3.2 [HIGH] handleConnect Directly Accesses store.getState()

ADR-002 proposes centralizing connection validation but does not address the existing anti-pattern in `useConnectionHandlers.ts` at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/hooks/useConnectionHandlers.ts` line 153: `const state = store.getState()`. This directly imports the store instance, bypassing React's subscription model. ADR-002's `wouldCreateCycle` pure function signature (lines 545-553) correctly accepts graph data as arguments, but the ADR does not explicitly call out that `store.getState()` must be replaced with data from hooks/selectors.

**Impact:** If the store import is kept, it creates a hidden dependency that defeats the feature module encapsulation ADR-001 is trying to achieve.

**Recommendation:** Explicitly state that `store.getState()` in `useConnectionHandlers` must be replaced with `useAppSelector` or data passed through hook parameters. The cycle detection data should come from the same selectors that drive the canvas.

### 3.3 [HIGH] Node Type Rename Breaks Persisted Data

ADR-002's risk table (line 880) acknowledges that renaming `kedroNode` to `taskNode` breaks localStorage persistence, but the mitigation ("Add a migration function in the auto-save loader that maps old type names to new ones") is under-specified. The `loadProjectFromLocalStorage` function at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/infrastructure/localStorage/localStorage.ts` uses Zod schemas for validation. Adding a migration function requires:

1. Modifying the Zod schema to accept both old and new type names
2. Adding a data transformation step between parsing and validation
3. Handling the edge type rename (`kedroEdge` to `pipelineEdge`) as well
4. The Zod schemas at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/infrastructure/localStorage/schemas.ts` need to be checked for hardcoded type strings

This is not a trivial migration. If the Zod schema rejects the old type names, users lose their saved projects.

**Impact:** Data loss for existing users on first load after the update.

**Recommendation:** Add a versioned migration system. Store a `schemaVersion` in localStorage alongside the project data. Write explicit migration functions from version N to N+1. Run migrations in sequence on load. This pattern is standard and prevents one-off migration functions from accumulating.

### 3.4 [HIGH] Bidirectional Sync Complexity

ADR-002 Consequence #2 (line 865) acknowledges that domain data flows Redux -> ReactFlow while positions flow ReactFlow -> Redux, creating bidirectional sync. But the ADR underestimates the edge cases:

- **Copy/paste**: `useCopyPaste.ts` creates new nodes with positions. These must appear in ReactFlow. In uncontrolled mode, new nodes do not appear unless explicitly added via `setNodes`.
- **Programmatic layout**: If a future "auto-layout" feature arranges nodes, it needs to set positions for all nodes simultaneously. In the proposed pattern, this requires dispatching to Redux (to persist positions) AND updating ReactFlow (to display them).
- **Fit-to-view after load**: When a project is loaded from localStorage, all nodes need to be positioned and then `fitView()` called. With uncontrolled mode, the timing of `defaultNodes` vs `fitView` is tricky.
- **Multi-node drag stop**: The proposed `onSelectionDragStop` (lines 157-168) dispatches individual `updateNodePosition` actions for each dragged node. With 20 selected nodes, that is 20 dispatches, 20 auto-save middleware evaluations, and 20 selector recomputations. This should be a single batched action.

**Recommendation:** Add a `batchUpdatePositions` action that accepts an array of `{ id, position }` pairs. Use RTK's `createAction` + `extraReducers` pattern to handle it in both `nodesSlice` and `datasetsSlice`.

### 3.5 [MEDIUM] Parameter Node is a New Feature, Not a Refactoring

ADR-002 Step 5 adds `ParameterNode` support, including config panel, palette sidebar entry, connection validation updates, and export/code-generation changes for `parameters.yml`. This is a new feature that touches 5+ feature modules and the code generation infrastructure.

**Impact:** Mixing new feature development with refactoring increases risk and makes it harder to verify "application works identically" after each step.

**Recommendation:** Move Parameter Node support to a separate ADR or at minimum a separate phase after the refactoring stabilizes. The connection validation code can include the parameter type check as a no-op path, but the full feature (config panel, palette, code generation) should be deferred.

### 3.6 [MEDIUM] Handle Position Inconsistency

ADR-002 Section 3.2 defines handle positions as Top (input) and Bottom (output). The current codebase at `CustomNode.tsx` lines 31-35 and 53-57 confirms this. But ADR-001's folder structure shows `Position.Left` for targets and `Position.Right` for sources in the CLAUDE.md ReactFlow Node pattern. The CLAUDE.md example shows a left-to-right layout, while the actual codebase uses a top-to-bottom layout.

**Impact:** Minor confusion, but the CLAUDE.md pattern and the ADR-002 pattern disagree on handle positions.

**Recommendation:** Update CLAUDE.md to match the actual top-to-bottom layout, or note this as an intentional difference.

### 3.7 [LOW] Missing isValidConnection Performance Analysis

ADR-002 Section 4.1 states `isValidConnection` is "called at ~60fps during connection drag, so this MUST be fast." The proposed implementation at lines 476-532 uses `getNode()` lookups to check node types for parameter validation. In `@xyflow/react` v12, `getNode()` is an O(1) lookup from an internal Map, so this is fine. But the ADR does not mention that the current implementation uses only ID prefix checks (`isNodeId`, `isDatasetId`) which are even faster (string startsWith). Adding `getNode()` calls introduces a dependency on ReactFlow's internal state, which means `isValidConnection` can only be used inside a ReactFlowProvider context.

**Impact:** The `validateConnection` pure function is no longer truly pure -- it depends on `getNode` as an injected dependency.

**Recommendation:** This is acceptable but should be documented. The function signature already takes `getNode` as a parameter, which preserves testability. Note that unit tests should mock `getNode` rather than requiring a ReactFlow context.

---

## 4. Inter-ADR Conflicts

### 4.1 [CRITICAL] Contradictory Positions on ReactFlow State Ownership

ADR-001 Section 2.5 and 2.7 explicitly state: "Redux is the single source of truth. ReactFlow's internal state is a derived mirror." ADR-001 Section 2.7 Phase 2 mentions evaluating ReactFlow as owner of visual state as a "future consideration."

ADR-002 Section 1 decides: "Make ReactFlow the owner of ephemeral visual state (positions, viewport, selection highlights)." This is not a future consideration -- it is the core proposal.

These two ADRs directly contradict each other on the most important architectural question in the project. ADR-001 says keep Redux as sole source of truth; ADR-002 says split ownership.

**Impact:** If both ADRs are accepted as-is, implementers will not know which pattern to follow. Phase 2.4 (Store Restructuring, ADR-001) happens in Week 2, but ADR-002 Step 2 (Fix Dual-State Sync) also targets the same code in the same timeframe.

**Recommendation:** These ADRs must be harmonized. I recommend amending ADR-001 Section 2.5 and 2.7 to explicitly state: "Redux is the source of truth for domain data (names, types, connections, configurations). ReactFlow owns ephemeral visual state (positions during drag, viewport, selection highlights). Final positions are synced to Redux on drag-end for persistence." This aligns both ADRs and resolves the contradiction.

### 4.2 [HIGH] Conflicting Migration Timelines

ADR-001 Phase 2.4 (Week 2) restructures the store, including migrating to `createEntityAdapter` and consolidating selectors. ADR-002 Step 2 requires removing `useNodesState`/`useEdgesState` and changing how selectors feed into ReactFlow. These are interdependent changes targeting the same files in the same week.

**Impact:** Parallel development on these tracks will create merge conflicts and make it impossible to verify each change independently.

**Recommendation:** Establish a clear ordering. ADR-002 Step 2 (fix dual-state sync) should happen BEFORE ADR-001 Phase 2.4 (store restructuring), because the sync fix changes which selectors are needed and how they are consumed. The suggested combined order:

1. ADR-001 Phase 2.2 (Bug fixes) -- standalone
2. ADR-001 Phase 2.3 (Infrastructure setup) -- standalone
3. ADR-002 Steps 1+2 (Node types + sync fix) -- depends on infrastructure
4. ADR-001 Phase 2.4 (Store restructuring) -- now selectors serve the new sync pattern
5. ADR-001 Phase 2.5 (Feature extraction) -- file moves
6. ADR-002 Steps 3+4 (Validation + decomposition)

### 4.3 [MEDIUM] File Path Disagreements

ADR-001 places canvas files under `src/features/pipeline-canvas/`. ADR-002 Appendix A places them under `src/components/Canvas/`. These are different locations.

**Recommendation:** ADR-002's proposed structure should be updated to use `src/features/pipeline-canvas/` to match ADR-001's feature module convention.

---

## 5. Missing Considerations

### 5.1 [HIGH] localStorage Schema Migration Strategy

Both ADRs modify the Redux state shape (ADR-001's `createEntityAdapter` changes `byId`/`allIds` to `entities`/`ids`; ADR-002's node type rename changes `kedroNode` to `taskNode`). The `saveProjectToLocalStorage` function serializes state directly. The `loadProjectFromLocalStorage` function validates with Zod schemas. Neither ADR addresses:

- How to handle existing localStorage data that was saved with the old schema
- Whether the Zod schemas need versioning
- What happens to users' saved projects during the migration

**Recommendation:** Add a data migration strategy as a prerequisite to both ADRs. Implement a version field in the stored data and write explicit migration functions.

### 5.2 [HIGH] Multi-Tab Data Consistency

DISCOVERY.md Section 19 identifies "Concurrent browser tabs: Silent data loss, last-write-wins" as a MEDIUM risk. Neither ADR addresses this. The auto-save middleware at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/store/middleware/autoSaveMiddleware.ts` writes to localStorage without any concurrency control. With the proposed split state ownership (ADR-002), positions are only saved on drag-end, creating a wider window where two tabs could diverge.

**Recommendation:** Add a `BroadcastChannel` or `storage` event listener to detect concurrent tab writes. At minimum, warn the user if another tab has modified the data.

### 5.3 [MEDIUM] Keyboard Shortcuts During Hook Consolidation

ADR-002 Section 7 consolidates 10 hooks into 6+2 but lists `useCanvasKeyboardShortcuts` as "unchanged." The current implementation at `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/hooks/useCanvasKeyboardShortcuts.ts` receives `onCopy`, `onPaste`, and `onDelete` as props from `useSelectionHandlers`, which in turn receives `selectedNodeIds` and `reduxNodes` from `useCanvasState`. When `useCanvasState` is removed (ADR-002), the data flow to `useCanvasKeyboardShortcuts` must change.

Furthermore, the keyboard shortcuts hook attaches `window.addEventListener('keydown', ...)` with a dependency array that includes `reduxNodes` and `reduxDatasets` (line 96). This means the event listener is re-attached every time a node or dataset changes. This is a performance issue that neither ADR addresses.

**Recommendation:** Refactor keyboard shortcuts to use `useRef` for the callback functions, avoiding dependency array churn. Document the new data flow path after hook consolidation.

### 5.4 [MEDIUM] Undo/Redo Architectural Compatibility

As noted in Challenge 2.7, neither ADR considers undo/redo. With the split state ownership (ADR-002), implementing undo/redo becomes harder because you need to undo both Redux domain state AND ReactFlow visual state (positions). `redux-undo` only handles the Redux side.

### 5.5 [MEDIUM] SCSS-to-Tailwind Migration Path

CLAUDE.md specifies Tailwind CSS. Both ADRs continue using SCSS. ADR-001 defers this to a follow-up. However, the ADR-002 node component patterns cement SCSS patterns further by creating new SCSS files (`ParameterNode.scss`). Adding more SCSS makes a future Tailwind migration harder.

**Recommendation:** If Tailwind is the long-term target, stop creating new SCSS files now. New components (like `ParameterNode`) should use Tailwind from the start, even if existing components remain SCSS.

### 5.6 [LOW] Error Boundary Placement

Neither ADR mentions error boundaries. The current `ErrorBoundary` component exists in `src/components/UI/ErrorBoundary/`. With the feature module pattern, a crash in one feature (e.g., `code-viewer`) should not take down the entire application. Error boundaries should be placed at feature module boundaries.

### 5.7 [LOW] Accessibility (a11y) During Refactoring

Neither ADR mentions accessibility. DISCOVERY.md recommendation #25 lists "Accessibility audit (ARIA, keyboard nav)" as P3. The keyboard shortcuts implementation at `useCanvasKeyboardShortcuts.ts` already handles editable element detection (lines 38-41), but ARIA labels for nodes, edges, and canvas interactions are not discussed.

---

## 6. Recommended Changes

### ADR-001 Amendments

1. **Section 1 (Context):** Change "Zero `React.memo` usage" to "memo() is present on ReactFlow nodes/edges but is defeated by the `useLayoutEffect` sync pattern that replaces entire arrays on every Redux change."

2. **Section 2.1 item 4:** Remove or correct the claim about localStorage side effects in `themeSlice`. Verify against commit 287c4da.

3. **Section 2.5 (Data Flow Pattern):** Amend to state: "Redux is the source of truth for domain data. ReactFlow owns ephemeral visual state during user interactions. Final positions are persisted to Redux on interaction completion (drag-end, resize-end)." This aligns with ADR-002.

4. **Section 2.7:** Remove "Phase 2 (Future consideration)" since ADR-002 already makes this decision. Replace with a reference to ADR-002.

5. **Section 2.10 item 1:** Change from "Add React.memo" to "Ensure memo() is not defeated: fix the array replacement pattern described in ADR-002."

6. **Section 2.10 item 3:** Change `createEntityAdapter` from "Phase 2.4 deliverable" to "Deferred to post-refactoring." Fix the O(n^2) deleteNodes with a `Set` in the current pattern instead.

7. **Section 5 (Migration Plan):** Add rollback strategy. Each phase gets its own branch. Add explicit ordering dependency on ADR-002 steps.

8. **Section 6 (Open Questions):** Add questions for undo/redo compatibility, localStorage schema versioning, and CLAUDE.md update requirement.

9. **Section 7 (Metrics):** Fix the `React.memo` row to show `Current = 3, Target = 3 (effectiveness improved)`.

### ADR-002 Amendments

1. **Section 1 (State Ownership):** Replace the `defaultNodes` uncontrolled mode approach with controlled mode using selective change handling. The key optimization (dispatch only on drag-end) is orthogonal to controlled vs uncontrolled mode.

2. **Section 1 (useNodeDataSync):** Rewrite to handle node additions and deletions, not just data updates. The current implementation only maps over `currentNodes`, which misses new nodes.

3. **Migration Step 2:** Add explicit handling for node creation, deletion, and paste operations in the new sync pattern.

4. **Migration Step 5 (Parameter Node):** Move to a separate ADR or defer to post-refactoring.

5. **Appendix A (File Structure):** Change `src/components/Canvas/` to `src/features/pipeline-canvas/` to match ADR-001.

6. **Risks table:** Add entries for: (a) `defaultNodes` not updating after mount, (b) paste operations creating orphaned nodes, (c) batch position updates causing N dispatches.

7. **Section 5.1 (onSelectionDragStop):** Replace per-node dispatches with a single batched `batchUpdatePositions` action.

---

## 7. Risk Mitigation Additions

### For ADR-001 Risks Considered Section

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| createEntityAdapter changes state shape, breaking localStorage | High | High | Defer createEntityAdapter; fix O(n^2) with Set instead. Or add schema migration system first. |
| Feature extraction leaves dangling imports | Medium | Medium | Run `npm run typecheck` after each file move. Add CI check. |
| CLAUDE.md says Zustand, code uses Redux | High | Medium | Update CLAUDE.md immediately as part of Phase 2.2. |
| Zero test coverage means bugs introduced during refactoring are undetectable | High | High | Add smoke tests for critical paths BEFORE restructuring, not after (move Phase 2.8 earlier). |
| Multi-tab localStorage conflict during save | Medium | Medium | Add `storage` event listener to detect external writes and warn user. |

### For ADR-002 Risks Considered Section

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| defaultNodes does not update after mount; new nodes do not appear | High | Critical | Use controlled mode instead. |
| Copy/paste creates nodes that are in Redux but not in ReactFlow | High | High | Ensure the sync mechanism handles additions, not just updates. |
| Batch drag-stop dispatches N individual actions | Medium | Medium | Add `batchUpdatePositions` action. |
| useNodeDataSync creates stale closure over Redux state | Medium | High | Use `useEffect` dependencies carefully; add integration test for rename-during-drag scenario. |
| Position not saved if browser tab is closed during drag (not just crash) | Medium | Low | Accept this risk; document as known limitation. |
| Escape key cancels drag but onNodeDragStop still fires with intermediate position | Medium | Medium | Test with @xyflow/react 12.8.6 specifically; capture pre-drag position in `onNodeDragStart`. |

---

## Summary of Blocking Issues

The following must be resolved before either ADR moves to "Accepted":

1. **Harmonize ADR-001 and ADR-002 on state ownership** -- they currently contradict each other on the most fundamental architectural question.
2. **Fix the `defaultNodes` / uncontrolled mode proposal in ADR-002** -- it will break node creation and deletion. Use controlled mode with selective change handling instead.
3. **Correct the factual errors in ADR-001** -- "zero React.memo" and "themeSlice side effects" are wrong and undermine the document's credibility.
4. **Establish a unified migration order** that accounts for dependencies between the two ADRs.
5. **Add a localStorage schema migration strategy** before any state shape changes.