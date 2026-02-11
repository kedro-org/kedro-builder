# ADR-001: Target Architecture for Kedro Builder Refactoring

## Status

Proposed

## Date

2026-02-11

## Authors

Architecture review conducted during Phase 2.1 of the Kedro Builder refactoring project.

---

## 1. Context

Kedro Builder is a fully client-side React SPA that provides a visual drag-and-drop pipeline builder for Kedro data pipelines. The application was built as an MVP/prototype and has reached ~160 source files across ~17K LOC. A Phase 1 discovery audit identified the following critical and high-priority issues:

1. **CRITICAL**: Generated Python code uses `Node()` (class constructor) instead of `node()` (factory function) -- incorrect Kedro API
2. **HIGH**: ID collision risk from `Date.now()` without random suffix
3. **HIGH**: Zero `React.memo` usage; `CodeDisplay` subscribes to entire root state object
4. **HIGH**: ~140KB of dead/unused dependencies in the bundle
5. **HIGH**: Zero component, hook, or integration tests
6. **MEDIUM**: Redux-to-ReactFlow dual-state synchronization fragility (`useLayoutEffect` sync)
7. **MEDIUM**: Validation system duplication (legacy `pipelineValidation.ts` is active; Strategy pattern validators are dead code)
8. **MEDIUM**: O(n^2) in `deleteNodes` reducer (filters `allIds` per deleted ID inside a loop)

The existing CLAUDE.md configuration file states a target of Zustand for state management, but the codebase currently uses Redux Toolkit with 7 slices, normalized state (byId/allIds pattern), 2 middleware functions, and memoized selectors via `createSelector`. This ADR evaluates the trade-offs and provides the definitive architectural direction.

### Current Architecture Summary

**State Management**: Redux Toolkit with 7 slices:
- `project` -- current project metadata, saved list
- `nodes` -- normalized node entities with multi-select
- `datasets` -- normalized dataset entities with multi-select
- `connections` -- normalized connection entities with multi-select
- `ui` -- modal visibility, config panel, tutorial/walkthrough state, canvas state
- `validation` -- validation errors/warnings from pipeline checks
- `theme` -- light/dark theme toggle

**Middleware**:
- `autoSaveMiddleware` -- debounced (500ms) localStorage persistence triggered by data-change actions
- `preferencesMiddleware` -- persists theme and onboarding flags to localStorage

**Component Structure**: Flat directory under `src/components/` with 16 subdirectories, no feature-based grouping. Hooks are co-located with Canvas but scattered elsewhere.

**Domain Layer**: Clean separation at `src/domain/` (IdGenerator, PipelineGraph) and `src/infrastructure/` (export generators, localStorage, telemetry).

**ReactFlow Integration**: Dual-state pattern where Redux is the source of truth and ReactFlow's internal `useNodesState`/`useEdgesState` are synced via `useLayoutEffect`. Position changes during drag are dispatched to Redux on every frame.

---

## 2. Decision

### 2.1 State Management: Keep Redux Toolkit (Do NOT Migrate to Zustand)

**Decision**: Retain Redux Toolkit as the state management solution. Do not migrate to Zustand.

**Rationale**:

| Factor | Redux Toolkit (Keep) | Zustand (Migrate) |
|--------|---------------------|--------------------|
| **Existing investment** | 7 slices, 2 middleware, ~20 selectors already working | Must rewrite everything |
| **Normalized state** | Built-in `createEntityAdapter` available; current byId/allIds pattern is idiomatic RTK | Must hand-roll normalization or use a helper library |
| **Middleware** | Auto-save and preferences middleware are clean and idiomatic | Zustand `subscribe` can replicate, but loses action-type filtering |
| **DevTools** | Redux DevTools with action replay, time-travel debugging | Zustand DevTools exist but are less mature |
| **Selectors** | `createSelector` memoization with input selectors is battle-tested | Zustand selectors work differently (shallow equality comparison) |
| **Migration risk** | Zero -- already works | HIGH -- must port all 7 slices, 2 middleware, ~50 dispatch sites, ~80 useAppSelector calls simultaneously |
| **Team familiarity** | Current codebase is Redux-based; contributors know the patterns | Requires learning new patterns |
| **Bundle size** | @reduxjs/toolkit ~11KB gzipped, react-redux ~5KB | Zustand ~1.5KB gzipped (saves ~14KB, but not a deciding factor at this scale) |

The primary issues are not caused by Redux itself:
- The Redux-to-ReactFlow sync fragility is caused by the dual-state pattern, which would exist with Zustand too.
- The CodeDisplay subscribing to entire root state is a selector bug, not a Redux limitation.
- Zero `React.memo` is independent of state management choice.

