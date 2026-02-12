# Kedro Builder
**Visual Pipeline Builder for Kedro Projects**

Kedro Builder lets data teams design Kedro pipelines without touching YAML or Python boilerplate. Build pipelines visually, configure nodes and datasets through guided forms, validate the graph, preview the generated project structure, and export a production-ready Kedro project in seconds.

## Highlights
- 🎨 **Drag-and-drop canvas** powered by ReactFlow with custom Kedro node and dataset components, bulk selection, and connection validation.
- 🧩 **Rich configuration forms** for nodes and datasets (react-hook-form) with snake_case enforcement, optional node function code, dataset type presets, and a filepath builder that understands Kedro data layers.
- 🧭 **Guided onboarding** including a five-step tutorial, contextual walkthrough overlays, and empty-state guidance to help first-time users create their first project.
- 🛟 **Auto-save & preferences** persist the active project, tutorial progress, and theme (light/dark) in localStorage with graceful degradation and quota handling.
- 🛠 **Validation-first export** checks for circular dependencies, duplicate/invalid names, orphaned components, and missing configuration before allowing code preview or export.
- 📦 **One-click code generation** builds a complete Kedro project (pyproject, `conf/`, pipeline package, data directories) and downloads it as a ZIP. A built-in code viewer previews every file before export.
- 🛡️ **Error resilience** with React Error Boundaries around critical sections and comprehensive input validation for Python identifiers.

## Quick Start
### Prerequisites
- Node.js 18.20.1 or newer
- npm 10 or newer

### Install & Run
```bash
npm install
npm run dev
```
Visit http://localhost:5173/ to open the app.

## Usage Flow
1. **Create a project** – The setup modal enforces a valid Kedro-friendly name and optional description.
2. **Drag datasets and function nodes** from the component palette onto the canvas (dragging is gated until a project exists).
3. **Configure each component** via the right-hand panel; forms validate naming rules, dataset paths, and optional node Python functions.
4. **Connect components** – connections are validated on the fly and drive the downstream code generation.
5. **Review validation results** – open the validation panel or View Code button; blocking errors must be resolved before code preview/export.
6. **Export** – launch the export wizard to confirm metadata, see warnings, and download the generated Kedro project ZIP.

## Generated Project Contents
The export pipeline (JSZip + TypeScript string templates) emits:
- `pyproject.toml` (Kedro CLI + dependencies) and project `README.md`
- `conf/base/` catalog, logging, parameters plus `conf/local/credentials.yml`
- `src/<python_package>/` with `settings.py`, `pipeline_registry.py`, pipeline package (`__init__.py`, `nodes.py`, `pipeline.py`)
- `data/01_raw` through `data/08_reporting` and `logs/` populated with `.gitkeep`
- `.gitignore` and package `__init__.py` scaffolding

## Validation Rules
Before code preview/export the app checks for:
- Circular dependencies across node→dataset→node chains
- Duplicate, empty, or invalid (non-snake_case) node/dataset names
- Orphaned nodes/datasets with no connections
- Missing node function definitions or dataset configuration where required
Issues are surfaced in the validation panel with actionable messages and severity (error vs warning).

## State & Onboarding
- The `autoSaveMiddleware` debounces writes of the entire project graph to localStorage.
- Tutorial/walkthrough completion flags and the selected theme are persisted, ensuring returning users skip onboarding screens and resume their preferred theme.
- Resetting a project clears Redux state and storage for a clean slate.

## Tech Stack
- React 19 + TypeScript 5 (strict mode), bundled with Vite 5
- Redux Toolkit for normalized graph state (7 slices, byId/allIds pattern)
- @xyflow/react 12.8+ for the canvas, custom node/edge renderers, and bulk actions overlay
- Radix UI primitives + SCSS with BEM conventions for accessible, themeable UI
- JSZip for Kedro project ZIP generation (string templates, no YAML library)
- 8 pluggable validators (Strategy pattern) for pipeline validation
- Vitest + React Testing Library (340 tests, 64%+ coverage)
- react-hot-toast for feedback, react-hook-form for config panels

## Project Layout
```
src/
├── domain/           # Framework-agnostic business logic (ID generation, graph operations)
├── infrastructure/   # External service integrations
│   ├── export/       # Kedro project generators and tests
│   ├── localStorage/ # Persistence layer with validation
│   └── telemetry/    # Analytics tracking (Heap)
├── features/         # Redux slices (project, nodes, datasets, connections, validation, theme, ui, canvas)
├── components/       # React components (Canvas, ConfigPanel, ExportWizard, CodeViewer, UI primitives)
├── hooks/            # Custom React hooks (useConfirmDialog, useClearSelections, etc.)
├── store/            # Redux store configuration and middleware
├── types/            # TypeScript definitions including branded ID types
├── utils/            # Validation rules and utility functions
├── styles/           # Global SCSS styles and theme variables
└── constants/        # Application constants
```
See [ADR-001](./ADR-001-target-architecture.md) and [ADR-002](./ADR-002-reactflow-patterns.md) for architecture decisions.

## Development Scripts
```bash
npm run dev            # Start dev server with HMR
npm run build          # Production build (tsc -b + Vite)
npm run preview        # Preview the production build
npm run lint           # ESLint (TypeScript + React rules)
npm run test           # Vitest in watchless mode
npm run test:ui        # Vitest UI runner
npm run test:coverage  # Coverage report (target: 70%+)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, code standards, and PR guidelines.

---
Built with AI assistance.
