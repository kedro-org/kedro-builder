# Kedro Builder - Phase 1 Discovery Report

> Generated: 2026-02-11 | Branch: develop | Commit: 287c4da

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [React Components](#3-react-components)
4. [State Management](#4-state-management)
5. [ReactFlow Usage](#5-reactflow-usage)
6. [Custom Hooks](#6-custom-hooks)
7. [Large Files (Refactoring Candidates)](#7-large-files-refactoring-candidates)
8. [External Dependencies](#8-external-dependencies)
9. [Type System](#9-type-system)
10. [Utilities & Helpers](#10-utilities--helpers)
11. [Test Coverage](#11-test-coverage)
12. [Build & Config](#12-build--config)
13. [Export & Code Generation](#13-export--code-generation)
14. [Validation System](#14-validation-system)
15. [Constants & Configuration](#15-constants--configuration)
16. [Architecture Patterns](#16-architecture-patterns)
17. [Data Flow](#17-data-flow)
18. [Storage & Persistence](#18-storage--persistence)
19. [Risk Assessment](#19-risk-assessment)
20. [Domain Alignment](#20-domain-alignment)
21. [Recommendations](#21-recommendations)

---

## 1. Project Overview

| Metric | Value |
|--------|-------|
| Source files (TS/TSX) | 160 |
| Total lines of code | ~16,945 |
| Test files | 12 |
| Test lines | ~3,174 |
| React version | 19.1.1 |
| TypeScript version | 5.9.3 |
| Build tool | Vite 5.4.8 |
| Flow library | @xyflow/react 12.8.6 |
| State management | Redux Toolkit 2.9.0 |
| Build status | Passing (chunk size warning >500KB) |

---

## 2. Directory Structure

```
src/
├── main.tsx                          # Entry point (13 lines)
├── App.scss                          # Global styles
├── components/
│   ├── App/                          # Root application component
│   │   ├── App.tsx                   # Main app (92 lines)
│   │   └── hooks/
│   │       ├── useAppInitialization.ts   # App boot (60 lines)
│   │       └── useValidation.ts          # Validation runner (185 lines)
│   ├── Canvas/                       # Pipeline canvas (ReactFlow)
│   │   ├── PipelineCanvas.tsx        # Main canvas (241 lines) ⚠️ LARGE
│   │   ├── CustomNode/CustomNode.tsx # Task node (82 lines)
│   │   ├── DatasetNode/DatasetNode.tsx   # Dataset node (107 lines)
│   │   ├── CustomEdge/CustomEdge.tsx     # Connection edge (52 lines)
│   │   ├── GhostNode/GhostNode.tsx       # Preview ghost (45 lines)
│   │   └── hooks/                    # 10 canvas hooks (see §6)
│   ├── CodeViewer/                   # Code preview panel
│   │   ├── CodeViewer.tsx            # Main viewer (89 lines)
│   │   ├── CodeViewerPanel.tsx       # Panel wrapper (76 lines)
│   │   └── FileTree.tsx              # File tree nav (68 lines)
│   ├── ConfigPanel/                  # Node/dataset configuration
│   │   ├── ConfigPanel.tsx           # Panel container (105 lines)
│   │   ├── DatasetConfigForm/        # Dataset config (240 lines) ⚠️ LARGE
│   │   └── NodeConfigForm/           # Node config (192 lines)
│   ├── ExportWizard/                 # ZIP export dialog
│   │   ├── ExportWizard.tsx          # Wizard (134 lines)
│   │   └── ExportWizardContent.tsx   # Content (136 lines)
│   ├── Header/                       # App header
│   │   ├── Header.tsx                # Header bar (96 lines)
│   │   └── ProjectInfoDropdown.tsx   # Project info (127 lines)
│   ├── NodePalette/                  # Drag-and-drop palette
│   │   ├── NodePalette.tsx           # Palette container (92 lines)
│   │   └── NodeCard.tsx              # Draggable card (63 lines)
│   ├── ProjectSetup/                 # New project modal
│   │   └── ProjectSetupModal.tsx     # Setup form (173 lines)
│   ├── Toolbar/                      # Canvas toolbar
│   │   └── Toolbar.tsx               # Tool buttons (121 lines)
│   ├── Tutorial/                     # Tutorial overlay
│   │   └── TutorialOverlay.tsx       # Tutorial steps (154 lines)
│   ├── UI/                           # Reusable UI primitives
│   │   ├── Button/Button.tsx         # Button (44 lines)
│   │   ├── Input/Input.tsx           # Input (32 lines)
│   │   ├── ConfirmDialog/            # Confirm dialog (59 lines)
│   │   ├── ErrorBoundary/            # Error boundary (100 lines)
│   │   ├── FilepathBuilder/          # Filepath input (142 lines)
│   │   └── ThemeToggle/              # Theme switch (21 lines)
│   ├── ValidationPanel/              # Validation display
│   │   ├── ValidationPanel.tsx       # Panel (96 lines)
│   │   └── ValidationItem.tsx        # Item row (79 lines)
│   ├── Walkthrough/                  # Interactive walkthrough
│   │   ├── Walkthrough.tsx           # Main (166 lines)
│   │   ├── WalkthroughCard.tsx       # Step card (103 lines)
│   │   └── hooks/useWalkthroughPosition.ts (107 lines)
│   └── common/
│       └── SearchableSelect/         # Searchable dropdown (247 lines) ⚠️ LARGE
├── constants/                        # App-wide constants
│   ├── canvas.ts                     # Canvas layout (20 lines)
│   ├── datasetTypes.ts               # 75 dataset types (134 lines)
│   ├── dnd.ts                        # Drag & drop (63 lines)
│   ├── events.ts                     # Custom events (64 lines)
│   ├── fileTree.ts                   # File tree (17 lines)
│   ├── storage.ts                    # Storage keys (85 lines)
│   └── timing.ts                     # Timing constants (9 lines)
├── domain/                           # Domain logic
│   ├── IdGenerator.ts                # ID creation (94 lines)
│   └── PipelineGraph.ts              # Graph abstraction (180 lines)
├── features/                         # Redux feature slices
│   ├── canvas/canvasSelectors.ts     # Canvas selectors (98 lines)
│   ├── connections/
│   │   ├── connectionsSlice.ts       # Connections state (81 lines)
│   │   └── connectionsSelectors.ts   # Selectors (18 lines)
│   ├── datasets/
│   │   ├── datasetsSlice.ts          # Datasets state (112 lines)
│   │   ├── datasetsSelectors.ts      # Selectors (34 lines)
│   │   └── datasetsSlice.test.ts     # Tests (153 lines)
│   ├── nodes/
│   │   ├── nodesSlice.ts             # Nodes state (128 lines)
│   │   ├── nodesSelectors.ts         # Selectors (23 lines)
│   │   └── nodesSlice.test.ts        # Tests (152 lines)
│   ├── project/
│   │   ├── projectSlice.ts           # Project state (55 lines)
│   │   └── projectSelectors.ts       # Selectors (14 lines)
│   ├── theme/
│   │   └── themeSlice.ts             # Theme state (25 lines) ⚠️ SIDE EFFECTS
│   ├── ui/
│   │   ├── uiSlice.ts               # UI state (203 lines) ⚠️ LARGE + SIDE EFFECTS
│   │   └── uiSelectors.ts           # Selectors (70 lines)
│   └── validation/
│       ├── validationSlice.ts        # Validation state (43 lines)
│       └── validationSelectors.ts    # Selectors (131 lines)
├── hooks/                            # Shared hooks
│   ├── useClearSelections.ts         # Clear all selections (20 lines)
│   ├── useConfirmDialog.ts           # Confirm dialog state (24 lines)
│   ├── useSelectAndOpenConfig.ts     # Select + open config (27 lines)
│   └── useTelemetry.ts              # Telemetry hook (18 lines)
├── infrastructure/                   # Infrastructure layer
│   ├── export/                       # ZIP code generation (see §13)
│   ├── localStorage/                 # Persistence (see §18)
│   └── telemetry/                    # Usage telemetry (199 lines)
├── store/                            # Redux store setup
│   ├── index.ts                      # Store config (34 lines)
│   └── middleware/
│       ├── autoSaveMiddleware.ts     # Auto-save (55 lines)
│       └── preferencesMiddleware.ts  # Theme sync (29 lines)
├── test/                             # Test utilities & contracts
│   ├── contracts/                    # Contract tests (3 files)
│   ├── fixtures/mockData.ts          # Mock data (249 lines)
│   └── utils/                        # Test helpers (2 files)
├── types/                            # Shared types
│   ├── ids.ts                        # Branded ID types (98 lines)
│   ├── kedro.ts                      # Domain types (139 lines)
│   ├── reactflow.ts                  # ReactFlow types (9 lines)
│   └── redux.ts                      # State types (77 lines)
└── utils/                            # Utilities
    ├── fileTreeGenerator.ts          # File tree builder (319 lines) ⚠️ LARGEST
    ├── filepath.ts                   # Filepath helpers (75 lines)
    ├── logger.ts                     # Logging (107 lines)
    ├── validation.ts                 # Legacy validation entry (varies)
    ├── validation.test.ts            # Validation tests (518 lines)
    └── validation/                   # Validation system (see §14)
```

---

## 3. React Components

### Component Count: 30 components across 16 directories

| Category | Count | Files |
|----------|-------|-------|
| App shell | 1 | App.tsx |
| Canvas (flow) | 5 | PipelineCanvas, CustomNode, DatasetNode, CustomEdge, GhostNode |
| Config panels | 3 | ConfigPanel, DatasetConfigForm, NodeConfigForm |
| Code viewer | 3 | CodeViewer, CodeViewerPanel, FileTree |
| Export | 2 | ExportWizard, ExportWizardContent |
| Header | 2 | Header, ProjectInfoDropdown |
| Node palette | 2 | NodePalette, NodeCard |
| Project setup | 1 | ProjectSetupModal |
| Toolbar | 1 | Toolbar |
| Tutorial | 1 | TutorialOverlay |
| Walkthrough | 2 | Walkthrough, WalkthroughCard |
| Validation | 2 | ValidationPanel, ValidationItem |
| UI primitives | 6 | Button, Input, ConfirmDialog, ErrorBoundary, FilepathBuilder, ThemeToggle |
| Common | 1 | SearchableSelect |

---

## 4. State Management

### Architecture: Redux Toolkit with Normalized State

**Store**: `src/store/index.ts` (34 lines)

### 7 Redux Slices

| Slice | File | Lines | Pattern | Issues |
|-------|------|-------|---------|--------|
| `project` | features/project/projectSlice.ts | 55 | Standard | - |
| `nodes` | features/nodes/nodesSlice.ts | 128 | Normalized (byId/allIds) | - |
| `datasets` | features/datasets/datasetsSlice.ts | 112 | Normalized (byId/allIds) | - |
| `connections` | features/connections/connectionsSlice.ts | 81 | Normalized (byId/allIds) | - |
| `ui` | features/ui/uiSlice.ts | 203 | Standard | localStorage side effects in reducers |
| `validation` | features/validation/validationSlice.ts | 43 | Standard | - |
| `theme` | features/theme/themeSlice.ts | 25 | Standard | localStorage side effects in reducers |

### State Shape

```typescript
RootState {
  project:     { current, savedList, lastSaved }
  nodes:       { byId: Record<NodeId, KedroNode>, allIds: NodeId[], selected: NodeId[], hovered: NodeId | null }
  datasets:    { byId: Record<DatasetId, KedroDataset>, allIds: DatasetId[], selected: DatasetId[] }
  connections: { byId: Record<ConnectionId, KedroConnection>, allIds: ConnectionId[], selected: ConnectionId[] }
  ui:          { showTutorial, showWalkthrough, showProjectSetup, showConfigPanel, showCodeViewer, showExportWizard, selectedComponent, pendingComponentId }
  validation:  { errors: ValidationError[], warnings: ValidationError[], isValid: boolean, lastChecked: number }
  theme:       { theme: 'light' | 'dark' }
}
```

### Selectors (7 files)

| File | Lines | Purpose |
|------|-------|---------|
| canvasSelectors.ts | 98 | Transform Redux state to ReactFlow nodes/edges |
| connectionsSelectors.ts | 18 | Connection lookups |
| datasetsSelectors.ts | 34 | Dataset lookups, filtered queries |
| nodesSelectors.ts | 23 | Node lookups |
| projectSelectors.ts | 14 | Project metadata |
| uiSelectors.ts | 70 | UI state derivations |
| validationSelectors.ts | 131 | Error filtering, severity counts |

### Middleware (2 files)

| Middleware | File | Lines | Purpose |
|-----------|------|-------|---------|
| autoSaveMiddleware | store/middleware/autoSaveMiddleware.ts | 55 | Debounced save to localStorage (500ms) |
| preferencesMiddleware | store/middleware/preferencesMiddleware.ts | 29 | Sync theme preference |

---

## 5. ReactFlow Usage

### Custom Node Types (2)

| Type Key | Component | Description |
|----------|-----------|-------------|
| `kedroNode` | CustomNode.tsx (82 lines) | Task node - blue, with input/output handles |
| `datasetNode` | DatasetNode.tsx (107 lines) | Dataset node - green, with input/output handles |

### Custom Edge Types (1)

| Type Key | Component | Description |
|----------|-----------|-------------|
| `kedroEdge` | CustomEdge.tsx (52 lines) | Connection edge with delete button |

### Canvas Configuration

```
Connection Mode: Loose
Multi-selection: Meta/Control/Shift keys
Pan Mode: Middle mouse button or toggle mode
Zoom: Scroll disabled, pinch enabled
Delete: Custom confirmation dialog (deleteKeyCode=null)
Snap to grid: Optional
```

### ReactFlow Wrapping

- `ReactFlowProvider` in App
- `ReactFlow` component in `PipelineCanvas.tsx`
- Custom types in `src/types/reactflow.ts`

---

## 6. Custom Hooks

### Total: 17 custom hooks

#### Shared Hooks (`src/hooks/`) - 4 hooks

| Hook | Lines | Purpose |
|------|-------|---------|
| useClearSelections | 20 | Clear all node/dataset/connection selections |
| useConfirmDialog | 24 | Manage confirm dialog open/close state |
| useSelectAndOpenConfig | 27 | Select a component and open its config panel |
| useTelemetry | 18 | Track telemetry events |

#### Canvas Hooks (`src/components/Canvas/hooks/`) - 10 hooks

| Hook | Lines | Purpose |
|------|-------|---------|
| useCanvasState | 163 | Core canvas state management (nodes, edges, sync with Redux) |
| useConnectionHandlers | 185 | Edge creation, validation, connection rules |
| useNodeHandlers | 233 | Node drag, drop, position updates, delete ⚠️ LARGE |
| useSelectionHandlers | 177 | Multi-select, box selection, click-to-select |
| useCanvasKeyboardShortcuts | 85 | Keyboard shortcut bindings |
| useCopyPaste | 149 | Copy/paste nodes and datasets |
| useDeleteConfirmation | 96 | Delete confirmation with dependency awareness |
| useDragToCreate | 129 | Drag from palette to canvas creation |
| useGhostPreview | 58 | Ghost node preview during connections |
| cycleDetection (utility) | 88 | Detect circular dependencies in graph |

#### Other Hooks - 3 hooks

| Hook | Lines | Location |
|------|-------|----------|
| useAppInitialization | 60 | components/App/hooks/ |
| useValidation | 185 | components/App/hooks/ |
| useFilepathBuilder | 89 | components/ConfigPanel/DatasetConfigForm/hooks/ |
| useWalkthroughPosition | 107 | components/Walkthrough/hooks/ |

---

## 7. Large Files (Refactoring Candidates)

### Files > 200 Lines (excluding tests)

| File | Lines | Category | Suggested Action |
|------|-------|----------|------------------|
| `utils/fileTreeGenerator.ts` | 319 | Utility | Split by file type generator |
| `utils/validation/pipelineValidation.ts` | 303 | Validation | Consolidate with Validator classes |
| `infrastructure/export/staticFilesGenerator.ts` | 295 | Export | Split by file template |
| `infrastructure/export/KedroProjectBuilder.ts` | 251 | Export | Extract helper methods |
| `components/common/SearchableSelect.tsx` | 247 | Component | Extract subcomponents |
| `components/Canvas/PipelineCanvas.tsx` | 241 | Component | Extract toolbar/config logic |
| `components/ConfigPanel/DatasetConfigForm.tsx` | 240 | Component | Extract form sections |
| `components/Canvas/hooks/useNodeHandlers.ts` | 233 | Hook | Split by concern |
| `infrastructure/localStorage/localStorage.ts` | 201 | Infrastructure | Split read/write/schema |
| `features/ui/uiSlice.ts` | 203 | State | Move side effects to middleware |

---

## 8. External Dependencies

### Runtime Dependencies (22 packages)

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| react | ^19.1.1 | UI framework | Core |
| react-dom | ^19.1.1 | DOM rendering | Core |
| @reduxjs/toolkit | ^2.9.0 | State management | ~33KB |
| react-redux | ^9.2.0 | React-Redux bindings | ~5KB |
| @xyflow/react | ^12.8.6 | Flow/graph visualization | ~150KB |
| @radix-ui/* (5 pkgs) | Various | Accessible UI primitives | ~30KB total |
| lucide-react | ^0.545.0 | Icons | Tree-shakeable |
| react-hook-form | ^7.65.0 | Form management | ~12KB |
| zod | ^4.3.5 | Schema validation | ~14KB |
| jszip | ^3.10.1 | ZIP file generation | ~45KB |
| file-saver | ^2.0.5 | File download trigger | ~2KB |
| handlebars | ^4.7.8 | Template engine | ~70KB |
| js-yaml | ^4.1.0 | YAML serialization | ~20KB |
| highlight.js | ^11.11.1 | Code highlighting | ~200KB+ |
| prism-react-renderer | ^2.4.1 | Code highlighting | ~30KB |
| dexie | ^4.2.1 | IndexedDB wrapper | ~28KB |
| classnames | ^2.5.1 | CSS class utility | ~1KB |
| react-hot-toast | ^2.6.0 | Toast notifications | ~5KB |

**Notable concern**: Both `highlight.js` AND `prism-react-renderer` are included - likely only one is needed.

### Dev Dependencies (14 packages)

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | ^4.0.5 | Test framework |
| @testing-library/react | ^16.3.0 | Component testing |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| @testing-library/user-event | ^14.6.1 | User interaction simulation |
| @vitejs/plugin-react | ^4.3.2 | React Vite plugin |
| typescript | ~5.9.3 | TypeScript compiler |
| eslint | ^9.36.0 | Linting (flat config) |
| sass / sass-embedded | ^1.93.2 | SCSS compilation |

---

## 9. Type System

### Branded ID Types (`src/types/ids.ts` - 98 lines)

```typescript
type NodeId = Brand<string, 'NodeId'>           // Format: node-{timestamp}
type DatasetId = Brand<string, 'DatasetId'>     // Format: dataset-{timestamp}
type ConnectionId = Brand<string, 'ConnectionId'> // Format: {source}-{target}
type ComponentId = NodeId | DatasetId | ConnectionId
```

Type guards: `isNodeId()`, `isDatasetId()`, `isConnectionId()`
Casters: `asNodeId()`, `asDatasetId()`, `asConnectionId()`

### Domain Types (`src/types/kedro.ts` - 139 lines)

```typescript
interface KedroNode { id, name, type, code, inputs, outputs, position, tags }
interface KedroDataset { id, name, type, layer, filepath, config, position }
interface KedroConnection { id, source, target, sourceHandle, targetHandle }
interface KedroProject { metadata, nodes, datasets, connections }
interface ValidationError { id, type, severity, message, componentId }
type NodeType = 'data_ingestion' | 'data_processing' | 'model_training' | 'model_evaluation' | 'custom'
type DatasetType = 'csv' | 'parquet' | ... (75 types total)
type DataLayer = '01_raw' | '02_intermediate' | ... | '08_reporting'
```

### Redux Types (`src/types/redux.ts` - 77 lines)

Defines `NodesState`, `DatasetsState`, `ConnectionsState`, `UIState`, `ValidationState`, `ThemeState`, and `RootState`.

### ReactFlow Types (`src/types/reactflow.ts` - 9 lines)

```typescript
type CustomNodeData = KedroNode
type CustomNode = Node<CustomNodeData>
type CustomEdgeData = KedroConnection
type CustomEdge = Edge<CustomEdgeData>
```

---

## 10. Utilities & Helpers

### Validation System (Strategy Pattern)

| Validator | File | Lines | Purpose |
|-----------|------|-------|---------|
| Validator (base) | validators/Validator.ts | 90 | Abstract base + registry |
| CircularDependencyValidator | validators/ | 40 | Detect graph cycles |
| DuplicateNameValidator | validators/ | 66 | No duplicate node/dataset names |
| EmptyNameValidator | validators/ | 50 | Require non-empty names |
| InvalidNameValidator | validators/ | 50 | Validate Python identifiers |
| MissingCodeValidator | validators/ | 32 | Nodes must have function code |
| MissingConfigValidator | validators/ | 38 | Datasets must have config |
| OrphanedDatasetValidator | validators/ | 34 | Datasets must be connected |
| OrphanedNodeValidator | validators/ | 34 | Nodes must be connected |

### ID Generation (`src/domain/IdGenerator.ts` - 94 lines)

- `generateNodeId()` - `node-{timestamp}-{random}`
- `generateDatasetId()` - `dataset-{timestamp}-{random}`
- `generateConnectionId(source, target)` - `{source}-{target}`
- `generateCopyId(type)` - With random suffix
- `parseIdType(id)` - Extract component type from ID

### Other Utilities

| File | Lines | Purpose |
|------|-------|---------|
| fileTreeGenerator.ts | 319 | Virtual file tree for code preview |
| filepath.ts | 75 | Filepath construction helpers |
| logger.ts | 107 | Structured logging with categories |

---

## 11. Test Coverage

### Test Files (12)

| Test File | Lines | Tests For |
|-----------|-------|-----------|
| datasetsSlice.test.ts | 153 | Dataset slice reducers |
| nodesSlice.test.ts | 152 | Node slice reducers |
| catalogGenerator.test.ts | 437 | Catalog YAML generation |
| helpers.test.ts | 221 | Export helper functions |
| nodesGenerator.test.ts | 416 | Python node code generation |
| pipelineGenerator.test.ts | 163 | Pipeline code generation |
| projectGenerator.test.ts | 46 | Project structure generation |
| validation.test.ts | 518 | Validation system |
| preferencesMiddleware.test.ts | 72 | Preferences middleware |
| events.contracts.test.ts | 160 | Event name contracts |
| idFormats.contracts.test.ts | 179 | ID format contracts |
| localStorage.contracts.test.ts | 107 | Storage key contracts |

### Coverage Analysis

| Area | Status | Notes |
|------|--------|-------|
| Redux slices | Partial | 2 of 7 slices tested |
| Code generators | Good | 5 generator test files |
| Validators | Tested | Through validation.test.ts |
| Middleware | Partial | 1 of 2 tested |
| Components | None | No component tests |
| Hooks | None | No hook tests |
| Integration | None | No end-to-end flow tests |
| Contract tests | Good | 3 files covering critical APIs |

### Estimated Coverage: ~25-30% (slice tests + generators only)

---

## 12. Build & Config

### Vite Configuration (`vite.config.ts`)

- Base path: `./` (GitHub Pages compatible)
- React plugin enabled
- SCSS with modern compiler
- Vitest: jsdom environment, v8 coverage

### TypeScript Configuration

- `strict: true` (all strict checks enabled)
- `target: ES2022`
- `module: ESNext`
- `moduleResolution: bundler`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- No path aliases configured (uses relative imports)

### ESLint Configuration

- ESLint 9 flat config
- TypeScript ESLint recommended rules
- React Hooks lint rules
- React Refresh plugin

### Build Output

- **Status**: Passes
- **Warning**: Chunks > 500KB after minification
- **Likely cause**: highlight.js or @xyflow/react not code-split

---

## 13. Export & Code Generation

### Builder Pattern (`KedroProjectBuilder.ts` - 251 lines)

```typescript
new KedroProjectBuilder(state, metadata)
  .withCatalog()        // catalog.yml
  .withPipeline()       // pipeline.py
  .withNodes()          // nodes.py
  .withConfiguration()  // settings.py, etc.
  .withRootFiles()      // README, .gitignore, pyproject.toml
  .withPackageStructure()
  .withDataDirectories()
  .withLogsDirectory()
  .build()              // Returns Promise<Blob> (ZIP)
```

### Code Generators (8 files)

| Generator | File | Lines | Output |
|-----------|------|-------|--------|
| catalogGenerator | catalogGenerator.ts | 70 | catalog.yml |
| pipelineGenerator | pipelineGenerator.ts | 104 | pipeline.py |
| nodesGenerator | nodesGenerator.ts | 155 | nodes.py |
| pyprojectGenerator | pyprojectGenerator.ts | 123 | pyproject.toml |
| registryGenerator | registryGenerator.ts | 74 | pipeline_registry.py |
| staticFilesGenerator | staticFilesGenerator.ts | 295 | README, .gitignore, settings.py |
| helpers | helpers.ts | 132 | Template helpers (Handlebars) |
| projectGenerator | projectGenerator.ts | 30 | **Legacy** (duplicate?) |

**Template Engine**: Handlebars for Python code generation

---

## 14. Validation System

### DUPLICATION ISSUE: Two Coexisting Systems

#### System A: Strategy Pattern (New)

Location: `src/utils/validation/validators/`

- 8 pluggable validator classes implementing `Validator` interface
- `ValidatorRegistry` for composition
- Clean separation of concerns
- Individually testable

#### System B: Monolithic Function (Legacy)

Location: `src/utils/validation/pipelineValidation.ts` (303 lines)

- Single `validatePipeline()` function
- All validation logic in one file
- Harder to extend or test individually

### Validation Flow

```
User action → State change → useValidation hook triggers
  → Validators run on entire state
  → Results dispatched to validationSlice
  → ValidationPanel displays errors/warnings
```

---

## 15. Constants & Configuration

| File | Lines | Contents |
|------|-------|----------|
| canvas.ts | 20 | Canvas layout constants (grid size, etc.) |
| datasetTypes.ts | 134 | 75 dataset types with categories + Kedro class mapping |
| dnd.ts | 63 | Drag & drop MIME types + helpers |
| events.ts | 64 | Custom window events + dispatchers |
| fileTree.ts | 17 | File tree constants |
| storage.ts | 85 | localStorage keys + safe helpers |
| timing.ts | 9 | AUTO_SAVE_DEBOUNCE: 500ms |

---

## 16. Architecture Patterns

| Pattern | Implementation | Quality |
|---------|---------------|---------|
| Normalized state | byId + allIds in Redux slices | Good |
| Branded types | Compile-time ID type safety | Good |
| Strategy pattern | 8 pluggable validators | Good (but legacy coexists) |
| Builder pattern | KedroProjectBuilder for ZIP | Good |
| Middleware | autoSave + preferences | Good (but side effects in reducers too) |
| Custom hooks | 17 hooks, good separation | Good (some large) |
| Barrel exports | index.ts in directories | Partial |
| Contract tests | localStorage, IDs, events | Good |

---

## 17. Data Flow

### User Action Flow

```
User Action (e.g., add node)
  → Dispatch Redux action
  → Reducer updates state
  → Auto-save middleware triggers (debounced 500ms)
  → localStorage.setItem()
  → Selectors compute derived state
  → Components re-render
  → Validation runs
  → ValidationPanel updates
```

### Export Flow

```
User clicks Export → ExportWizard opens → Configure metadata
  → Validation runs → KedroProjectBuilder builds ZIP → file-saver downloads
```

### Drag & Drop Flow

```
Drag NodeCard from Palette → DataTransfer set with DND_TYPES.NODE
  → Drop on Canvas → useDragToCreate extracts data
  → Dispatch addNode → Node created → Config panel opens
```

---

## 18. Storage & Persistence

### localStorage

| Key | Purpose |
|-----|---------|
| `kedro_builder_current_project` | Full project state |
| `kedro_builder_tutorial_completed` | Tutorial completion |
| `kedro_builder_walkthrough_completed` | Walkthrough completion |
| `kedro_builder_theme` | Theme preference |
| `kedro-builder-telemetry` | Telemetry consent |
| `kedro-builder-telemetry-consent-shown` | Consent shown flag |

**Validation**: Zod schemas for localStorage data (`src/infrastructure/localStorage/schemas.ts` - 155 lines)

### IndexedDB (Dexie)

- Library imported but not actively used
- Likely placeholder for future multi-project storage

### Auto-save

- Debounced 500ms via Redux middleware
- Triggered by node/dataset/connection mutations
- Saves full project state

---

## 19. Risk Assessment

### Executive Summary

The codebase has several **structural soundness patterns** (branded ID types, Zod-validated localStorage, normalized Redux store, memoized selectors) but carries significant risks in **code injection through user-authored Python code**, **ID collision under rapid operations**, **dead dependency bloat**, **zero component/hook test coverage**, and a **dual-state synchronization pattern** between Redux and ReactFlow.

### Risk Summary Table

| # | Area | Severity | Confidence | Key Issue |
|---|------|----------|------------|-----------|
| 1 | Security (Code Injection) | **CRITICAL** | High | User Python code emitted verbatim into generated files |
| 2 | Data Integrity (ID Collision) | **HIGH** | High | `Date.now()` produces identical values for rapid sequential calls |
| 3 | Performance (Re-renders) | **HIGH** | High | `CodeDisplay.tsx` subscribes to entire root state; zero `React.memo` usage |
| 4 | Bundle Size (Dead Deps) | **HIGH** | High | 3 unused dependencies ship ~140KB: dexie, prism-react-renderer, handlebars |
| 5 | Testing Coverage | **HIGH** | High | Zero component tests, zero hook tests, zero integration tests |
| 6 | Data Integrity (State Sync) | **MEDIUM** | High | Redux-to-ReactFlow dual-state with `useLayoutEffect` is fragile |
| 7 | Maintainability (Duplication) | **MEDIUM** | High | Legacy monolithic validation coexists with Strategy pattern validators |
| 8 | Reliability (localStorage) | **MEDIUM** | Medium | No multi-tab coordination |
| 9 | Scalability (100+ nodes) | **MEDIUM** | Medium | O(n^2) in `deleteNodes` reducer; no virtualization |
| 10 | Security (CDN Dependency) | **MEDIUM** | High | Runtime CSS loaded from CDN; fails offline, no SRI |

### Risk Details

#### CRITICAL: Code Injection in Generated Python Files

**Files:** `nodesGenerator.ts` (lines 62-64, 87-101), `pipelineGenerator.ts` (lines 18, 65), `helpers.ts` (lines 89-95, 113-129)

User-supplied `node.functionCode` is emitted directly into generated `nodes.py` with zero sanitization. Dataset names in `formatNodeInputs`/`formatNodeOutputs` are wrapped in double quotes without escaping internal quotes or backslashes.

**Mitigations:** `toSnakeCase()` sanitizes node names. Accept that `functionCode` is intentionally arbitrary Python -- add security warning in export wizard. Escape `"` and `\` in string interpolations.

#### HIGH: ID Collision from `Date.now()`

**File:** `IdGenerator.ts` (lines 36-37, 44-45)

`generateNodeId()` and `generateDatasetId()` use `Date.now()` with millisecond resolution. Sub-millisecond operations cause collisions. The `byId` assignment silently overwrites the first node.

**Fix:** Use `crypto.randomUUID()` or append `counter + random` suffix (as `generateCopyId` already does).

#### HIGH: Zero `React.memo` / CodeDisplay Root State Subscription

`CodeDisplay.tsx` line 21: `useAppSelector((rootState) => rootState)` causes re-render on every Redux state change. Combined with zero `React.memo` usage across the entire codebase, this creates cascading re-renders during drag operations.

**Fix:** Replace root state selector with specific selectors. Add `React.memo` to all ReactFlow node/edge components.

#### HIGH: Dead Dependencies (~140KB)

| Dependency | Est. Size | Status |
|---|---|---|
| dexie | ~47KB | Zero imports - DEAD |
| prism-react-renderer | ~15KB | Zero imports - DEAD |
| handlebars | ~77KB | Zero imports - DEAD |

**Fix:** `npm uninstall dexie prism-react-renderer handlebars @types/react-syntax-highlighter`

#### MEDIUM: Redux-to-ReactFlow Dual-State Sync

`useCanvasState.ts` maintains dual state with `useLayoutEffect` sync. During node drag, position updates cause sync conflicts. Consider making ReactFlow the sole position owner or using fully controlled mode.

#### MEDIUM: O(n^2) in `deleteNodes` Reducer

`nodesSlice.ts` lines 75-85: Uses per-item `filter()` instead of a `Set` (contrast with `connectionsSlice.deleteConnections` which correctly uses Sets).

#### MEDIUM: CDN Dependency for highlight.js CSS

`CodeDisplay.tsx` loads themes from `cdnjs.cloudflare.com` at runtime. No SRI hash, version mismatch possible, fails offline.

### Edge Cases

| Scenario | Risk | Current Behavior |
|----------|------|-----------------|
| 100+ nodes | Performance degradation | No virtualization, O(n^2) patterns |
| localStorage full (5MB) | Data loss after quota | 4MB check + toast, but changes after are not persisted |
| Concurrent browser tabs | Silent data loss | Last-write-wins, no detection |
| Rapid node creation | ID collision | `Date.now()` only, silent overwrite |
| Very large function code | localStorage bloat | No character limit |

---

## 20. Domain Alignment

### Summary Table

| Area | Status | Severity |
|------|--------|----------|
| Connection rules (bipartite graph) | CORRECT | -- |
| Cycle detection | CORRECT | -- |
| Data layer convention | CORRECT | -- |
| Dataset versioning | CORRECT | -- |
| Validation framework | CORRECT | -- |
| Python naming validation | CORRECT | -- |
| Project directory structure | CORRECT | -- |
| pipeline_registry.py | CORRECT | -- |
| catalog.yml format | MOSTLY CORRECT | Low |
| Dataset type mappings | MOSTLY CORRECT | Medium |
| pyproject.toml structure | MOSTLY CORRECT | Medium |
| `Node()` vs `node()` in pipeline.py | **WRONG** | **Critical** |
| Missing `name=` in node() call | **WRONG** | **Critical** |
| Missing `__main__.py` | **WRONG** | **High** |
| NodeType as Kedro concept | MISALIGNMENT | Medium |
| No parameter node support | MISSING | High |
| No tags support | MISSING | Medium |
| No modular pipeline support | MISSING | Medium |

### Critical Bugs in Generated Code

#### Bug 1: `Node()` vs `node()` (CRITICAL)

In `pipelineGenerator.ts` line 39:
```python
from kedro.pipeline import Node, Pipeline  # WRONG
```
Should be:
```python
from kedro.pipeline import Pipeline, node  # CORRECT
```

And line 72 uses `Node(` (class constructor) instead of `node(` (factory function). The `node()` function is the documented and recommended Kedro API.

#### Bug 2: Missing `name=` Parameter (CRITICAL)

Generated pipeline nodes have no `name=` argument. This makes `kedro run --node=` filtering impossible and hampers debugging.

#### Bug 3: Missing `__main__.py` (HIGH)

`pyproject.toml` references `{package}.__main__:main` in `[project.scripts]` but `__main__.py` is never generated.

### Incorrect Dataset Type Mappings

| Key | Current | Correct |
|-----|---------|---------|
| `polars_csv` | `polars.PolarsCSVDataset` | `polars.CSVDataset` |
| `polars_parquet` | `polars.PolarsParquetDataset` | `polars.ParquetDataset` |
| `polars_lazy` | `polars.PolarsLazyDataset` | `polars.LazyPolarsDataset` |
| `pytorch` | `pytorch.PyTorchDataset` | `pytorch.PyTorchModelDataset` |
| `video` | `video.VideoDataset` | Does not exist in kedro-datasets |

### What the Builder Does Well

- Correctly enforces bipartite graph structure (node-dataset-node)
- Data catalog as first-class concept with explicit dataset entities
- Standard 8 Kedro data layers with smart inference
- Versioning support for datasets
- Comprehensive validation (cycles, duplicates, orphans, naming)
- Smart dependency resolution in pyproject.toml (only needed extras)

### Missing Kedro Features

| Feature | Impact | Priority |
|---------|--------|----------|
| Parameter nodes (`params:` inputs) | High - core Kedro concept | P2 |
| Node tags | Medium - enables `kedro run --tag=` | P2 |
| Modular pipelines (namespaces) | Medium - standard pattern | P3 |
| Multiple pipelines per project | Low - common in real projects | P3 |
| Transcoding (`@` syntax) | Low - advanced feature | P3 |
| Dataset factories (pattern-based) | Low - Kedro 0.19+ feature | P3 |

---

## 21. Recommendations (Prioritized)

### P0 - Must Fix (Generates Broken Code / Data Loss)

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 1 | **Fix `Node()` to `node()`** in pipeline.py generation | `pipelineGenerator.ts:39,72` | Generated Python uses wrong API |
| 2 | **Add `name=` parameter** to generated node() calls | `pipelineGenerator.ts:72-76` | `kedro run --node=` broken |
| 3 | **Fix ID generation** - Replace `Date.now()` with UUID | `IdGenerator.ts:36-45` | Silent data loss on collision |
| 4 | **Generate `__main__.py`** or remove `[project.scripts]` | `pyprojectGenerator.ts:129`, `KedroProjectBuilder.ts` | Broken console script |

### P1 - Should Fix (Correctness / Performance / Security)

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 5 | **Remove dead dependencies** (~140KB) | `package.json` | Bundle bloat |
| 6 | **Fix CodeDisplay root state selector** | `CodeDisplay.tsx:21` | Re-renders on every state change |
| 7 | **Add `React.memo`** to ReactFlow nodes/edges | `CustomNode.tsx`, `DatasetNode.tsx`, `CustomEdge.tsx` | Cascading re-renders |
| 8 | **Fix dataset type mappings** (Polars, PyTorch, Video) | `datasetTypes.ts` | Incorrect catalog.yml |
| 9 | **Escape strings in generated code** | `helpers.ts:113-129` | Code injection via dataset names |
| 10 | **Consolidate validation systems** | `pipelineValidation.ts` vs `validators/` | Dead code + maintenance burden |
| 11 | **Bundle highlight.js CSS locally** | `CodeDisplay.tsx:35-37` | CDN failure offline |
| 12 | **Fix O(n^2) in `deleteNodes`** | `nodesSlice.ts:75-85` | Slow batch delete |

### P2 - Should Add (Missing Features / Quality)

| # | Issue | Impact |
|---|-------|--------|
| 13 | **Add component tests** | 0% UI coverage; refactoring without safety net |
| 14 | **Add multi-tab localStorage detection** | Silent data loss in concurrent tabs |
| 15 | **Add Parameter node type** (`params:` inputs) | Core Kedro concept missing |
| 16 | **Add node tags support** | Cannot use `kedro run --tag=` |
| 17 | **Add path aliases** (`@/`) in tsconfig | Cleaner imports |
| 18 | **Split large files** (10 files > 200 LOC) | Maintainability |
| 19 | **Skip MemoryDataset in catalog.yml** | Unnecessary entries |
| 20 | **Add security warning in export wizard** | User awareness |

### P3 - Nice to Have (Polish / Future Features)

| # | Issue | Impact |
|---|-------|--------|
| 21 | Modular pipeline support (namespaces) | Standard Kedro pattern |
| 22 | Multiple pipelines per project | Common in real projects |
| 23 | Layer-based visual layout | UX improvement |
| 24 | Code-split large chunks (dynamic import) | Bundle optimization |
| 25 | Accessibility audit (ARIA, keyboard nav) | Inclusivity |
| 26 | Add PartitionedDataset/IncrementalDataset types | Completeness |
| 27 | Rename `NodeType` to `NodeCategory` | Clarity |
| 28 | Integration tests for full flows | Confidence |
