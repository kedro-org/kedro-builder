# Kedro Builder -- Complete Lessons Guide

> A systematic, structured walkthrough of the Kedro Builder application for new developers.
> Covers architecture, state management, canvas, data flow, code generation, validation, types, persistence, and known issues.

---

## Table of Contents

1. [Lesson 1: The Big Picture](#lesson-1-the-big-picture--what-is-this-app)
2. [Lesson 2: Project Folder Structure](#lesson-2-project-folder-structure--the-map-before-the-journey)
3. [Lesson 3: The Tech Stack](#lesson-3-the-tech-stack--the-toolbox)
4. [Lesson 4: State Management with Redux](#lesson-4-state-management-with-redux--the-brain-of-the-app)
5. [Lesson 5: The Canvas (ReactFlow)](#lesson-5-the-canvas--reactflow-and-the-visual-pipeline-builder)
6. [Lesson 6: The Complete Data Flow](#lesson-6-the-complete-data-flow--following-a-user-action-end-to-end)
7. [Lesson 7: Code Generation & Export](#lesson-7-code-generation--export--from-visual-pipeline-to-real-kedro-project)
8. [Lesson 8: The Validation System](#lesson-8-the-validation-system--catching-errors-before-they-become-bugs)
9. [Lesson 9: The Type System](#lesson-9-the-type-system--how-typescript-prevents-bugs-at-compile-time)
10. [Lesson 10: Persistence & Middleware](#lesson-10-persistence--middleware--how-the-app-saves-your-work)
11. [Lesson 11: Architecture Summary & Known Issues](#lesson-11-architecture-summary--known-issues--the-owners-manual)

---

## Lesson 1: The Big Picture -- What Is This App?

### The Problem It Solves

You know Kedro -- to build a Kedro pipeline, a data engineer normally has to:
- Manually write `pipeline.py` with `node()` function calls
- Manually write `catalog.yml` to define datasets
- Manually write `nodes.py` with Python functions
- Set up the whole project directory structure (`conf/`, `src/`, `data/`, etc.)

That's a lot of boilerplate. **Kedro Builder eliminates all of that.**

### What the App Actually Does

Kedro Builder is a **visual pipeline builder** that runs entirely in the browser. Think of it like a drag-and-drop design tool (like Figma, but for data pipelines). Here's the simple mental model:

```
  [User drags & drops boxes] --> [Configures them] --> [App validates] --> [Downloads a real Kedro project as ZIP]
```

The user never writes Python or YAML. They just:
1. **Create a project** (give it a name)
2. **Drag nodes** (Python functions) and **datasets** (data sources like CSVs, Parquet files) onto a canvas
3. **Connect them** with lines (edges) to define data flow
4. **Configure each one** (name it, set its type, optionally write Python code)
5. **Click Export** -- the app generates a complete, production-ready Kedro project and downloads it as a ZIP

### The Key Mental Model

Think of the app as having **four layers** stacked on top of each other:

```
  ┌─────────────────────────────────────────┐
  │   UI Layer (what the user sees/clicks)  │  React Components
  ├─────────────────────────────────────────┤
  │   State Layer (the "brain")             │  Redux Store (7 slices)
  ├─────────────────────────────────────────┤
  │   Logic Layer (validation + generation) │  Validators + Code Generators
  ├─────────────────────────────────────────┤
  │   Infrastructure (saving + exporting)   │  localStorage + JSZip
  └─────────────────────────────────────────┘
```

- **UI Layer**: The canvas, panels, buttons, forms -- everything visual
- **State Layer**: The single source of truth. Every node, dataset, connection, and UI toggle lives here
- **Logic Layer**: Validates the pipeline (no cycles, no duplicate names, etc.) and generates Python/YAML code
- **Infrastructure Layer**: Saves your work to the browser's localStorage, generates the ZIP file

**Every user action flows DOWN through these layers.** When you drag a node onto the canvas, it goes: UI -> State -> Auto-save -> localStorage. When you click Export, it goes: UI -> State -> Validation -> Code Generation -> ZIP download.

---

## Lesson 2: Project Folder Structure -- The Map Before the Journey

Before you read any code, you need to know **where things live**. Think of this like learning the map of a building before walking through it.

### The Top-Level View

```
kedro-builder/
├── src/                  # ALL the application code lives here
├── public/               # Static files (favicon, etc.)
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Build tool config
├── tsconfig.json         # TypeScript config
└── docs (*.md files)     # README, DISCOVERY, ARCHITECTURE, etc.
```

The only folder you'll spend 99% of your time in is `src/`. Let's zoom into it.

### Inside `src/` -- The 9 Rooms of the Building

Think of `src/` as a building with 9 rooms, each with a specific purpose:

```
src/
├── main.tsx              # THE FRONT DOOR (entry point, 13 lines)
│
├── components/           # ROOM 1: Everything the user SEES
│                         #    (Canvas, panels, forms, buttons)
│
├── features/             # ROOM 2: The BRAIN (Redux state slices)
│                         #    (nodes, datasets, connections, UI state)
│
├── store/                # ROOM 3: The SWITCHBOARD (Redux store setup)
│                         #    (store config, middleware, typed hooks)
│
├── hooks/                # ROOM 4: SHARED TOOLS (reusable React hooks)
│                         #    (useConfirmDialog, useClearSelections, etc.)
│
├── domain/               # ROOM 5: PURE BUSINESS LOGIC (no React, no Redux)
│                         #    (ID generation, graph cycle detection)
│
├── infrastructure/       # ROOM 6: EXTERNAL CONNECTIONS
│                         #    (localStorage, ZIP export, telemetry)
│
├── utils/                # ROOM 7: HELPER TOOLS
│                         #    (validation rules, file tree builder, logger)
│
├── types/                # ROOM 8: TYPE DEFINITIONS
│                         #    (what a Node is, what a Dataset is, IDs)
│
├── constants/            # ROOM 9: FIXED VALUES
│                         #    (timing, layout sizes, dataset type list)
│
├── styles/               # Global SCSS styles
└── test/                 # Test utilities and fixtures
```

### Why This Structure Matters

This isn't random. The folders are organized by **responsibility**, following a pattern called "separation of concerns":

| Folder | Answers the question... | Depends on... |
|---|---|---|
| `types/` | "What SHAPE does the data have?" | Nothing (leaf) |
| `constants/` | "What VALUES never change?" | `types/` |
| `domain/` | "What are the BUSINESS RULES?" | `types/` only |
| `utils/` | "What HELPER FUNCTIONS do we need?" | `types/`, `domain/` |
| `features/` | "How is STATE organized?" | `types/` |
| `store/` | "How is the state WIRED together?" | `features/` |
| `infrastructure/` | "How do we talk to the OUTSIDE world?" | `types/`, `features/` |
| `hooks/` | "What REUSABLE LOGIC do components share?" | `store/`, `features/` |
| `components/` | "What does the user SEE and INTERACT with?" | Everything above |

Notice the dependency direction: **it flows downward**. Components depend on hooks, hooks depend on the store, the store depends on features, etc. But `types/` and `domain/` depend on nothing -- they're the foundation.

### The Components Folder -- Where You'll Work Most

Since you're a React developer, `components/` is your main workspace. Here's what's inside:

```
components/
├── App/              # The root shell -- wraps everything
├── Canvas/           # THE STAR -- the drag-and-drop pipeline canvas
│   ├── PipelineCanvas.tsx     # The main ReactFlow canvas
│   ├── CustomNode/            # Blue boxes (task/function nodes)
│   ├── DatasetNode/           # Green boxes (dataset nodes)
│   ├── CustomEdge/            # Lines connecting them
│   ├── GhostNode/             # Preview when dragging
│   └── hooks/                 # 10 hooks for canvas behavior
├── ConfigPanel/      # Right-side panel to edit a node/dataset
├── CodeViewer/       # Preview generated Python/YAML code
├── ExportWizard/     # The export dialog
├── Header/           # Top bar with project name
├── NodePalette/      # Left sidebar -- drag items FROM here
├── ProjectSetup/     # "New Project" modal
├── Toolbar/          # Zoom, undo, layout buttons
├── Tutorial/         # First-time user tutorial
├── Walkthrough/      # Interactive step-by-step guide
├── ValidationPanel/  # Shows errors/warnings
└── UI/               # Reusable primitives (Button, Input, etc.)
```

### A Simple Rule to Remember

When you need to find something, ask yourself:

- **"It's something the user sees"** --> `components/`
- **"It's about what data looks like"** --> `features/` (state) or `types/` (shapes)
- **"It's a reusable function/hook"** --> `hooks/` or `utils/`
- **"It's about saving or exporting"** --> `infrastructure/`
- **"It's pure logic, no UI"** --> `domain/`
- **"It's a fixed value or list"** --> `constants/`

---

## Lesson 3: The Tech Stack -- The Toolbox

Every tool in this project was chosen for a specific reason. Here they are in groups, from most important to least.

### Group 1: The Core

#### React 19 + TypeScript 5 -- The Foundation
React for the UI. TypeScript adds type safety -- it catches bugs at compile time instead of runtime. This project uses **strict mode**, meaning TypeScript is as strict as possible.

#### Vite 5 -- The Build Tool
Vite is what runs `npm run dev` and `npm run build`. It starts your dev server (at `localhost:5173`), hot-reloads when you save a file, and bundles everything for production.

It's configured with a handy **path alias**: `@/` maps to `src/`. So instead of writing:
```typescript
import { KedroNode } from '../../../types/kedro';
```
You write:
```typescript
import { KedroNode } from '@/types/kedro';
```

### Group 2: State & Canvas

#### Redux Toolkit (RTK) -- The Brain

**Problem**: In React, when 15+ components all need the same data (nodes, datasets, connections), passing it through props becomes a nightmare.

**Solution**: Redux creates a **single global object** (called the "store") that holds ALL your app data. Any component can read from it or write to it.

**Redux Toolkit (RTK)** is the modern, official way to use Redux. Key concepts:

| Concept | What it is | Analogy |
|---|---|---|
| **Store** | The single global state object | A database for your frontend |
| **Slice** | A section of the store for one topic | A table in that database |
| **Action** | A message saying "something happened" | `addNode`, `deleteDataset` |
| **Reducer** | A function that updates state when it receives an action | The database UPDATE query |
| **Selector** | A function that reads specific data from the store | The database SELECT query |
| **Dispatch** | How you send an action to the store | Calling the API |

#### @xyflow/react (ReactFlow) -- The Canvas

ReactFlow is a library for building interactive node-based UIs. It gives you:
- A **zoomable, pannable canvas** (like Google Maps)
- **Nodes** (the boxes you drag around)
- **Edges** (the lines connecting boxes)
- **Handles** (the little dots on nodes where you attach edges)

In this app:
- **Blue boxes** = Function nodes (Kedro tasks) -- rendered by `CustomNode.tsx`
- **Green boxes** = Dataset nodes -- rendered by `DatasetNode.tsx`
- **Lines between them** = Connections -- rendered by `CustomEdge.tsx`

### Group 3: UI & Forms

| Library | What it does | Where it's used |
|---|---|---|
| **Radix UI** | Accessible UI primitives (dialogs, dropdowns, tooltips) | Modals, select menus, confirm dialogs |
| **Lucide React** | Icons (tree-shakeable -- only imports what you use) | Buttons, toolbar, node cards |
| **react-hook-form** | Efficient form state management | ConfigPanel forms (node/dataset editing) |
| **zod** | Schema validation (validates data shapes at runtime) | localStorage data validation |
| **SCSS** | CSS with superpowers (variables, nesting, mixins) | All styling, BEM convention |
| **classnames** | Utility for conditional CSS classes | `className={cn('active', { selected: isSelected })}` |
| **react-hot-toast** | Toast notifications (those little pop-up messages) | "Project saved", "Export complete" |

### Group 4: Code Generation & Export

| Library | What it does |
|---|---|
| **JSZip** | Creates ZIP files in the browser (no server needed!) |
| **highlight.js** | Syntax highlighting for the code preview panel |

There's **no template engine** (like Handlebars). All Kedro code (Python, YAML) is generated using plain TypeScript string interpolation.

### Group 5: Testing

| Library | What it does |
|---|---|
| **Vitest** | Test runner (like Jest, but built for Vite) |
| **@testing-library/react** | Test React components by simulating user behavior |
| **@testing-library/user-event** | Simulate clicks, typing, etc. in tests |

### The "No Server" Architecture

This app has **NO backend**. Everything runs in the browser:
- State is stored in browser memory (Redux)
- Persistence uses `localStorage` (browser storage)
- ZIP files are generated client-side
- No API calls, no database, no server

### Visual Summary

```
┌──────────────────────────────────────────────────────┐
│                    User's Browser                     │
│                                                       │
│  React 19 ──── Components (what you see)             │
│       │                                               │
│  Redux Toolkit ── Store (nodes, datasets, connections)│
│       │                                               │
│  ReactFlow ──── Canvas (drag, drop, connect)         │
│       │                                               │
│  react-hook-form ── Forms (configure nodes/datasets) │
│       │                                               │
│  JSZip ──── Export (generate & download ZIP)          │
│       │                                               │
│  localStorage ── Persistence (auto-save your work)   │
└──────────────────────────────────────────────────────┘
         No server. No API. Everything is here.
```

---

## Lesson 4: State Management with Redux -- The Brain of the App

This is the most important lesson. If you understand how state works, you understand how the entire app works.

### Part A: Why Redux? The Problem.

Imagine 15 components that all need to know about the same list of nodes. With plain React `useState`, you'd have to:
1. Put the state in a common parent component
2. Pass it down through props (5, 6, 7 levels deep)
3. Pass callbacks up to modify it

This is called **prop drilling**, and it becomes unmanageable fast. Redux solves this: put ALL shared state in one central place, and let any component read/write it directly.

### Part B: The Store -- One Object to Rule Them All

File: `src/store/index.ts`

```typescript
export const store = configureStore({
  reducer: {
    project: projectReducer,
    nodes: nodesReducer,
    datasets: datasetsReducer,
    connections: connectionsReducer,
    ui: uiReducer,
    validation: validationReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(preferencesMiddleware, autoSaveMiddleware),
});
```

This creates **one global object** with 7 sections (slices). At any point in time, the entire app state looks like this:

```
store = {
  project:     { current: {...}, savedList: [...], lastSaved: ... }
  nodes:       { byId: {...}, allIds: [...], selected: [...], hovered: null }
  datasets:    { byId: {...}, allIds: [...], selected: [...] }
  connections: { byId: {...}, allIds: [...], selected: [...] }
  ui:          { showTutorial: false, showConfigPanel: true, ... }
  validation:  { errors: [...], warnings: [...], isValid: true, ... }
  theme:       { theme: 'light' }
}
```

### Part C: A Slice -- The Simplest Example

File: `src/features/theme/themeSlice.ts` (30 lines)

```typescript
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS, safeGetItem } from '../../constants';
import type { ThemeState } from '../../types/redux';

const getInitialTheme = (): ThemeState['theme'] => {
  const storedTheme = safeGetItem(STORAGE_KEYS.THEME);
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light';
};

const initialState: ThemeState = {
  theme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
```

Breakdown:

| Part | What it does | Plain English |
|---|---|---|
| `initialState` | The starting value | "When the app loads, theme is 'light' (or whatever was saved)" |
| `createSlice(...)` | Defines this section of state | "Create a state bucket called 'theme'" |
| `name: 'theme'` | The slice's identity | "This slice is called 'theme'" |
| `reducers: {...}` | Functions that change state | "Here's HOW the theme can change" |
| `setTheme` | A reducer | "When setTheme is called, replace the theme with the given value" |
| `toggleTheme` | A reducer | "When toggleTheme is called, flip light to dark or vice versa" |
| `export const { setTheme, toggleTheme }` | Export the **actions** | "Other files can now trigger these changes" |
| `export default themeSlice.reducer` | Export the **reducer** | "The store needs this to know how to handle theme actions" |

**Key insight**: `action.payload` is the data attached to an action. When a component calls `dispatch(setTheme('dark'))`, the payload is `'dark'`.

### Part D: The Normalized Pattern -- byId + allIds

File: `src/features/nodes/nodesSlice.ts`

```typescript
const initialState: NodesState = {
  byId: {},
  allIds: [],
  selected: [],
  hovered: null,
};
```

This is called **normalized state**. Instead of storing nodes as an array:

```typescript
// BAD: Array approach
nodes: [
  { id: 'node-abc', name: 'clean_data', ... },
  { id: 'node-def', name: 'train_model', ... },
]
// To find node-def, you scan the whole array: O(n)
```

They store it as a dictionary + order list:

```typescript
// GOOD: Normalized approach (what this app uses)
nodes: {
  byId: {
    'node-abc': { id: 'node-abc', name: 'clean_data', ... },
    'node-def': { id: 'node-def', name: 'train_model', ... },
  },
  allIds: ['node-abc', 'node-def']
}
// To find node-def: byId['node-def'] -- instant! O(1)
```

Three slices use this pattern: `nodes`, `datasets`, and `connections`.

### Part E: Actions & Reducers -- How State Changes

The `addNode` reducer in `nodesSlice.ts`:

```typescript
addNode: {
  reducer: (state, action: PayloadAction<KedroNode>) => {
    const node = action.payload;
    state.byId[node.id] = node;
    if (!state.allIds.includes(node.id)) {
      state.allIds.push(node.id);
    }
  },
  prepare: (payload: KedroNode | { type: NodeType; position: { x: number; y: number } }) => {
    if ('id' in payload) {
      return { payload };
    }
    const id = generateId('node');
    const newNode: KedroNode = {
      id,
      name: '',
      type: payload.type,
      inputs: [],
      outputs: [],
      position: payload.position,
    };
    return { payload: newNode };
  },
},
```

This has two parts:
- **`prepare`**: Runs BEFORE the reducer. It can create default values. "If you only gave me a type and position, I'll generate a full node with an ID for you."
- **`reducer`**: Actually updates the state. "Put this node into `byId` and add its ID to `allIds`."

### Part F: Selectors -- How Components READ State

File: `src/features/nodes/nodesSelectors.ts`

```typescript
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selectors
const selectNodesById = (state: RootState) => state.nodes.byId;
const selectNodesAllIds = (state: RootState) => state.nodes.allIds;
const selectNodesSelected = (state: RootState) => state.nodes.selected;

// Memoized selectors
export const selectAllNodes = createSelector(
  [selectNodesById, selectNodesAllIds],
  (byId, allIds) => allIds.map((id) => byId[id]).filter(Boolean)
);

export const selectNodeById = createSelector(
  [selectNodesById, (_state: RootState, nodeId: string) => nodeId],
  (byId, nodeId) => byId[nodeId]
);

export const selectSelectedNode = createSelector(
  [selectNodesById, selectNodesSelected],
  (byId, selectedIds) => (selectedIds.length > 0 ? byId[selectedIds[0]] : null)
);

export const selectNodesCount = createSelector(
  [selectNodesAllIds],
  (allIds) => allIds.length
);
```

**`createSelector`** is **memoized** -- it only recalculates when its inputs change, preventing unnecessary re-renders.

### Part G: How Components Use All This

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNode, deleteNode } from '@/features/nodes/nodesSlice';
import { selectAllNodes } from '@/features/nodes/nodesSelectors';

function MyComponent() {
  const dispatch = useAppDispatch();           // To WRITE state
  const nodes = useAppSelector(selectAllNodes); // To READ state

  const handleAdd = () => {
    dispatch(addNode({ type: 'custom', position: { x: 0, y: 0 } }));
  };

  const handleDelete = (id: string) => {
    dispatch(deleteNode(id));
  };

  return <div>{nodes.map(n => <span key={n.id}>{n.name}</span>)}</div>;
}
```

Two hooks:
- **`useAppSelector(selector)`** -- read data from the store
- **`useAppDispatch()`** -- get the dispatch function to send actions

### Part H: The Complete Picture

```
Component calls dispatch(addNode({...}))
    │
    ▼
Action: { type: 'nodes/addNode', payload: { id: 'node-xyz', name: '', ... } }
    │
    ▼
Reducer in nodesSlice updates state.byId and state.allIds
    │
    ▼
Auto-save middleware notices a node action → saves to localStorage
    │
    ▼
Any component using useAppSelector(selectAllNodes) re-renders
```

### Quick Summary: The 7 Slices

| Slice | What it holds | Key actions |
|---|---|---|
| **project** | Project name, description, saved list | `createProject`, `resetProject` |
| **nodes** | All Kedro function nodes (normalized) | `addNode`, `updateNode`, `deleteNode` |
| **datasets** | All Kedro datasets (normalized) | `addDataset`, `updateDataset`, `deleteDataset` |
| **connections** | All edges between nodes/datasets (normalized) | `addConnection`, `deleteConnection` |
| **ui** | Which panels are open, what's selected | `openConfigPanel`, `showExportWizard` |
| **validation** | Errors, warnings, isValid flag | `setValidationResults`, `clearValidation` |
| **theme** | Light or dark mode | `toggleTheme`, `setTheme` |

---

## Lesson 5: The Canvas -- ReactFlow and the Visual Pipeline Builder

This is the heart of the app -- the big interactive area where users drag nodes, connect them, and build pipelines visually.

### Part A: What is ReactFlow, Simply?

ReactFlow gives you three things out of the box:

1. **A zoomable, pannable canvas** (like Google Maps -- you can zoom in/out and drag to scroll)
2. **Nodes** -- draggable boxes on the canvas
3. **Edges** -- lines connecting those boxes

You give ReactFlow an array of nodes and an array of edges, and it renders them.

### Part B: The Three Visual Elements

#### 1. CustomNode (the blue "function" box) -- `src/components/Canvas/CustomNode/CustomNode.tsx`

```typescript
export const CustomNode = memo<NodeProps>(({ data, selected }) => {
  const nodeData = data as KedroNode;
  const { hasError, hasWarning } = useAppSelector((state) =>
    selectNodeValidationStatus(state, nodeData.id)
  );

  return (
    <div className={nodeClasses}>
      <Handle type="target" position={Position.Top} id="input" />
      <div className="custom-node__content">
        <div className="custom-node__icon">ƒ</div>
        <h4>{nodeData.name || 'Unnamed Node'}</h4>
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});
```

Renders a blue box with an `ƒ` icon, the node's name, and two handles (input on top, output on bottom).

#### 2. DatasetNode (the green "data" box) -- `src/components/Canvas/DatasetNode/DatasetNode.tsx`

Renders a green box with a type-specific icon (spreadsheet for CSV, database for Parquet, etc.), the dataset's name, and file type label.

#### 3. CustomEdge (the connecting line) -- `src/components/Canvas/CustomEdge/CustomEdge.tsx`

Draws a curved bezier line between two nodes. Turns blue when selected.

### Part C: How They're Registered

In `PipelineCanvas.tsx`:

```typescript
const nodeTypes = {
  kedroNode: CustomNode,
  datasetNode: DatasetNode,
};

const edgeTypes = {
  kedroEdge: CustomEdge,
};
```

### Part D: The PipelineCanvas Component -- Command Center

`PipelineCanvas.tsx` wires up all the behavior:

```
PipelineCanvas
│
├── useCanvasState()          ← Gets nodes & edges from Redux, converts to ReactFlow format
├── useConnectionHandlers()   ← Handles creating/validating new connections
├── useNodeHandlers()         ← Handles drag, drop, delete, click on nodes
├── useSelectionHandlers()    ← Handles multi-select, bulk delete, edge clicks
│
└── <ReactFlow               ← The actual canvas component
      nodes={nodes}
      edges={edges}
      onNodesChange={...}
      onConnect={...}
      onDrop={...}
      onNodeClick={...}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      ...30+ configuration props
    />
```

### Part E: The Canvas Hook Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    PipelineCanvas.tsx                      │
│                                                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │ useCanvasState   │  │ useConnectionHandlers         │   │
│  │                  │  │                               │   │
│  │ - Read Redux     │  │ - Validate new connections    │   │
│  │ - Convert to     │  │ - Prevent cycles              │   │
│  │   ReactFlow      │  │ - Enforce bipartite rules     │   │
│  │   format         │  │   (node->dataset, not         │   │
│  │ - Track          │  │    node->node)                │   │
│  │   selections     │  │ - Show ghost preview          │   │
│  └─────────────────┘  └──────────────────────────────┘   │
│                                                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │ useNodeHandlers  │  │ useSelectionHandlers          │   │
│  │                  │  │                               │   │
│  │ - Handle drop    │  │ - Multi-select (box drag)     │   │
│  │   from palette   │  │ - Click to select/deselect    │   │
│  │ - Position       │  │ - Bulk delete with confirm    │   │
│  │   updates        │  │ - Edge selection              │   │
│  │ - Delete with    │  │ - Clear selections on         │   │
│  │   confirmation   │  │   pane click                  │   │
│  └─────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Part F: The Key Rule -- Bipartite Graph

Connections can only go between a node and a dataset, never node-to-node or dataset-to-dataset:

```
  [Function Node] --> [Dataset] --> [Function Node]    (correct)
  [Function Node] --> [Function Node]                  (blocked)
  [Dataset] --> [Dataset]                              (blocked)
```

This is enforced in `useConnectionHandlers` via `isValidConnection`.

### Part G: The `memo()` Pattern

All three visual components use `memo()`:

```typescript
export const CustomNode = memo<NodeProps>(({ data, selected }) => { ... });
export const DatasetNode = memo<NodeProps>(({ data, selected }) => { ... });
export const CustomEdge = memo<EdgeProps>(({ ... }) => { ... });
```

`memo()` tells React: "Don't re-render this component if its props haven't changed."

### Part H: Visual Summary -- What the User Sees

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (project name, theme toggle)                            │
├──────────┬──────────────────────────────────────┬───────────────┤
│          │                                      │               │
│  Node    │         ReactFlow Canvas             │   Config      │
│  Palette │                                      │   Panel       │
│          │    ┌───────────┐                     │               │
│  [Node]  │    │ clean_data│──────┐              │  Name: ____   │
│  [Data]  │    │    (f)    │      │              │  Type: ____   │
│          │    └───────────┘      ▼              │  Code: ____   │
│          │              ┌──────────────┐        │               │
│          │              │ raw_data.csv │        │               │
│          │              │  csv         │        │               │
│          │              └──────────────┘        │               │
│          │                      │               │               │
│          │                      ▼               │               │
│          │              ┌───────────┐           │               │
│          │              │train_model│           │               │
│          │              │    (f)    │           │               │
│          │              └───────────┘           │               │
│          │                                      │               │
├──────────┴──────────────────────────────────────┴───────────────┤
│  Toolbar (zoom controls, pan mode)   │  Validation Panel        │
└──────────────────────────────────────┴──────────────────────────┘
```

---

## Lesson 6: The Complete Data Flow -- Following a User Action End-to-End

### The Scenario: User Drags a "CSV Dataset" From the Palette Onto the Canvas

#### Step 1: The Drag Starts (NodePalette)

The browser's native Drag & Drop API stores the type:

```typescript
onDragStart={(event) => {
  event.dataTransfer.setData(DND_TYPES.DATASET, 'csv');
}}
```

#### Step 2: The Drop Lands (useNodeHandlers)

The `handleDrop` function in `useNodeHandlers.ts`:

```typescript
const handleDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  setIsDraggingOver(false);

  const datasetType = event.dataTransfer.getData(DND_TYPES.DATASET);
  if (!datasetType) return;

  dispatch(clearSelection());
  dispatch(clearConnectionSelection());

  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  const newDatasetId = generateId('dataset');
  dispatch(addDataset({
    id: newDatasetId,
    name: '',
    type: datasetType as DatasetType,
    position,
  }));

  trackEvent('dataset_added', { type: datasetType });
  dispatch(setPendingComponent({ type: 'dataset', id: newDatasetId }));
  selectAndOpenConfig('dataset', newDatasetId);
}, [...]);
```

What happens in sequence:

| Step | Code | What happens |
|---|---|---|
| 1 | `event.dataTransfer.getData(DND_TYPES.DATASET)` | Read "csv" from the drag data |
| 2 | `screenToFlowPosition({x, y})` | Convert screen pixels to canvas coordinates |
| 3 | `generateId('dataset')` | Create a unique ID like `dataset-a1b2c3d4-...` |
| 4 | `dispatch(addDataset({...}))` | **Send action to Redux** |
| 5 | `trackEvent(...)` | Log telemetry (analytics) |
| 6 | `selectAndOpenConfig(...)` | Open the config panel for this new dataset |

#### Step 3: Redux Processes the Action (datasetsSlice)

```typescript
addDataset: (state, action) => {
  const dataset = action.payload;
  state.byId[dataset.id] = dataset;
  state.allIds.push(dataset.id);
}
```

#### Step 4: Auto-Save Middleware Fires

`'datasets/addDataset'` is in the `SAVE_TRIGGER_ACTIONS` list. A 500ms debounce timer starts. After 500ms, the state is saved to localStorage.

#### Step 5: Selectors Recompute

`selectCanvasData` recomputes and now includes our new dataset.

#### Step 6: Redux Data Converts to ReactFlow Format

`useCanvasState` converts the Redux dataset into a ReactFlow node:

```typescript
{
  id: 'dataset-a1b2c3d4',
  type: 'datasetNode',
  position: { x: 300, y: 200 },
  data: { id: '...', name: '', type: 'csv', ... },
  selected: false,
  draggable: true,
}
```

#### Step 7: ReactFlow Renders the Node

ReactFlow sees `type: 'datasetNode'`, finds `DatasetNode` in the registry, and renders the green CSV box.

#### Step 8: Config Panel Opens

The `selectAndOpenConfig` call opens the right-side panel for editing.

### The Complete Journey -- One Diagram

```
  User drags "CSV" from palette and drops on canvas
    │
    ▼
  handleDrop() in useNodeHandlers
    │
    ├── generateId('dataset')              → 'dataset-a1b2c3d4'
    ├── dispatch(addDataset({...}))        → Redux action
    ├── dispatch(setPendingComponent(...)) → Redux action
    └── selectAndOpenConfig(...)           → Redux actions
          │
          ▼
  Redux Store processes actions
    │
    ├── datasetsSlice reducer: adds to byId + allIds
    ├── uiSlice reducer: sets showConfigPanel = true
    └── nodesSlice reducer: updates selected
          │
          ├──────────────────────────────────┐
          ▼                                  ▼
  Auto-save middleware              Selectors recompute
  (500ms debounce)                      │
          │                              ▼
          ▼                    useCanvasState converts
  localStorage.setItem()      Redux → ReactFlow format
                                        │
                                        ▼
                              ReactFlow re-renders
                                        │
                              ┌─────────┴──────────┐
                              ▼                    ▼
                        Green CSV box         Config Panel
                        appears on            opens on
                        canvas                the right
```

### Why This Architecture Matters

Notice the **unidirectional flow**: User Action -> Dispatch -> Redux -> Selectors -> UI Update. Data always flows in one direction.

- **Debugging**: If a node doesn't appear, check Redux DevTools -- is it in the store? If yes, the problem is in the selector or rendering. If no, the problem is in the dispatch.
- **Testing**: You can test each layer independently.
- **No surprises**: A component never directly modifies another component. Everything goes through Redux.

---

## Lesson 7: Code Generation & Export -- From Visual Pipeline to Real Kedro Project

### Part A: What Gets Generated?

```
my_project.zip/
├── pyproject.toml              ← Project config + dependencies
├── README.md                   ← Project documentation
├── .gitignore                  ← Git ignore rules
├── .telemetry                  ← Kedro telemetry config
├── conf/
│   ├── base/
│   │   ├── catalog.yml         ← Dataset definitions (THE DATA CATALOG)
│   │   ├── parameters.yml      ← Pipeline parameters
│   └── local/
│       └── credentials.yml     ← Credentials template
├── src/
│   └── my_project/
│       ├── __init__.py
│       ├── settings.py         ← Kedro settings
│       ├── pipeline_registry.py ← Registers all pipelines
│       └── pipelines/
│           ├── __init__.py
│           └── default/
│               ├── __init__.py
│               ├── nodes.py    ← Python functions (THE CODE)
│               └── pipeline.py ← Pipeline definition (THE WIRING)
├── data/
│   ├── 01_raw/.gitkeep         ← Standard Kedro data layers
│   ├── 02_intermediate/.gitkeep
│   ├── ... (8 layers total)
│   └── 08_reporting/.gitkeep
└── logs/.gitkeep
```

### Part B: The Builder Pattern

File: `src/infrastructure/export/KedroProjectBuilder.ts`

```typescript
export class KedroProjectBuilder {
  private zip: JSZip;
  private nodes: KedroNode[];
  private datasets: Record<string, KedroDataset>;
  private connections: KedroConnection[];

  constructor(state: RootState, metadata: ProjectMetadata) {
    this.zip = new JSZip();
    this.nodes = state.nodes.allIds.map((id) => state.nodes.byId[id]);
    this.datasets = state.datasets.byId;
    this.connections = state.connections.allIds.map((id) => state.connections.byId[id]);
  }

  withCatalog(): this {
    this.zip.file('conf/base/catalog.yml', generateCatalog(this.datasetsList));
    return this;
  }

  withPipeline(): this { ... return this; }
  withNodes(): this { ... return this; }
  withConfiguration(): this { ... return this; }
  withRootFiles(): this { ... return this; }
  withPackageStructure(): this { ... return this; }
  withDataDirectories(): this { ... return this; }
  withLogsDirectory(): this { ... return this; }

  async build(): Promise<Blob> {
    return await this.zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }
}
```

Usage:

```typescript
const blob = await new KedroProjectBuilder(state, metadata)
  .withAllFiles()
  .build();
```

### Part C: The Three Most Important Generators

For a pipeline like: `[clean_data (f)] --> [raw_data (CSV)] --> [train_model (f)]`

#### 1. `catalogGenerator.ts` produces `catalog.yml`:

```yaml
raw_data:
  type: pandas.CSVDataset
  filepath: data/01_raw/raw_data.csv
  layer: 01_raw
```

#### 2. `pipelineGenerator.ts` produces `pipeline.py`:

```python
from kedro.pipeline import node, Pipeline
from .nodes import clean_data, train_model

def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline([
        node(func=clean_data, inputs="raw_data", outputs="raw_data", name="clean_data_node"),
        node(func=train_model, inputs="raw_data", outputs="raw_data", name="train_model_node"),
    ])
```

#### 3. `nodesGenerator.ts` produces `nodes.py`:

```python
def clean_data(raw_data: pd.DataFrame) -> pd.DataFrame:
    """Clean and preprocess raw data."""
    # TODO: Implement clean_data logic
    return raw_data
```

### Part D: The Export Flow

```
User clicks "Export"
    │
    ▼
ExportWizard opens → User confirms metadata
    │
    ▼
Validation runs (all 8 validators)
    │
    ├── Errors? → Show errors, block export
    └── All clear? → Continue
          │
          ▼
generateKedroProject(state, metadata)
    │
    ├── .withCatalog()      → YAML
    ├── .withPipeline()     → Python
    ├── .withNodes()        → Python
    ├── .withRootFiles()    → pyproject.toml, README, .gitignore
    ├── ... other files
    └── .build()            → JSZip compresses into Blob
          │
          ▼
downloadProject(blob, projectName)
    │
    ├── URL.createObjectURL(blob)
    ├── Create invisible <a> link
    ├── link.click() → Browser download
    └── URL.revokeObjectURL(url)
```

### Part E: No Template Engine

All code is generated with plain TypeScript template literals:

```typescript
return `node(
    func=${funcName},
    inputs=${inputsStr},
    outputs=${outputsStr},
    name="${funcName}_node",
)`;
```

---

## Lesson 8: The Validation System -- Catching Errors Before They Become Bugs

### Part A: What Can Go Wrong?

```
  [clean_data] --> [raw.csv] --> [clean_data]    ← CYCLE!
  [unnamed]                                       ← No name!
  [train model]                                   ← Invalid name (needs snake_case)!
  [lonely_dataset]                                ← Orphan (not connected)!
```

### Part B: The 8 Validators

#### Errors (blocking -- you CANNOT export)

| Validator | What it checks |
|---|---|
| **CircularDependencyValidator** | Are there cycles in the graph? |
| **DuplicateNameValidator** | Do any two nodes/datasets share a name? |
| **EmptyNameValidator** | Does any node/dataset have no name? |
| **InvalidNameValidator** | Are all names valid Python identifiers? |

#### Warnings (non-blocking -- you CAN export, but should fix)

| Validator | What it checks |
|---|---|
| **OrphanedNodeValidator** | Is any node not connected to anything? |
| **OrphanedDatasetValidator** | Is any dataset not connected to anything? |
| **MissingCodeValidator** | Does any node lack function code? |
| **MissingConfigValidator** | Does any dataset lack configuration? |

### Part C: The Strategy Pattern

Every validator follows the same interface:

```typescript
export interface Validator {
  readonly id: string;
  readonly name: string;
  readonly severity: 'error' | 'warning';
  validate(state: RootState): ValidationError[];
}
```

Example -- CircularDependencyValidator:

```typescript
export class CircularDependencyValidator implements Validator {
  readonly id = 'circular-dependency';
  readonly name = 'Circular Dependency Check';
  readonly severity = 'error' as const;

  validate(state: RootState): ValidationError[] {
    const errors: ValidationError[] = [];
    const connections = getConnectionsArray(state);
    const graph = buildDependencyGraph(state.nodes.allIds, connections);
    const cycles = detectCycles(graph);

    cycles.forEach((cycle) => {
      if (cycle.hasCycle) {
        errors.push({
          id: `error-circular-${cycle.cyclePath[0]}`,
          severity: 'error',
          componentId: cycle.cyclePath[0],
          componentType: 'pipeline',
          message: `Circular dependency detected: ${cycleNames}`,
          suggestion: 'Remove one connection to break the cycle',
        });
      }
    });
    return errors;
  }
}
```

### Part D: The Registry

```typescript
export function createDefaultValidatorRegistry(): ValidatorRegistry {
  const registry = new ValidatorRegistry();

  // Error validators (blocking)
  registry
    .register(new CircularDependencyValidator())
    .register(new DuplicateNameValidator())
    .register(new InvalidNameValidator())
    .register(new EmptyNameValidator());

  // Warning validators (non-blocking)
  registry
    .register(new OrphanedNodeValidator())
    .register(new OrphanedDatasetValidator())
    .register(new MissingCodeValidator())
    .register(new MissingConfigValidator());

  return registry;
}
```

### Part E: The Entry Point

```typescript
export function validatePipeline(state: RootState): ValidationResult {
  const registry = getDefaultValidatorRegistry();
  const allIssues = registry.validateAll(state);

  const errors = allIssues.filter((e) => e.severity === 'error');
  const warnings = allIssues.filter((e) => e.severity === 'warning');

  return { errors, warnings, isValid: errors.length === 0 };
}
```

### Part F: When Does Validation Run?

1. **When the user clicks "View Code"** -- blocks if errors exist
2. **When the user clicks "Export"** -- opens wizard with errors/warnings shown
3. **While the Export Wizard is open** -- live re-validation on config changes (debounced)

### Part G: How Errors Reach the UI

```
validatePipeline(state)
    │
    ▼
Returns { errors: [...], warnings: [...], isValid: false }
    │
    ▼
dispatch(setValidationResults(result))     → validationSlice stores it
    │
    ├─→ ValidationPanel reads from validationSlice → Shows error list
    ├─→ CustomNode reads selectNodeValidationStatus → Red/yellow border
    └─→ DatasetNode reads selectDatasetValidationStatus → Red/yellow border
```

### Part H: Why This Design Is Good

| Benefit | How |
|---|---|
| **Easy to add new rules** | Create a new class, register it. No other file changes. |
| **Easy to test** | Each validator is tested independently (94 tests, 100% coverage) |
| **Easy to understand** | Each file does ONE thing |
| **Easy to toggle** | Want to disable a validator? Just don't register it. |

---

## Lesson 9: The Type System -- How TypeScript Prevents Bugs at Compile Time

### Part A: The Domain Types

File: `src/types/kedro.ts`

```typescript
export interface KedroNode {
  id: string;
  name: string;
  type: NodeType;       // 'data_ingestion' | 'data_processing' | ... (5 values)
  inputs: string[];
  outputs: string[];
  functionCode?: string;
  position: { x: number; y: number };
}

export interface KedroDataset {
  id: string;
  name: string;
  type: DatasetType;    // 'csv' | 'parquet' | 'json' | ... (75+ values)
  filepath?: string;
  layer?: DataLayer;    // '01_raw' | '02_intermediate' | ... (8 values)
  versioned?: boolean;
  position: { x: number; y: number };
}

export interface KedroConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}
```

These three interfaces are the **core vocabulary** of the app.

### Part B: Branded ID Types -- The Clever Trick

File: `src/types/ids.ts`

```typescript
// WITHOUT branded types -- a bug waiting to happen
function deleteNode(id: string) { ... }
deleteNode(datasetId);   // TypeScript: Fine! Runtime: Bug!

// WITH branded types
type Brand<T, B> = T & { readonly [__brand]: B };
export type NodeId = Brand<string, 'NodeId'>;
export type DatasetId = Brand<string, 'DatasetId'>;
export type ConnectionId = Brand<string, 'ConnectionId'>;

function deleteNode(id: NodeId) { ... }
deleteNode(datasetId);   // TypeScript: ERROR! "DatasetId is not assignable to NodeId"
```

The brand is a **phantom type** -- exists only at compile time. Zero runtime overhead.

### Part C: Type Guards -- Runtime Type Detection

```typescript
export function isNodeId(id: string): id is NodeId {
  return id.startsWith('node-');
}

export function isDatasetId(id: string): id is DatasetId {
  return id.startsWith('dataset-');
}

export function isConnectionId(id: string): id is ConnectionId {
  return id.includes('node-') && id.includes('dataset-');
}
```

The `id is NodeId` return type tells TypeScript: "If this returns `true`, narrow the type."

```typescript
if (isNodeId(change.id)) {
  // TypeScript KNOWS change.id is a NodeId here
  dispatch(updateNodePosition({ id: change.id, ... }));
} else if (isDatasetId(change.id)) {
  // TypeScript KNOWS change.id is a DatasetId here
  dispatch(updateDatasetPosition({ id: change.id, ... }));
}
```

### Part D: ID Generation

File: `src/domain/IdGenerator.ts`

```typescript
function uniqueSuffix(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();   // Modern browsers: guaranteed unique
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;  // Fallback
}

export function generateNodeId(): NodeId {
  return `node-${uniqueSuffix()}` as NodeId;
}

export function generateConnectionId(source: string, target: string): ConnectionId {
  return `${source}-${target}` as ConnectionId;  // Deterministic!
}
```

Connection IDs are **deterministic** -- same source+target always produces the same ID, preventing duplicates.

### Part E: Key Takeaway

When working in this codebase:
1. **Always use `generateId()` or `generateNodeId()`** to create IDs
2. **Use `isNodeId()` / `isDatasetId()`** to check unknown IDs
3. **Look at `types/kedro.ts`** when confused about object shapes
4. **Trust the compiler** -- type errors are almost always real bugs

---

## Lesson 10: Persistence & Middleware -- How the App Saves Your Work

### Part A: What Gets Saved, and Where?

| Key | What's stored | When it changes |
|---|---|---|
| `kedro_builder_current_project` | Entire pipeline (project, nodes, datasets, connections) | Every mutation (debounced 500ms) |
| `kedro_builder_tutorial_completed` | `'true'` if user finished the tutorial | Once |
| `kedro_builder_walkthrough_completed` | `'true'` if user finished the walkthrough | Once |
| `kedro_builder_theme` | `'light'` or `'dark'` | When user toggles theme |
| `kedro-builder-telemetry` | Telemetry consent | Once |
| `kedro-builder-telemetry-consent-shown` | Whether consent dialog was shown | Once |

### Part B: The Two Middlewares

```
  dispatch(action)  →  [preferencesMiddleware]  →  [autoSaveMiddleware]  →  Reducer  →  New State
```

#### Middleware 1: preferencesMiddleware (29 lines)

Watches for theme changes, tutorial/walkthrough completion. Writes immediately to localStorage.

```typescript
export const preferencesMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  if (setTheme.match(action) || toggleTheme.match(action)) {
    safeSetItem(STORAGE_KEYS.THEME, store.getState().theme.theme);
  }
  if (completeTutorial.match(action)) {
    safeSetItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
  }
  if (completeWalkthrough.match(action) || skipWalkthrough.match(action)) {
    safeSetItem(STORAGE_KEYS.WALKTHROUGH_COMPLETED, 'true');
  }

  return result;
};
```

#### Middleware 2: autoSaveMiddleware (55 lines)

Watches for pipeline mutations (add/update/delete nodes, datasets, connections). Debounces 500ms, then saves full state.

```typescript
const SAVE_TRIGGER_ACTIONS = [
  'project/createProject', 'project/updateProject',
  'nodes/addNode', 'nodes/updateNode', 'nodes/deleteNode', ...
  'datasets/addDataset', 'datasets/updateDataset', ...
  'connections/addConnection', 'connections/deleteConnection', ...
];

export const autoSaveMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  if (SAVE_TRIGGER_ACTIONS.some(trigger => action.type.startsWith(trigger))) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveProjectToLocalStorage(store.getState());
    }, 500);
  }

  return result;
};
```

### Part C: The Save Function -- Defensive Programming

File: `src/infrastructure/localStorage/localStorage.ts`

6 layers of defense:

```typescript
export const saveProjectToLocalStorage = (state: RootState): boolean => {
  // 1. Is localStorage even available?
  if (!isLocalStorageAvailable()) { notifyStorageUnavailable(); return false; }

  try {
    // 2. Is there a project to save?
    if (!state.project.current) { return true; }

    // 3. Convert normalized Redux state to flat array format
    const projectData = {
      project: { ...state.project.current, updatedAt: Date.now() },
      nodes: state.nodes.allIds.map(id => state.nodes.byId[id]),
      datasets: state.datasets.allIds.map(id => state.datasets.byId[id]),
      connections: state.connections.allIds.map(id => state.connections.byId[id]),
    };

    const serializedData = JSON.stringify(projectData);

    // 4. Would this exceed the 4MB safety limit?
    if (wouldExceedStorageLimit(serializedData)) { handleQuotaExceeded(); return false; }

    // 5. Actually save it
    localStorage.setItem(STORAGE_KEY, serializedData);
    return true;
  } catch (error) {
    // 6. Handle quota exceeded at the browser level
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      handleQuotaExceeded();
    }
    return false;
  }
};
```

### Part D: The Load Function -- Zod Validation

```typescript
export const loadProjectFromLocalStorage = (): StoredProjectState | null => {
  if (!isLocalStorageAvailable()) { return null; }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const rawData = JSON.parse(stored);
    const validatedData = parseStoredProjectState(rawData);  // Zod validation!

    if (!validatedData) {
      toast.error('Project data format is invalid. Starting fresh.');
      clearProjectFromLocalStorage();
      return null;
    }

    return validatedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      toast.error('Project data appears to be corrupted. Starting fresh.');
      clearProjectFromLocalStorage();
    }
    return null;
  }
};
```

### Part E: App Initialization -- The Startup Sequence

File: `src/components/App/hooks/useAppInitialization.ts`

```typescript
export const useAppInitialization = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const tutorialCompleted = safeGetItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
    const walkthroughCompleted = safeGetItem(STORAGE_KEYS.WALKTHROUGH_COMPLETED);
    const savedProject = loadProjectFromLocalStorage();

    if (!tutorialCompleted) {
      dispatch(setShowTutorial(true));        // First-time user → tutorial
    } else if (!walkthroughCompleted) {
      dispatch(startWalkthrough());            // Tutorial done → walkthrough
    } else if (savedProject) {
      // Returning user → restore project by replaying actions
      dispatch(clearNodes());
      dispatch(clearDatasets());
      dispatch(clearConnections());
      dispatch(loadProject(savedProject.project));
      savedProject.nodes.forEach((node) => dispatch(addNode(node)));
      savedProject.datasets.forEach((dataset) => dispatch(addDataset(dataset)));
      savedProject.connections.forEach((conn) => dispatch(addConnection(conn)));
      dispatch(setHasActiveProject(true));
    } else {
      dispatch(setHasActiveProject(false));    // No project → empty canvas
    }
  }, []);
};
```

### Part F: The Complete Persistence Lifecycle

```
                         ┌─────────────────────┐
                         │    App Opens         │
                         │  useAppInitialization │
                         │  reads localStorage   │
                         │  dispatches addNode,  │
                         │  addDataset, etc.     │
                         └──────────┬────────────┘
                                    │
                                    ▼
              ┌──────────── Redux Store ◄────────────┐
              │             (in memory)               │
              │                                       │
              ▼                                       │
     User makes changes                               │
              │                                       │
              ▼                                       │
     autoSaveMiddleware ──(500ms debounce)──► localStorage
     preferencesMiddleware ──(immediate)───► localStorage
              │                                       │
              │         ┌─────────────────────┐       │
              │         │  User refreshes page │───────┘
              │         └─────────────────────┘
              ▼
     Components re-render with new state
```

---

## Lesson 11: Architecture Summary & Known Issues -- The Owner's Manual

### Part A: The Full Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                       │
│                                                                         │
│  ┌─────────────── UI LAYER (React Components) ────────────────────┐    │
│  │                                                                 │    │
│  │  Header  │  NodePalette  │  PipelineCanvas  │  ConfigPanel     │    │
│  │  Toolbar │  Tutorial     │  (ReactFlow)     │  CodeViewer      │    │
│  │          │  Walkthrough  │  CustomNode       │  ExportWizard    │    │
│  │          │               │  DatasetNode      │  ValidationPanel │    │
│  │          │               │  CustomEdge       │                  │    │
│  └────────────────────────┬────────────────────────────────────────┘    │
│                           │                                             │
│              useAppSelector (read) │ dispatch (write)                   │
│                           │                                             │
│  ┌───────────── STATE LAYER (Redux Toolkit) ──────────────────────┐    │
│  │                                                                 │    │
│  │  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌─────────────┐         │    │
│  │  │ project │ │ nodes  │ │ datasets │ │ connections │         │    │
│  │  └─────────┘ └────────┘ └──────────┘ └─────────────┘         │    │
│  │  ┌────┐ ┌────────────┐ ┌───────┐                              │    │
│  │  │ ui │ │ validation │ │ theme │    + selectors (memoized)    │    │
│  │  └────┘ └────────────┘ └───────┘                              │    │
│  └────────────────────────┬────────────────────────────────────────┘    │
│                           │                                             │
│              middleware (side effects)                                   │
│                           │                                             │
│  ┌──────────── INFRASTRUCTURE LAYER ──────────────────────────────┐    │
│  │                                                                 │    │
│  │  autoSaveMiddleware ──→ localStorage (project data)            │    │
│  │  preferencesMiddleware ──→ localStorage (theme, onboarding)    │    │
│  │  KedroProjectBuilder ──→ JSZip ──→ Browser download            │    │
│  │  Telemetry ──→ Heap analytics                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────── LOGIC LAYER (Pure Functions) ──────────────────────┐    │
│  │                                                                 │    │
│  │  domain/           │ utils/validation/    │ infrastructure/     │    │
│  │  ├── IdGenerator   │ ├── 8 Validators    │ export/             │    │
│  │  └── PipelineGraph │ ├── inputValidation │ ├── catalogGen      │    │
│  │      (cycles,      │ └── ValidatorRegistry│ ├── pipelineGen    │    │
│  │       graph ops)   │                      │ ├── nodesGen       │    │
│  │                    │                      │ └── + 4 more       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────── FOUNDATION (Types & Constants) ────────────────────┐    │
│  │                                                                 │    │
│  │  types/ids.ts (branded NodeId, DatasetId, ConnectionId)        │    │
│  │  types/kedro.ts (KedroNode, KedroDataset, KedroConnection)    │    │
│  │  types/redux.ts (state shape definitions)                      │    │
│  │  constants/ (timing, dataset types, storage keys, DnD types)   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Part B: Design Patterns Cheat Sheet

| Pattern | Where used | Why |
|---|---|---|
| **Normalized state** (`byId` + `allIds`) | nodes, datasets, connections slices | O(1) lookups, easy serialization |
| **Branded types** | `NodeId`, `DatasetId`, `ConnectionId` | Prevent mixing ID types at compile time |
| **Strategy pattern** | 8 validators in `utils/validation/validators/` | Each rule is independent, testable, pluggable |
| **Builder pattern** | `KedroProjectBuilder` | Step-by-step ZIP construction with fluent API |
| **Middleware** | autoSave, preferences | Keep reducers pure, manage side effects |
| **Memoized selectors** | `createSelector` in all `*Selectors.ts` files | Prevent unnecessary re-renders |
| **Barrel exports** | `index.ts` in `hooks/`, `infrastructure/` | Clean import paths |
| **`memo()`** | CustomNode, DatasetNode, CustomEdge | Prevent unnecessary re-renders of canvas elements |
| **Hook composition** | PipelineCanvas uses 4 hooks | Split complex behavior into focused, testable hooks |
| **Type guards** | `isNodeId()`, `isDatasetId()` | Runtime type narrowing |

### Part C: Known Issues You'll Inherit

#### P0 -- Must Fix

**1. Missing `__main__.py` in generated project**
- `pyprojectGenerator.ts` generates `[project.scripts]` that references `__main__:main`
- But `KedroProjectBuilder` never generates the `__main__.py` file
- Users can't `pip install -e .` the generated project
- **Fix**: Either generate `__main__.py` in `staticFilesGenerator.ts`, or remove the `[project.scripts]` entry

#### P1 -- Should Fix

**2. `memo()` defeated by array replacement (performance)**
- `useCanvasState.ts` replaces the entire `nodes` and `edges` arrays on every Redux change via `useLayoutEffect`
- This gives every node a new object reference, so `memo()` can't skip re-renders
- With 50+ nodes, dragging one node re-renders ALL nodes
- **Fix**: Documented in ADR-002 -- switch to ReactFlow's "controlled mode" with selective updates

**3. highlight.js CSS loaded from CDN**
- `CodeDisplay.tsx` loads CSS from `cdnjs.cloudflare.com` at runtime
- No SRI hash, version mismatch, fails offline
- **Fix**: Bundle the CSS locally via import

**4. `store.getState()` anti-pattern**
- `useConnectionHandlers.ts` line 153 directly accesses the store
- Bypasses React's subscription model
- **Fix**: Replace with `useAppSelector` or pass data through hook parameters

#### P2 -- Should Add

**5. Zero component tests** -- All 340 tests are for slices, hooks, generators, and validators. No React component is tested.

**6. No multi-tab support** -- If you open the app in two tabs, the last tab to write wins. No conflict detection.

### Part D: The Files You'll Touch Most

| If you need to... | You'll edit... |
|---|---|
| Add a new node/dataset property | `types/kedro.ts`, the relevant slice, ConfigPanel form |
| Add a new validation rule | Create a class in `validators/`, register it in `validators/index.ts` |
| Change how generated code looks | The relevant generator in `infrastructure/export/` |
| Fix a canvas behavior | One of the 10 hooks in `components/Canvas/hooks/` |
| Add a new UI panel | New component in `components/`, wire it in `App.tsx` and `uiSlice.ts` |
| Add a new dataset type | `constants/datasetTypes.ts` and `types/kedro.ts` |
| Change what gets saved | `infrastructure/localStorage/localStorage.ts` and schemas |

### Part E: Development Commands

```bash
npm run dev            # Start the app (localhost:5173)
npm run build          # Build for production (check for errors)
npm run test           # Run all 340 tests
npm run test:coverage  # See what's tested (target: 70%+)
npm run lint           # Check for code issues
```

### Part F: The Three Things to Remember

#### 1. Unidirectional Data Flow
```
User Action → dispatch(action) → Reducer → New State → Component Re-render
```

#### 2. Where to Find Things
- **What the user sees** → `components/`
- **What data looks like** → `features/` (state) and `types/` (shapes)
- **How things are saved/exported** → `infrastructure/`
- **Pure business logic** → `domain/` and `utils/`

#### 3. The App's Purpose in One Sentence
**Kedro Builder turns a visual drag-and-drop diagram into a complete, downloadable Kedro project, with validation to catch errors before they reach the generated code.**

---

## Quick Reference: All 11 Lessons

| # | Lesson | Key Takeaway |
|---|---|---|
| 1 | The Big Picture | 4-layer app: UI → State → Logic → Infrastructure |
| 2 | Folder Structure | 9 folders in `src/`, each with a single responsibility |
| 3 | Tech Stack | React 19, Redux Toolkit, ReactFlow, JSZip. No backend. |
| 4 | State Management | 7 Redux slices, normalized state, actions in/state out |
| 5 | The Canvas | ReactFlow with 3 custom components, 4 handler hooks |
| 6 | Data Flow | Traced a full user action from drag-to-drop through every layer |
| 7 | Code Generation | Builder pattern, 7 generators, pure string interpolation |
| 8 | Validation | Strategy pattern, 8 validators, on-demand execution |
| 9 | Type System | Branded IDs, type guards, domain types as vocabulary |
| 10 | Persistence | Two middlewares, localStorage, Zod validation, startup hook |
| 11 | Owner's Manual | Architecture summary, known issues, practical guide |
