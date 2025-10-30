# Kedro Pipeline Builder - Project Architecture & Documentation

> **Last Updated:** October 16, 2025
> **Version:** Phase 4 Complete + Tutorial/Walkthrough System
> **Status:** ✅ Core Builder Complete | 🔄 Polish & Enhancement Phase

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Decisions](#architecture-decisions)
4. [System Architecture](#system-architecture)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Project Structure](#project-structure)
7. [Development Phases](#development-phases)
8. [Current Phase Status](#current-phase-status)
9. [What's Next](#whats-next)
10. [Key Implementation Patterns](#key-implementation-patterns)

---

## 🎯 Project Overview

### Vision
A visual, no-code pipeline builder for Kedro projects that allows data scientists and engineers to design ML pipelines through drag-and-drop interactions, automatically generating production-ready Kedro code.

### Core Features
- **Visual Pipeline Design:** Drag-and-drop nodes and datasets to build pipelines
- **Real-time Visualization:** See your pipeline structure as you build
- **Code Generation:** Automatically generate Kedro-compliant Python code
- **Interactive Onboarding:** Tutorial and walkthrough system for first-time users
- **Theme Support:** Light and dark themes with persistent preferences
- **Export Ready:** Generate complete Kedro project structure

### Target Users
- Data Scientists building ML pipelines
- Data Engineers designing data workflows
- ML Engineers prototyping pipelines
- Teams adopting Kedro framework

---

## 🛠 Technology Stack

### Frontend Framework
```json
{
  "runtime": "React 18.3.1",
  "language": "TypeScript 5.6.2 (strict mode)",
  "bundler": "Vite 5.4.8",
  "nodeVersion": "18.20.1"
}
```

### Core Libraries

#### State Management
- **Redux Toolkit** (`@reduxjs/toolkit: ^2.5.0`)
  - Centralized state for nodes, datasets, connections, UI
  - Normalized data structure with byId/allIds pattern
  - Immer integration for immutable updates

#### Canvas & Flow
- **ReactFlow** (`@xyflow/react: ^12.3.6`)
  - Interactive node-based canvas
  - Custom node types (Function nodes, Dataset nodes)
  - Custom edge rendering with context menus
  - Top/bottom handles for vertical flow

#### UI Components
- **Radix UI** (Dialog, Dropdown, Tooltip)
  - Accessible, unstyled primitives
  - Keyboard navigation built-in
  - ARIA compliant
- **Lucide React** (`^0.469.0`)
  - Icon library for consistent UI
- **Custom Components** (Button, Input, ThemeToggle)

#### Form Management
- **React Hook Form** (`^7.54.2`)
  - Configuration forms for nodes/datasets
  - Validation and error handling
  - Minimal re-renders

#### Styling
- **SCSS** with CSS Modules
- **BEM Naming Convention**
- **CSS Custom Properties** for theming
- **Responsive Design** principles

---

## 🏗 Architecture Decisions

### 1. Node Handle Positioning
**Decision:** Top/Bottom handles (vertical flow)
**Rationale:**
- Kedro pipelines typically flow top-to-bottom (data ingestion → processing → output)
- Vertical layout better utilizes screen space
- Aligns with traditional data flow diagrams

### 2. State Management Strategy
**Decision:** Redux Toolkit with normalized state
**Pattern:** `{ byId: {}, allIds: [] }`
**Rationale:**
- Easy O(1) lookups by ID
- Prevents duplicate data
- Simplifies updates and deletions
- Supports multi-select operations

### 3. Validation Strategy
**Decision:** On-demand validation (button click)
**Not Real-time:** Avoids performance issues during editing
**Rationale:**
- Better UX during rapid prototyping
- Validates before code generation only
- Reduces unnecessary re-renders

### 4. ID Prefixes
**Convention:**
- Nodes: `node-*`
- Datasets: `dataset-*`

**Rationale:**
- Easy type identification without object lookup
- Simplifies routing in event handlers
- Type-safe string literal types

### 5. Connection Management
**Decision:** Inferred from visual connections
**Not Manual Entry:** Users don't manually type input/output names
**Rationale:**
- Visual representation is source of truth
- Prevents manual errors
- Intuitive for non-developers

---

## 🔧 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Header   │  │ Palette  │  │ Canvas   │  │ Config   │   │
│  │ (Nav)    │  │ (Sidebar)│  │ (Main)   │  │ (Panel)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Redux Store (State)                     │
├─────────────────────────────────────────────────────────────┤
│  Nodes    Datasets    Connections    UI    Validation       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Slices    Selectors    Thunks    Utils                     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      External Systems                        │
├─────────────────────────────────────────────────────────────┤
│  localStorage    File System API    Code Generator           │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Header
│   ├── Logo & Project Name (editable)
│   ├── Tutorial Button
│   ├── View Code Button
│   ├── Export Button
│   └── Theme Toggle
├── Main
│   ├── Sidebar (Component Palette)
│   │   ├── Function Node Card
│   │   └── Dataset Card
│   ├── Canvas (ReactFlow)
│   │   ├── Custom Nodes
│   │   ├── Dataset Nodes
│   │   ├── Custom Edges
│   │   ├── Bulk Actions Toolbar
│   │   ├── Edge Context Menu
│   │   └── Empty State
│   └── Config Panel
│       ├── Node Config Form
│       └── Dataset Config Form
└── Modals/Overlays
    ├── Tutorial Modal (5 steps)
    ├── Walkthrough Overlay (4 steps)
    └── Project Setup Modal
```

---

## 📊 Data Flow Diagram

### User Interaction Flow

```
User Action
    ↓
Component Handler
    ↓
Redux Action Dispatch
    ↓
Reducer Updates State
    ↓
Selectors Read State
    ↓
Component Re-renders
    ↓
UI Updates
```

### Example: Adding a Node

```
1. User drags "Function Node" from palette
   ↓
2. PipelineCanvas.handleDrop() catches event
   ↓
3. Dispatches addNode({ type, position })
   ↓
4. nodesSlice reducer creates node with ID
   ↓
5. ReactFlow syncs with Redux state
   ↓
6. Node appears on canvas
   ↓
7. User clicks node → openConfigPanel()
   ↓
8. ConfigPanel renders NodeConfigForm
   ↓
9. User edits → form submits → updateNode()
   ↓
10. State updates → Node re-renders
```

### Example: Creating Connection

```
1. User drags from output handle to input handle
   ↓
2. ReactFlow.onConnect() fires
   ↓
3. PipelineCanvas validates connection
   ↓
4. Dispatches addConnection({ source, target })
   ↓
5. connectionsSlice creates edge
   ↓
6. Updates node.inputs and node.outputs arrays
   ↓
7. Edge appears on canvas
   ↓
8. Right-click edge → Edge Context Menu
   ↓
9. Delete → dispatches deleteConnection()
```

---

## 📁 Project Structure

```
kedro-builder/
├── public/                          # Static assets
├── src/
│   ├── components/
│   │   ├── App/                     # Main layout
│   │   │   ├── App.tsx             # Root component
│   │   │   └── App.scss            # Global styles
│   │   ├── Canvas/
│   │   │   ├── PipelineCanvas.tsx   # ReactFlow wrapper
│   │   │   ├── PipelineCanvas.scss
│   │   │   ├── CustomNode/          # Function node component
│   │   │   ├── DatasetNode/         # Dataset node component
│   │   │   ├── CustomEdge/          # Edge with custom styles
│   │   │   ├── EmptyState/          # Welcome screen + drag feedback
│   │   │   ├── BulkActionsToolbar/  # Multi-select actions
│   │   │   └── EdgeContextMenu/     # Right-click menu
│   │   ├── Palette/
│   │   │   ├── ComponentPalette.tsx # Sidebar with draggables
│   │   │   ├── NodeCard/            # Draggable node card
│   │   │   └── DatasetCard/         # Draggable dataset card
│   │   ├── ConfigPanel/
│   │   │   ├── ConfigPanel.tsx      # Panel container
│   │   │   ├── NodeConfigForm/      # Node configuration
│   │   │   └── DatasetConfigForm/   # Dataset configuration
│   │   ├── Tutorial/
│   │   │   ├── TutorialModal.tsx    # 5-step educational modal
│   │   │   └── tutorialContent.ts   # Tutorial step definitions
│   │   ├── Walkthrough/
│   │   │   ├── WalkthroughOverlay.tsx  # 4-step interactive tour
│   │   │   ├── WalkthroughOverlay.scss
│   │   │   └── walkthroughContent.ts
│   │   ├── ProjectSetup/
│   │   │   ├── ProjectSetupModal.tsx   # Project creation form
│   │   │   └── ProjectSetupModal.scss
│   │   └── UI/                      # Reusable UI components
│   │       ├── Button/
│   │       ├── Input/
│   │       └── ThemeToggle/
│   ├── features/                    # Redux slices
│   │   ├── nodes/
│   │   │   └── nodesSlice.ts
│   │   ├── datasets/
│   │   │   └── datasetsSlice.ts
│   │   ├── connections/
│   │   │   └── connectionsSlice.ts
│   │   ├── project/
│   │   │   └── projectSlice.ts
│   │   ├── ui/
│   │   │   └── uiSlice.ts
│   │   ├── validation/
│   │   │   └── validationSlice.ts
│   │   └── theme/
│   │       └── themeSlice.ts
│   ├── store/
│   │   ├── index.ts                 # Store configuration
│   │   └── hooks.ts                 # Typed hooks
│   ├── types/
│   │   ├── kedro.ts                 # Kedro domain types
│   │   └── redux.ts                 # Redux state types
│   ├── styles/
│   │   ├── _variables.scss          # SCSS variables
│   │   ├── _mixins.scss             # SCSS mixins
│   │   └── global.scss              # Global styles
│   ├── utils/                       # Helper functions
│   ├── App.tsx                      # App entry point
│   └── main.tsx                     # Vite entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── ESSENTIAL_CONTEXT_UPDATED.md     # Quick reference
└── PROJECT_ARCHITECTURE.md          # This file
```

---

## 🚀 Development Phases

### Phase 1: Foundation & Layout ✅ COMPLETE
**Goal:** Set up basic layout and project structure

**Completed:**
- ✅ Project initialization with Vite + React + TypeScript
- ✅ Redux Toolkit store setup
- ✅ Basic layout (Header, Sidebar, Canvas)
- ✅ SCSS with BEM naming
- ✅ Theme system (light/dark)
- ✅ Component Palette with draggable cards

**Key Deliverables:**
- Working development environment
- Basic UI layout
- Theme toggle functionality

---

### Phase 2: Core Canvas Functionality ✅ COMPLETE
**Goal:** Implement drag-and-drop and node management

**Completed:**
- ✅ ReactFlow integration
- ✅ Custom node types (Function, Dataset)
- ✅ Drag-and-drop from sidebar to canvas
- ✅ Node positioning and movement
- ✅ Top/bottom handles for connections
- ✅ Edge creation between nodes
- ✅ Custom edge styling

**Key Deliverables:**
- Interactive canvas
- Visual pipeline creation
- Node-to-node connections

---

### Phase 3: Configuration & Editing ✅ COMPLETE
**Goal:** Enable node/dataset configuration

**Completed:**
- ✅ Configuration panel (slides in from right)
- ✅ Node configuration form (name, description, code)
- ✅ Dataset configuration form (name, type, filepath, layer)
- ✅ React Hook Form integration
- ✅ Form validation
- ✅ Real-time updates to canvas

**Key Deliverables:**
- Editable node properties
- Dataset configuration
- Form validation

---

### Phase 4: Advanced Interactions ✅ COMPLETE
**Goal:** Multi-select, bulk actions, keyboard shortcuts

**Completed:**
- ✅ Multi-select (Cmd/Ctrl + Click, Box selection)
- ✅ Bulk Actions Toolbar
- ✅ Delete key functionality
- ✅ Escape key (deselect all)
- ✅ Cmd/Ctrl + A (select all)
- ✅ Edge context menu (right-click)
- ✅ Edge deletion from context menu

**Key Deliverables:**
- Multi-select support
- Keyboard shortcuts
- Context menus
- Bulk operations

---

### Phase 4.5: UX Enhancement ✅ COMPLETE
**Goal:** Improve first-time user experience

**Completed:**
- ✅ Tutorial Modal (5 steps)
  - Welcome to Kedro concepts
  - Datasets explanation
  - Function nodes explanation
  - Connections explanation
  - Code generation overview
- ✅ Walkthrough System (4 steps)
  - Interactive tour with spotlight circles
  - Points to actual UI elements
  - Smooth transitions
- ✅ Empty State Component
  - Welcome message
  - Quick action buttons
  - Drag-and-drop visual feedback
- ✅ Project Setup Modal
  - Project name input
  - Directory selection (File System Access API)
- ✅ Editable Project Name in Header
- ✅ localStorage Persistence
  - Tutorial completion
  - Walkthrough completion
  - Project name and directory

**Key Deliverables:**
- Onboarding experience
- Interactive tutorial
- Project creation flow
- Empty state guidance

---

### Phase 5: Validation System 🔄 IN PROGRESS
**Goal:** Real-time pipeline validation

**To Implement:**
- [ ] Circular dependency detection
- [ ] Orphaned nodes detection
- [ ] Type compatibility checking
- [ ] Missing input/output warnings
- [ ] Validation panel with error/warning lists
- [ ] Visual indicators on canvas (red borders, etc.)

**Expected Deliverables:**
- Validation engine
- Error/warning display
- Visual feedback on canvas

---

### Phase 6: Code Generation & Preview 📋 PLANNED
**Goal:** Generate Kedro-compliant code

**To Implement:**
- [ ] Handlebars templates for:
  - `catalog.yml`
  - `nodes.py`
  - `pipeline.py`
  - `__init__.py`
- [ ] Syntax-highlighted code preview panel
- [ ] Live updates as pipeline changes
- [ ] Copy-to-clipboard buttons
- [ ] Code formatting

**Expected Deliverables:**
- Code preview panel
- Generated Kedro code
- Copy/download functionality

---

### Phase 7: Project Export 📦 PLANNED
**Goal:** Export complete Kedro project

**To Implement:**
- [ ] JSZip integration
- [ ] Full Kedro project structure generation:
  - `conf/` (base, local)
  - `src/` (nodes, pipelines)
  - `data/` (data layers)
  - `docs/`
  - `pyproject.toml`
  - `requirements.txt`
- [ ] ZIP download
- [ ] Export button functionality

**Expected Deliverables:**
- Downloadable ZIP file
- Complete Kedro project structure
- Ready-to-run project

---

### Phase 8: Persistence & Storage 💾 PLANNED
**Goal:** Save and load projects

**To Implement:**
- [ ] localStorage autosave (every 30s)
- [ ] Save/Load project JSON
- [ ] Import from JSON
- [ ] Project list management
- [ ] Recent projects
- [ ] Delete project

**Expected Deliverables:**
- Autosave functionality
- Project management
- Import/Export JSON

---

### Phase 9: Template Library 📚 PLANNED
**Goal:** Pre-built pipeline templates

**To Implement:**
- [ ] Template gallery
- [ ] Pre-built pipeline templates:
  - Data ingestion pipeline
  - ML training pipeline
  - ETL pipeline
  - Feature engineering pipeline
- [ ] Template preview
- [ ] Load template into canvas

**Expected Deliverables:**
- Template library UI
- Pre-built templates
- Template loading

---

### Phase 10: Advanced Features 🎨 PLANNED
**Goal:** Polish and advanced functionality

**To Implement:**
- [ ] Undo/Redo (Redux middleware)
- [ ] Canvas zoom controls
- [ ] Mini-map navigation
- [ ] Search/filter nodes
- [ ] Pipeline analytics (node count, complexity)
- [ ] Export as image (PNG/SVG)
- [ ] Keyboard shortcuts panel

**Expected Deliverables:**
- Undo/redo functionality
- Enhanced navigation
- Search capabilities

---

### Phase 11: Deployment 🚀 PLANNED
**Goal:** Production deployment

**To Implement:**
- [ ] Production build optimization
- [ ] GitHub Pages deployment
- [ ] Documentation site
- [ ] User guide
- [ ] Demo videos
- [ ] GitHub README

**Expected Deliverables:**
- Live demo site
- Documentation
- User guide

---

## 📍 Current Phase Status

### What We Have Now

```
✅ Phase 1: Foundation & Layout        [████████████] 100%
✅ Phase 2: Core Canvas Functionality  [████████████] 100%
✅ Phase 3: Configuration & Editing    [████████████] 100%
✅ Phase 4: Advanced Interactions      [████████████] 100%
✅ Phase 4.5: UX Enhancement           [████████████] 100%
🔄 Phase 5: Validation System          [░░░░░░░░░░░░]   0%
📋 Phase 6: Code Generation            [░░░░░░░░░░░░]   0%
📦 Phase 7: Project Export             [░░░░░░░░░░░░]   0%
💾 Phase 8: Persistence & Storage      [░░░░░░░░░░░░]   0%
📚 Phase 9: Template Library           [░░░░░░░░░░░░]   0%
🎨 Phase 10: Advanced Features         [░░░░░░░░░░░░]   0%
🚀 Phase 11: Deployment                [░░░░░░░░░░░░]   0%
```

### Current Capabilities

**✅ Users Can:**
- Create visual pipelines with drag-and-drop
- Add function nodes and datasets
- Connect nodes with edges
- Configure node properties
- Multi-select and bulk delete
- Use keyboard shortcuts
- Follow guided tutorial
- Create projects with setup wizard
- Switch between light/dark themes
- Edit project name

**❌ Users Cannot Yet:**
- Validate pipeline for errors
- Generate Kedro code
- Export project as ZIP
- Save/load projects
- Use pre-built templates
- Undo/redo actions

---

## 🔮 What's Next

### Immediate Next Steps (Phase 5)

**Priority 1: Validation Engine**
1. Implement graph traversal for circular dependency detection
2. Check for orphaned nodes (no inputs or outputs)
3. Validate connection types (CSV → Node → Parquet)
4. Create validation panel component
5. Add visual indicators on canvas

**Priority 2: Validation UI**
1. Design validation panel (bottom drawer or side panel)
2. Error list with severity (error, warning, info)
3. Click error → highlight node on canvas
4. Fix button for auto-fixable issues

### Future Roadmap (Phases 6-11)

**Short-term (Next 2-3 weeks):**
- Phase 6: Code Generation & Preview
- Phase 7: Project Export (ZIP download)

**Mid-term (1-2 months):**
- Phase 8: Persistence & Storage
- Phase 9: Template Library

**Long-term (2-3 months):**
- Phase 10: Advanced Features
- Phase 11: Deployment & Documentation

---

## 🔑 Key Implementation Patterns

### Pattern 1: Redux Action Dispatch
```typescript
// Adding a node
const handleDrop = (event: DragEvent) => {
  const nodeType = event.dataTransfer.getData('application/kedro-builder');
  const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

  dispatch(addNode({ type: nodeType, position }));
};
```

### Pattern 2: Normalized State Updates
```typescript
// nodesSlice.ts
addNode: (state, action) => {
  const id = `node-${Date.now()}`;
  state.byId[id] = { id, ...action.payload };
  state.allIds.push(id);
}
```

### Pattern 3: ReactFlow Sync
```typescript
// Convert Redux state to ReactFlow format
const nodes = allIds.map(id => ({
  id,
  type: 'customNode',
  data: byId[id],
  position: byId[id].position
}));
```

### Pattern 4: Multi-select Handling
```typescript
// Check ID prefix to determine action
selectedIds.forEach(id => {
  if (id.startsWith('node-')) {
    dispatch(deleteNodes([id]));
  } else if (id.startsWith('dataset-')) {
    dispatch(deleteDataset(id));
  }
});
```

### Pattern 5: Theme Management
```typescript
// CSS custom properties
document.documentElement.className = `kedro-builder kui-theme--${theme}`;

// SCSS variables
.app {
  background: var(--color-bg-1);
  color: var(--color-text);
}
```

### Pattern 6: localStorage Persistence
```typescript
// Save tutorial completion
localStorage.setItem('kedro_builder_tutorial_completed', 'true');

// Load on mount
useEffect(() => {
  const completed = localStorage.getItem('kedro_builder_tutorial_completed');
  if (!completed) {
    dispatch(openTutorial());
  }
}, []);
```

---

## 📊 Performance Considerations

### Current Optimizations
- React.memo() on expensive components
- useCallback() for event handlers
- useMemo() for computed values
- Normalized Redux state (O(1) lookups)
- CSS transitions instead of JS animations

### Future Optimizations (if needed)
- Virtual scrolling for large node lists
- Canvas viewport culling (only render visible nodes)
- Web Workers for validation
- IndexedDB for large projects
- Code splitting for modals

---

## 🧪 Testing Strategy

### Current Testing
- Manual testing during development
- Browser testing (Chrome, Firefox, Safari)
- Theme testing (light/dark)
- Responsive testing (desktop, tablet)

### Future Testing (Recommended)
- Unit tests: Redux slices, utilities
- Integration tests: User flows
- E2E tests: Cypress/Playwright
- Accessibility testing: WAVE, axe
- Performance testing: Lighthouse

---

## 📝 Documentation Status

### Existing Documentation
- ✅ ESSENTIAL_CONTEXT_UPDATED.md (quick reference)
- ✅ PROJECT_ARCHITECTURE.md (this file)
- ✅ Inline code comments
- ✅ TypeScript types (self-documenting)

### Missing Documentation (TODO)
- [ ] User guide / tutorial
- [ ] API documentation
- [ ] Contributing guide
- [ ] Deployment guide
- [ ] Architecture decision records (ADRs)

---

## 🤝 Contributing Guidelines (Future)

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- BEM naming for CSS
- Functional components + hooks
- Redux Toolkit patterns

### Git Workflow
- Feature branches
- Descriptive commit messages
- Pull request reviews
- Conventional commits

---

## 📞 Support & Resources

### Key Files for Reference
- `ESSENTIAL_CONTEXT_UPDATED.md` - Quick context for development
- `PROJECT_ARCHITECTURE.md` - This comprehensive guide
- `src/types/kedro.ts` - Core type definitions
- `src/types/redux.ts` - Redux state types

### External Resources
- Kedro Documentation: https://docs.kedro.org
- ReactFlow Documentation: https://reactflow.dev
- Redux Toolkit: https://redux-toolkit.js.org

---

## 🎓 Learning Resources

### For New Developers
1. Start with `ESSENTIAL_CONTEXT_UPDATED.md`
2. Review Redux store structure
3. Understand ReactFlow basics
4. Read key implementation patterns (this doc)
5. Explore component hierarchy

### Key Concepts to Understand
- Redux normalized state pattern
- ReactFlow node/edge system
- Event bubbling in React
- CSS custom properties for theming
- TypeScript discriminated unions

---

**End of Documentation**

*This document will be updated as the project evolves. Last updated: October 16, 2025*
