# Kedro Builder

> A visual drag-and-drop pipeline builder for [Kedro](https://github.com/kedro-org/kedro) projects.

## Overview

Kedro Builder lets data teams design Kedro pipelines without touching YAML or Python boilerplate. Build pipelines visually, configure nodes and datasets through guided forms, validate the graph, preview the generated project structure, and export a production-ready Kedro project in seconds.

This is a fully client-side React application — no backend required.

## Features

- **Drag-and-drop canvas** — Powered by ReactFlow with custom Kedro node and dataset components, bulk selection, copy/paste, and live connection validation.
- **Rich configuration forms** — Snake_case enforcement, optional node function code, dataset type presets (75+ types), and a filepath builder that understands Kedro data layers.
- **Guided onboarding** — Five-step tutorial, contextual walkthrough overlays, and empty-state guidance for first-time users.
- **Auto-save** — Persists the active project, onboarding progress, and theme (light/dark) to localStorage with graceful degradation and quota handling.
- **Validation-first export** — Checks for circular dependencies, duplicate/invalid names, orphaned components, and missing configuration before allowing code preview or export.
- **One-click code generation** — Builds a complete Kedro project (`pyproject.toml`, `conf/`, pipeline package, data directories) and downloads it as a ZIP. A built-in code viewer previews every file before export.
- **Error resilience** — React Error Boundaries around critical sections and comprehensive input validation for Python identifiers.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.20.1 or newer
- npm 10 or newer

### Install and run

```bash
git clone https://github.com/kedro-org/kedro-builder.git
cd kedro-builder
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. **Create a project** — The setup modal enforces a valid Kedro-friendly name and optional description.
2. **Drag components** from the palette onto the canvas — function nodes and datasets.
3. **Configure each component** via the right-hand panel; forms validate naming rules, dataset paths, and optional Python functions.
4. **Connect components** — connections are validated on the fly (bipartite graph: nodes connect only to datasets, never directly to each other).
5. **Review validation** — open the validation panel or click View Code; blocking errors must be resolved before export.
6. **Export** — launch the export wizard to confirm metadata, review warnings, and download the generated Kedro project ZIP.

## Tech Stack

| Category | Technology |
|----------|-----------|
| UI | React 19, TypeScript 5 (strict), Vite 5 |
| State | Redux Toolkit (8 normalized slices) |
| Canvas | @xyflow/react (ReactFlow) |
| Forms | react-hook-form, Zod |
| Styling | SCSS with BEM conventions, Radix UI primitives |
| Code gen | JSZip, TypeScript string templates |
| Testing | Vitest, React Testing Library (375 tests, 47 test files) |

## Project Structure

```
src/
├── components/        # React components (Canvas, ConfigPanel, ExportWizard, CodeViewer, UI primitives)
├── features/          # Redux slices (project, nodes, datasets, connections, onboarding, ui, validation, theme, canvas)
├── validation/        # Pipeline validation engine (8 pluggable validators, Strategy pattern)
├── domain/            # Framework-agnostic business logic (ID generation, graph operations)
├── infrastructure/    # External integrations (export generators, localStorage, telemetry)
├── hooks/             # Custom React hooks
├── store/             # Redux store configuration and middleware
├── types/             # TypeScript definitions including branded ID types
├── utils/             # Input validation and utility functions
├── constants/         # Application constants
└── styles/            # Global SCSS styles and theme variables
```

## Development

```bash
npm run dev            # Start dev server with HMR
npm run build          # Production build (tsc -b + Vite)
npm run lint           # ESLint
npm run test           # Run tests (Vitest)
npm run test:ui        # Vitest UI runner
npm run test:coverage  # Coverage report
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, code standards, and PR guidelines.

## Architecture

See [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for detailed architecture documentation, data flow diagrams, and implementation patterns.

## License

This project is maintained by [kedro-org](https://github.com/kedro-org). See the repository for license details.