**What we WILL do with Redux**:
1. Introduce `createEntityAdapter` for nodes, datasets, and connections slices to eliminate boilerplate and fix the O(n^2) `deleteNodes` bug
2. Fix all selector granularity issues (especially CodeDisplay's full-root subscription)
3. Add `React.memo` to all leaf components that receive Redux data
4. Move all localStorage side effects into middleware (some still leak into reducers in `themeSlice`)
5. Consolidate to typed `useAppDispatch` and `useAppSelector` everywhere (some files import raw `useSelector`)

### 2.2 Target Folder Structure

```
src/
├── app/                              # Application shell
│   ├── App.tsx                       # Root component
│   ├── AppHeader.tsx                 # Header bar
│   ├── AppLayout.tsx                 # Main layout (sidebar + canvas + config panel)
│   ├── providers/                    # React context providers
│   │   └── StoreProvider.tsx         # Redux Provider wrapper
│   ├── hooks/                        # App-level hooks
│   │   ├── useAppInitialization.ts   # Load from localStorage on mount
│   │   └── useValidation.ts         # Export validation orchestration
│   └── app.scss
│
├── components/                       # Shared, reusable UI components
│   ├── ui/                          # Primitive design system components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.scss
│   │   │   └── Button.test.tsx
│   │   ├── Input/
│   │   ├── ConfirmDialog/
│   │   ├── ErrorBoundary/
│   │   ├── FilepathBuilder/
│   │   ├── SearchableSelect/
│   │   └── ThemeToggle/
│   ├── forms/                       # Shared form primitives (if extracted)
│   └── layouts/                     # Layout shells (if needed beyond AppLayout)
│
├── features/                        # Feature modules (bounded contexts)
│   │
│   ├── pipeline-canvas/             # CORE: The ReactFlow canvas
│   │   ├── components/
│   │   │   ├── PipelineCanvas.tsx   # Main canvas wrapper + ReactFlowProvider
│   │   │   ├── CustomNode.tsx       # Kedro function node renderer
│   │   │   ├── DatasetNode.tsx      # Dataset node renderer
│   │   │   ├── CustomEdge.tsx       # Edge renderer
│   │   │   ├── CanvasOverlay.tsx    # Empty state + bulk actions toolbar
│   │   │   ├── CanvasControls.tsx   # Minimap, zoom controls
│   │   │   ├── GhostPreview.tsx     # Ghost during connection drag
│   │   │   └── EdgeContextMenu.tsx
│   │   ├── hooks/
│   │   │   ├── useCanvasState.ts    # Redux -> ReactFlow sync
│   │   │   ├── useConnectionHandlers.ts
│   │   │   ├── useNodeHandlers.ts
│   │   │   ├── useSelectionHandlers.ts
│   │   │   ├── useDragToCreate.ts
│   │   │   ├── useGhostPreview.ts
│   │   │   ├── useCopyPaste.ts
│   │   │   ├── useDeleteConfirmation.ts
│   │   │   └── useCanvasKeyboardShortcuts.ts
│   │   ├── utils/
│   │   │   └── cycleDetection.ts
│   │   ├── types.ts                 # Canvas-specific types
│   │   └── index.ts                 # Public API: { PipelineCanvas }
│   │
│   ├── node-palette/                # Sidebar component palette
│   │   ├── components/
│   │   │   ├── ComponentPalette.tsx
│   │   │   ├── NodeCard.tsx
│   │   │   └── DatasetCard.tsx
│   │   ├── types.ts
│   │   └── index.ts                 # Public API: { ComponentPalette }
│   │
│   ├── config-panel/                # Right-side configuration panel
│   │   ├── components/
│   │   │   ├── ConfigPanel.tsx      # Panel shell with close/delete logic
│   │   │   ├── NodeConfigForm.tsx
│   │   │   ├── DatasetConfigForm.tsx
│   │   │   └── DatasetTypeSelect.tsx
│   │   ├── hooks/
│   │   │   └── useFilepathBuilder.ts
│   │   ├── types.ts
│   │   └── index.ts                 # Public API: { ConfigPanel }
│   │
│   ├── code-viewer/                 # Code preview modal
│   │   ├── components/
│   │   │   ├── CodeViewerModal.tsx
│   │   │   ├── CodeDisplay.tsx
│   │   │   └── FileTree.tsx
│   │   ├── types.ts
│   │   └── index.ts                 # Public API: { CodeViewerModal }
│   │
│   ├── export-wizard/               # Export validation + ZIP generation wizard
│   │   ├── components/
│   │   │   ├── ExportWizard.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── ValidationStepContent.tsx
│   │   │   └── ConfigureStepContent.tsx
│   │   ├── types.ts
│   │   └── index.ts                 # Public API: { ExportWizard }
│   │
│   ├── validation-panel/            # Inline validation results panel
│   │   ├── components/
│   │   │   ├── ValidationPanel.tsx
│   │   │   └── ValidationItem.tsx
│   │   ├── types.ts
│   │   └── index.ts                 # Public API: { ValidationPanel }
│   │
│   ├── project-setup/               # Project creation/edit modal
│   │   ├── components/
│   │   │   └── ProjectSetupModal.tsx
│   │   ├── types.ts
│   │   └── index.ts                 # Public API: { ProjectSetupModal }
│   │
│   ├── onboarding/                  # Tutorial + Walkthrough (merged)
│   │   ├── components/
│   │   │   ├── TutorialModal.tsx
│   │   │   ├── WalkthroughOverlay.tsx
│   │   │   └── WalkthroughCard.tsx
│   │   ├── hooks/
│   │   │   └── useWalkthroughPosition.ts
│   │   ├── content/
│   │   │   ├── tutorialContent.ts
│   │   │   └── walkthroughContent.ts
│   │   └── index.ts                 # Public API: { TutorialModal, WalkthroughOverlay }
│   │
│   ├── settings/                    # Settings modal
│   │   ├── components/
│   │   │   └── SettingsModal.tsx
│   │   └── index.ts
│   │
│   ├── feedback/                    # Feedback button + modal
│   │   ├── components/
│   │   │   ├── FeedbackButton.tsx
│   │   │   └── FeedbackModal.tsx
│   │   └── index.ts
│   │
│   └── telemetry-consent/           # GDPR consent banner
│       ├── components/
│       │   └── TelemetryConsent.tsx
│       └── index.ts
│
├── store/                           # Redux store configuration
│   ├── index.ts                     # configureStore + type exports
│   ├── hooks.ts                     # useAppDispatch, useAppSelector
│   ├── slices/                      # All Redux slices (moved from features/)
│   │   ├── projectSlice.ts
│   │   ├── nodesSlice.ts
│   │   ├── datasetsSlice.ts
│   │   ├── connectionsSlice.ts
│   │   ├── uiSlice.ts
│   │   ├── validationSlice.ts
│   │   └── themeSlice.ts
│   ├── selectors/                   # All memoized selectors
│   │   ├── canvasSelectors.ts
│   │   ├── nodesSelectors.ts
│   │   ├── datasetsSelectors.ts
│   │   ├── connectionsSelectors.ts
│   │   ├── uiSelectors.ts
│   │   ├── projectSelectors.ts
│   │   └── validationSelectors.ts
│   └── middleware/                   # Redux middleware
│       ├── autoSaveMiddleware.ts
│       └── preferencesMiddleware.ts
│
├── domain/                          # Pure business logic (no React, no Redux)
│   ├── IdGenerator.ts               # ID generation with crypto.randomUUID fallback
│   ├── PipelineGraph.ts             # Graph operations (cycle detection, orphans)
│   └── index.ts
│
├── infrastructure/                  # External service adapters
│   ├── export/                      # Kedro project ZIP generation
│   │   ├── KedroProjectBuilder.ts   # Builder pattern orchestrator
│   │   ├── catalogGenerator.ts
│   │   ├── pipelineGenerator.ts     # FIX: node() not Node()
│   │   ├── nodesGenerator.ts
│   │   ├── registryGenerator.ts
│   │   ├── pyprojectGenerator.ts
│   │   ├── staticFilesGenerator.ts
│   │   ├── helpers.ts
│   │   └── index.ts
│   ├── localStorage/                # Persistence layer
│   │   ├── localStorage.ts
│   │   ├── schemas.ts               # Zod validation schemas
│   │   └── index.ts
│   └── telemetry/                   # Analytics
│       ├── telemetry.ts
│       └── index.ts
│
├── hooks/                           # Shared custom hooks (used by 2+ features)
│   ├── useClearSelections.ts
│   ├── useSelectAndOpenConfig.ts
│   ├── useConfirmDialog.ts
│   └── useTelemetry.ts
│
├── types/                           # Shared TypeScript types
│   ├── kedro.ts                     # Domain model types
│   ├── ids.ts                       # Branded ID types
│   ├── redux.ts                     # Redux state shape types
│   ├── reactflow.ts                 # ReactFlow type aliases
│   └── index.ts                     # Barrel export
│
├── constants/                       # Application constants
│   ├── canvas.ts
│   ├── datasetTypes.ts
│   ├── dnd.ts
│   ├── events.ts
│   ├── fileTree.ts
│   ├── storage.ts
│   ├── timing.ts
│   └── index.ts
│
├── utils/                           # Pure utility functions
│   ├── logger.ts
│   ├── filepath.ts
│   ├── fileTreeGenerator.ts
│   └── validation/                  # Pipeline validation logic
│       ├── pipelineValidation.ts    # Active validation (to be refactored)
│       ├── inputValidation.ts       # Real-time form validation
│       ├── types.ts
│       ├── validators/              # Strategy pattern (to replace pipelineValidation.ts)
│       │   ├── Validator.ts
│       │   ├── CircularDependencyValidator.ts
│       │   ├── DuplicateNameValidator.ts
│       │   ├── EmptyNameValidator.ts
│       │   ├── InvalidNameValidator.ts
│       │   ├── MissingCodeValidator.ts
│       │   ├── MissingConfigValidator.ts
│       │   ├── OrphanedNodeValidator.ts
│       │   ├── OrphanedDatasetValidator.ts
│       │   └── index.ts
│       └── index.ts
│
├── styles/                          # Global styles
│   ├── globals.scss
│   ├── _variables.scss
│   ├── _mixins.scss
│   └── _extends.scss
│
├── test/                            # Test infrastructure
│   ├── setup.ts
│   ├── fixtures/
│   │   └── mockData.ts
│   ├── utils/
│   │   ├── testUtils.tsx            # renderWithProviders, createMockStore
│   │   └── mockStore.ts
│   └── contracts/                   # Contract tests
│       ├── events.contracts.test.ts
│       ├── idFormats.contracts.test.ts
│       └── localStorage.contracts.test.ts
│
├── assets/                          # Static assets
│   └── kedro-template.svg
│
└── main.tsx                         # Entry point
```

### 2.3 Path Aliases

Add `@/` path alias in `tsconfig.app.json` and `vite.config.ts`:

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```typescript
// vite.config.ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

All imports will use `@/` for absolute paths:
```typescript
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/Button/Button';
import { PipelineCanvas } from '@/features/pipeline-canvas';
```

### 2.4 Component Hierarchy

```
<StrictMode>
  <StoreProvider>                          # Redux Provider
    <App>                                  # Root: theme, telemetry init
      ├── <AppHeader>                      # Header bar with actions
      │   └── <SettingsModal />            # Settings (lazy)
      ├── <AppLayout>                      # 3-column layout
      │   ├── <ComponentPalette />         # Left sidebar (node-palette feature)
      │   ├── <PipelineCanvas />           # Center (pipeline-canvas feature)
      │   │   ├── <ReactFlowProvider>
      │   │   │   └── <ReactFlow>
      │   │   │       ├── <CustomNode />   # memo'd
      │   │   │       ├── <DatasetNode />  # memo'd
      │   │   │       └── <CustomEdge />   # memo'd
      │   │   ├── <CanvasOverlay />
      │   │   │   ├── <EmptyState />
      │   │   │   └── <BulkActionsToolbar />
      │   │   ├── <CanvasControls />
      │   │   ├── <GhostPreview />
      │   │   └── <ConfirmDialog />
      │   └── <ConfigPanel />              # Right sidebar (config-panel feature)
      │       ├── <NodeConfigForm />
      │       └── <DatasetConfigForm />
      ├── <TutorialModal />                # Overlay (onboarding feature)
      ├── <WalkthroughOverlay />           # Overlay (onboarding feature)
      ├── <ProjectSetupModal />            # Modal (project-setup feature)
      ├── <CodeViewerModal />              # Modal (code-viewer feature)
      ├── <ValidationPanel />              # Panel (validation-panel feature)
      ├── <ExportWizard />                 # Panel (export-wizard feature)
      ├── <TelemetryConsent />             # Banner (telemetry-consent feature)
      ├── <FeedbackButton />               # Fixed button (feedback feature)
      └── <Toaster />                      # Toast notifications (react-hot-toast)
    </App>
  </StoreProvider>
</StrictMode>
```

### 2.5 Data Flow Pattern

```
┌─────────────────────────────────────────────────────┐
│                    Redux Store                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ nodes    │ │ datasets │ │ connections      │    │
│  │ byId/Ids │ │ byId/Ids │ │ byId/Ids         │    │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘    │
│       │             │                │               │
│  ┌────┴─────────────┴────────────────┴─────────┐    │
│  │        canvasSelectors (memoized)            │    │
│  │   selectCanvasDataWithSets                   │    │
│  └────────────────────┬────────────────────────┘    │
└───────────────────────┼──────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ useCanvasState  │  Converts Redux → ReactFlow format
              │ (single hook)   │  Sets for O(1) selection lookup
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │useNode   │ │useConnect│ │useSelection  │
   │Handlers  │ │Handlers  │ │Handlers      │
   └──────┬───┘ └────┬─────┘ └──────┬───────┘
          │          │               │
          ▼          ▼               ▼
   ┌─────────────────────────────────────────┐
   │           <ReactFlow />                  │
   │  Nodes, Edges, Handlers all injected    │
   └─────────────────────────────────────────┘
          │
          │  User interactions dispatch Redux actions
          │  Redux changes → selector recomputes → useLayoutEffect syncs
          ▼
   Back to Redux Store (cycle)
```

**Key architectural invariant**: Redux is the single source of truth. ReactFlow's internal state is a derived mirror. All mutations go through Redux actions; ReactFlow state is synced via `useLayoutEffect` when selectors produce new values.

### 2.6 Public API Surface per Feature

Each feature module exports only its public API through its `index.ts`. Internal components, hooks, and types are not re-exported.

| Feature | Public Exports | Consumed By |
|---------|---------------|-------------|
| `pipeline-canvas` | `PipelineCanvas` | `AppLayout` |
| `node-palette` | `ComponentPalette` | `AppLayout` |
| `config-panel` | `ConfigPanel` | `AppLayout` |
| `code-viewer` | `CodeViewerModal` | `App` |
| `export-wizard` | `ExportWizard` | `App` |
| `validation-panel` | `ValidationPanel` | `App` |
| `project-setup` | `ProjectSetupModal` | `App` |
| `onboarding` | `TutorialModal`, `WalkthroughOverlay` | `App` |
| `settings` | `SettingsModal` | `AppHeader` |
| `feedback` | `FeedbackButton` | `App` |
| `telemetry-consent` | `TelemetryConsent` | `App` |

**Enforcement**: ESLint rule `no-restricted-imports` will prevent importing from feature internals (e.g., `@/features/pipeline-canvas/hooks/useCanvasState` is forbidden; only `@/features/pipeline-canvas` is allowed).

### 2.7 ReactFlow Sync Architecture Improvement

The current dual-state sync (Redux -> `useLayoutEffect` -> ReactFlow) is the biggest architectural fragility. The target architecture addresses this:

**Phase 1 (Immediate)**: Keep the current pattern but harden it:
- Ensure `useCanvasState` is the ONLY place that converts Redux to ReactFlow format
- Add `Object.freeze` in dev mode on the output to catch accidental mutations
- Add comprehensive tests for the sync behavior

**Phase 2 (Future consideration)**: Evaluate making ReactFlow the source of truth for visual-only state (positions, viewport) while keeping Redux for domain data (names, types, connections). This is a larger architectural change that should be evaluated after the refactoring stabilizes.

### 2.8 Validation System Consolidation

**Decision**: Activate the Strategy pattern validators; delete the legacy `pipelineValidation.ts` functions.

The current state has two validation systems:
1. **Active (legacy)**: `pipelineValidation.ts` with standalone functions like `checkCircularDependencies(state)` that take `RootState`
2. **Dead code (new)**: Strategy pattern `Validator` classes in `validators/` directory that are exported but never called from production code

The Strategy pattern validators are the better design because:
- They are composable and individually testable
- New validators can be added without modifying existing code (Open/Closed Principle)
- The `ValidatorRegistry` provides a clean pipeline for running all validators
- They accept a clean data interface, not the raw Redux state shape

**Migration**: Wire the `ValidatorRegistry` into the export wizard and validation panel. Delete the standalone functions. Add adapter functions to convert Redux state to the validator input interface.

### 2.9 ID Generation Fix

**Decision**: Replace `Date.now()` with `crypto.randomUUID()` for ID generation, with a `Date.now()` + random suffix fallback.

```typescript
export function generateNodeId(): NodeId {
  return `node-${crypto.randomUUID()}` as NodeId;
}
```

This eliminates the collision risk when two items are created within the same millisecond (common during paste operations or fast UI interactions). The branded ID types and type guards remain unchanged since they only check the prefix.

### 2.10 Performance Fixes

1. **`React.memo` on all ReactFlow node/edge renderers**: `CustomNode`, `DatasetNode`, `CustomEdge` must be wrapped in `memo()` with a custom comparator that checks `data` and `selected` equality.

2. **Fix CodeDisplay root state subscription**: Replace `useAppSelector((rootState) => rootState)` with granular selectors:
   ```typescript
   const projectCurrent = useAppSelector(selectProjectCurrent);
   const nodeIds = useAppSelector(selectNodesAllIds);
   const datasetIds = useAppSelector(selectDatasetsAllIds);
   const connectionIds = useAppSelector(selectConnectionsAllIds);
   ```

3. **`createEntityAdapter`**: Migrate nodes, datasets, and connections slices to use RTK's `createEntityAdapter` for:
   - Built-in normalized CRUD operations
   - Optimized `removeMany` (fixes O(n^2) `deleteNodes`)
   - Auto-generated selectors

4. **Dead dependency removal**: Audit and remove `react-syntax-highlighter`, `prism-react-renderer`, `dexie`, `handlebars`, and any other unused packages identified in Phase 1.

---

## 3. Consequences

### What Becomes Easier

- **Feature isolation**: Each feature is a self-contained module with explicit public API. New team members can understand a feature by reading its `index.ts` and drilling down.
- **Testing**: Feature modules can be tested in isolation. The `domain/` and `infrastructure/` layers are pure functions with zero React dependencies, making them trivially testable.
- **Code navigation**: `@/` aliases make imports self-documenting. No more `../../../../store/hooks`.
- **Performance**: `React.memo`, granular selectors, and `createEntityAdapter` will eliminate unnecessary re-renders.
- **Correctness**: `crypto.randomUUID()` eliminates ID collisions. Fixed Kedro API (`node()` vs `Node()`) ensures generated code actually works.
- **Adding new features**: Drop a new folder in `features/`, export from `index.ts`, import from `App`.

### What Becomes Harder

- **Cross-feature state access**: Features that need state from another feature must go through the global store (selectors), not direct imports. This is intentional -- it forces explicit dependencies.
- **Moving files**: The deeper nesting means file paths are longer. However, `@/` aliases mitigate this.
- **Initial learning curve**: Contributors must understand the feature module pattern and respect public API boundaries.

### What Stays the Same

- **Redux fundamentals**: Dispatch actions, use selectors, write reducers. Same mental model.
- **ReactFlow integration**: Same dual-state sync pattern (hardened, not replaced).
- **Domain layer**: `PipelineGraph`, `IdGenerator` remain pure. They gain better tests but no structural changes.
- **Infrastructure layer**: Export generators, localStorage, telemetry keep their current structure.

---

## 4. Alternatives Considered

### 4.1 Migrate to Zustand

**Pros**:
- Smaller bundle (~1.5KB vs ~16KB)
- Less boilerplate for simple stores
- No Provider wrapper needed
- Matches CLAUDE.md aspiration

**Cons**:
- HIGH migration risk: Must port 7 slices, 2 middleware, ~50 dispatch calls, ~80 selector calls, 20+ memoized selectors simultaneously
- No incremental migration path (Redux and Zustand cannot share state cleanly)
- Loses Redux DevTools time-travel debugging
- Normalized state patterns are more verbose in Zustand
- Middleware action-type filtering must be hand-rolled
- Team must learn new patterns during an already-complex refactoring

**Verdict**: Rejected. The risk-reward ratio does not justify the migration during this refactoring. The issues found in Phase 1 are not caused by Redux. If the team wants Zustand in the future, the feature-based architecture makes a future migration easier because each feature's store access is isolated behind its hooks.

### 4.2 Use ReactFlow as Source of Truth (Eliminate Dual State)

**Pros**:
- Eliminates sync bugs
- Simpler mental model for canvas interactions
- ReactFlow handles positions natively

**Cons**:
- ReactFlow's internal state shape is not designed for domain operations (validation, code generation, export)
- Would need to extract domain data from ReactFlow on demand, which is less reliable than a normalized Redux store
- Auto-save middleware would need to serialize ReactFlow's internal state, which is an implementation detail
- Makes testing harder (ReactFlow's state is not easily mockable)

**Verdict**: Rejected. Redux as source of truth is the correct architectural choice. The sync is fragile but fixable with better encapsulation and testing.

### 4.3 Flat Feature Structure (No Nesting)

```
features/pipeline-canvas.tsx   # Single file per feature
features/config-panel.tsx
```

**Pros**: Simpler, fewer directories.

**Cons**: Single-file features cannot scale. `PipelineCanvas` alone pulls in 10 hooks and 7 sub-components. Flat structure would force either huge files or return to the scattered imports problem.

**Verdict**: Rejected.

---

## 5. Migration Plan

### Phase Ordering Principle

Each phase must leave the application in a working state. Changes are ordered by:
1. **Safety first**: Fix bugs that affect correctness before restructuring
2. **Infrastructure before features**: Set up path aliases, test utilities before moving files
3. **Inside-out**: Fix domain/infrastructure layers before touching React components
4. **One concern per phase**: Each phase addresses a single architectural concern

### Phase 2.2: Critical Bug Fixes (Week 1)

These fixes are independent of the restructuring and should land first.

1. **Fix generated Kedro API** (`pipelineGenerator.ts`):
   - Change `from kedro.pipeline import Node` to `from kedro.pipeline import node`
   - Change `Node(func=..., inputs=..., outputs=...)` to `node(func=..., inputs=..., outputs=...)`
   - Add unit tests for the generated Python code

2. **Fix ID collisions** (`IdGenerator.ts`):
   - Replace `Date.now()` with `crypto.randomUUID()`
   - Add `Date.now()-${Math.random().toString(36).slice(2, 9)}` fallback for environments without `crypto.randomUUID`
   - Update existing tests and ID format contract tests

3. **Fix CodeDisplay full-state subscription** (`CodeDisplay.tsx`):
   - Replace `useAppSelector((rootState) => rootState)` with granular selectors
   - Memoize `generateFileTree` with the correct dependency array

4. **Fix O(n^2) deleteNodes** (`nodesSlice.ts`):
   - Use a `Set` for IDs to delete, then single-pass filter
   - Same fix for `datasetsSlice.ts` `deleteDatasets`

**Verification**: `npm run typecheck && npm run test` passes. Manual smoke test of export and canvas operations.

### Phase 2.3: Infrastructure Setup (Week 1-2)

1. **Add `@/` path alias** to `tsconfig.app.json` and `vite.config.ts`
2. **Add ESLint import order rule** enforcing the import order from CLAUDE.md
3. **Add test utilities**: `renderWithProviders`, `createMockStore` helpers
4. **Add `React.memo`** to `CustomNode`, `DatasetNode`, `CustomEdge` with custom comparators

**Verification**: All existing tests pass. Import alias works in dev and build.

### Phase 2.4: Store Restructuring (Week 2)

1. **Move slices** from `src/features/*/` to `src/store/slices/`
2. **Move selectors** to `src/store/selectors/`
3. **Migrate to `createEntityAdapter`** for nodes, datasets, connections slices
4. **Consolidate imports**: Ensure all files use `@/store/hooks` for `useAppDispatch`/`useAppSelector`
5. **Move localStorage side effects** out of `themeSlice` initial state computation into middleware

**Verification**: All existing tests pass. Redux DevTools shows same state shape. Auto-save still works.

### Phase 2.5: Feature Module Extraction (Week 2-3)

Extract features one at a time in this dependency order (least dependent first):

1. `telemetry-consent` (zero dependencies on other features)
2. `feedback` (zero dependencies on other features)
3. `settings` (depends only on store)
4. `onboarding` (tutorial + walkthrough merged; depends on store)
5. `project-setup` (depends on store)
6. `validation-panel` (depends on store)
7. `node-palette` (depends on store + constants)
8. `config-panel` (depends on store + selectors)
9. `code-viewer` (depends on store + infrastructure/export)
10. `export-wizard` (depends on store + validation + infrastructure/export)
11. `pipeline-canvas` (most complex; depends on store + domain + most hooks)

For each feature:
- Create the feature directory structure
- Move components, hooks, types into it
- Create `index.ts` with public exports
- Update all import paths to use `@/features/feature-name`
- Run `npm run typecheck && npm run test`

**Verification**: Application works identically. No functionality changes.

### Phase 2.6: Validation Consolidation (Week 3)

1. Wire `ValidatorRegistry` and Strategy pattern validators into production code
2. Create adapter function to convert Redux state to validator input interface
3. Remove legacy `pipelineValidation.ts` standalone functions
4. Add comprehensive unit tests for each validator

**Verification**: Export wizard validation produces identical results. Validator tests provide >80% coverage of validation logic.

### Phase 2.7: Dead Code and Dependency Cleanup (Week 3-4)

1. Remove unused packages (`react-syntax-highlighter`, `prism-react-renderer`, `dexie`, `handlebars` -- verify each is truly unused)
2. Remove dead exports and unused internal functions
3. Run bundle analysis to verify size reduction
4. Add ESLint `no-restricted-imports` rule for feature boundary enforcement

**Verification**: Bundle size decreases. `npm run build` succeeds. Application works identically.

### Phase 2.8: Test Coverage Push (Week 4+)

1. Add unit tests for all `domain/` functions (PipelineGraph, IdGenerator)
2. Add unit tests for all `infrastructure/export/` generators
3. Add component tests for feature module public APIs
4. Add integration tests for critical flows:
   - Create project -> add node -> add dataset -> connect -> export
   - Load from localStorage -> verify state restored
   - Validation error flow -> fix -> re-validate

**Target**: >80% coverage of domain and infrastructure layers. >60% coverage of React components.

---

## 6. Open Questions

1. **SCSS to Tailwind migration**: CLAUDE.md mentions Tailwind CSS, but the current codebase uses SCSS with BEM conventions (~40 `.scss` files). Should we migrate? **Recommendation**: Defer. SCSS with BEM is working fine. A styling migration adds risk without fixing any of the identified issues. If desired, it can be done as a separate initiative after the refactoring stabilizes.

2. **React Hook Form adoption**: The codebase has `react-hook-form` as a dependency but `NodeConfigForm` and `DatasetConfigForm` use controlled components with `useState`. Should we migrate forms? **Recommendation**: Defer to a follow-up. The current forms work. Form library migration is lower priority than architectural restructuring.

3. **IndexedDB via Dexie**: `dexie` is in `package.json` but may be unused. If it IS used for large project storage, the localStorage-centric architecture needs to account for it. **Action**: Verify usage in Phase 2.7 before removing.

---

## 7. Metrics for Success

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Test coverage | ~5% (2 slice tests, 4 contract tests) | >80% domain/infra, >60% components | `npm run test:coverage` |
| Bundle size (gzipped) | Unknown (est. ~250-300KB) | <300KB | `vite build` + `gzip -9` |
| Max component LOC | ~270 (PipelineCanvas) | <300 | ESLint `max-lines` rule |
| Selector granularity | 1 full-root subscription, multiple inline selectors | Zero full-root subs, all via named selectors | Grep for `useAppSelector` patterns |
| `React.memo` on nodes/edges | 0 | 3 (CustomNode, DatasetNode, CustomEdge) | Code audit |
| Feature module count | 0 (flat components/) | 11 | `ls src/features/` |
| Dead dependencies | ~4-5 packages | 0 | Bundle analysis |
| ID collision risk | HIGH (Date.now()) | NONE (crypto.randomUUID()) | Code audit |
| Kedro API correctness | BROKEN (Node() uppercase) | FIXED (node() lowercase) | Unit test + manual export test |

---

## 8. Key Files Referenced in This ADR

For traceability, these are the primary files analyzed to produce this architecture:

- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/store/index.ts` -- Redux store configuration
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/nodes/nodesSlice.ts` -- Nodes slice with O(n^2) deleteNodes
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/datasets/datasetsSlice.ts` -- Datasets slice
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/connections/connectionsSlice.ts` -- Connections slice
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/ui/uiSlice.ts` -- UI slice (30+ actions)
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/theme/themeSlice.ts` -- Theme slice with localStorage in initial state
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/PipelineCanvas.tsx` -- Main canvas component
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/hooks/useCanvasState.ts` -- Redux-to-ReactFlow sync
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/hooks/useConnectionHandlers.ts` -- Connection creation with cycle detection
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/Canvas/hooks/useNodeHandlers.ts` -- Node CRUD with drag-and-drop
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/CodeViewer/CodeDisplay.tsx` -- Full root state subscription bug
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/domain/IdGenerator.ts` -- Date.now() collision risk
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/domain/PipelineGraph.ts` -- Graph operations
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/infrastructure/export/pipelineGenerator.ts` -- Incorrect Kedro API (Node vs node)
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/infrastructure/export/KedroProjectBuilder.ts` -- Builder pattern for ZIP export
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/utils/validation/pipelineValidation.ts` -- Legacy validation (active)
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/utils/validation/validators/Validator.ts` -- Strategy pattern validators (dead code)
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/types/redux.ts` -- Full Redux state type definitions
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/types/kedro.ts` -- Domain model types
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/types/ids.ts` -- Branded ID types
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/store/middleware/autoSaveMiddleware.ts` -- Debounced persistence
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/store/middleware/preferencesMiddleware.ts` -- Theme/onboarding persistence
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/App/App.tsx` -- Root component
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/components/App/AppLayout.tsx` -- 3-column layout
- `/Users/Jitendra_Gundaniya/QB/kedro-builder-pt copy/kedro-builder/src/features/canvas/canvasSelectors.ts` -- Memoized canvas selectors