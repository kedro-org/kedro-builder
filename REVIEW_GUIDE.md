# Kedro Builder — Code Review Guide

This guide provides a structured, progressive review of the Kedro Builder codebase. It is designed so that reviewers build understanding layer by layer — never seeing code that references concepts from a phase they haven't reviewed yet.

**Estimated total review time:** ~20 hours across 14 phases.

---

## What is Kedro Builder?

Kedro Builder is a visual, drag-and-drop web application that enables data teams to design production-ready Kedro pipelines without writing YAML or Python boilerplate. It is a fully client-side React SPA — no backend required.

**Key capabilities:**
- Design pipelines visually using an interactive canvas (powered by ReactFlow)
- Configure nodes and datasets through guided forms with validation
- Validate graphs for circular dependencies, missing config, orphaned components
- Preview generated Kedro project code before export
- Download a complete, production-ready Kedro project as a ZIP file

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **UI Framework** | React 19 with TypeScript (strict mode) |
| **State Management** | Redux Toolkit (slices pattern) |
| **Canvas/Graph** | @xyflow/react (ReactFlow) |
| **Build Tool** | Vite 5 |
| **Styling** | SCSS with BEM conventions + CSS Custom Properties |
| **Schema Validation** | Zod (runtime) |
| **Syntax Highlighting** | highlight.js (locally bundled CSS) |
| **Code Generation** | JSZip + TypeScript string templates |
| **Testing** | Vitest + Testing Library |
| **Analytics** | Heap Analytics (opt-out) |

---

## Current Metrics

| Metric | Value |
|--------|-------|
| Source files | ~147 |
| Lines of code | ~12.7K |
| Test files | 18 |
| Tests | 340 (100% passing) |
| Coverage | ~64% |
| Bundle size | ~257 KB gzipped |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        KEDRO BUILDER                            │
│                  Visual Pipeline Designer (SPA)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐   ┌──────────────┐   ┌────────────────────┐     │
│   │  Palette  │──▶│    Canvas    │──▶│   Config Panel     │     │
│   │ (drag)    │   │  (ReactFlow) │   │  (forms)           │     │
│   └──────────┘   └──────┬───────┘   └─────────┬──────────┘     │
│                          │                     │                │
│                    ┌─────▼─────────────────────▼──────┐         │
│                    │        Redux Store               │         │
│                    │  ┌───────┐ ┌────────┐ ┌───────┐  │         │
│                    │  │ nodes │ │datasets│ │ conns  │  │         │
│                    │  └───────┘ └────────┘ └───────┘  │         │
│                    │  ┌───────┐ ┌────────┐ ┌───────┐  │         │
│                    │  │project│ │   ui   │ │ theme  │  │         │
│                    │  └───────┘ └────────┘ └───────┘  │         │
│                    │  ┌────────────┐                   │         │
│                    │  │ validation │                   │         │
│                    │  └────────────┘                   │         │
│                    └──────────┬───────────────────────┘         │
│                               │                                 │
│              ┌────────────────┼────────────────┐                │
│              ▼                ▼                ▼                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │ localStorage │  │  Validation  │  │ Code Gen &   │         │
│   │ (auto-save)  │  │  Engine      │  │ Export (ZIP) │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Domain Layer: ID Generation, Graph Algorithms, Type System     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: How a Node Gets Added

```
User drags from Palette ──▶ Drop on Canvas ──▶ dispatch(addNode)
    ──▶ nodesSlice reducer (generates ID via crypto.randomUUID())
    ──▶ autoSaveMiddleware (debounced 500ms → localStorage)
    ──▶ canvasSelectors transform Redux → ReactFlow format
    ──▶ ReactFlow renders CustomNode on canvas
    ──▶ ConfigPanel opens for the new node
```

---

## Key Architectural Patterns

| Pattern | Where Used | Why |
|---------|-----------|-----|
| **Normalized State** (`byId` + `allIds`) | All entity slices | O(1) lookups, efficient serialization |
| **Branded ID Types** | `types/ids.ts` | Compile-time safety: `NodeId` ≠ `DatasetId` |
| **Builder Pattern** | `KedroProjectBuilder` | Fluent API for customizable project generation |
| **Strategy Pattern** | 8 Validation validators | Pluggable, extensible validation rules |
| **Bipartite Graph** | Canvas connections | Nodes connect only to Datasets, never to each other |
| **Auto-save Middleware** | Redux middleware | Debounced persistence without UI blocking |
| **Set-based Selectors** | `canvasSelectors.ts` | O(1) membership checks in hot render paths |

---

## Directory Structure

```
src/
├── types/              # TypeScript type definitions (Phase 1)
├── constants/          # Application constants (Phase 2)
├── domain/             # Pure business logic - no framework deps (Phase 3)
├── store/              # Redux store configuration (Phase 4)
├── features/           # Redux slices - 7 feature modules (Phase 4)
│   ├── project/        │   ├── nodes/
│   ├── datasets/       │   ├── connections/
│   ├── ui/             │   ├── validation/
│   ├── theme/          │   └── canvas/ (selectors only)
├── infrastructure/     # External integrations (Phases 5 & 11)
│   ├── localStorage/   # Persistence with Zod validation
│   ├── telemetry/      # Heap Analytics with PII blocking
│   └── export/         # Kedro project code generation (13 files)
├── utils/              # Utilities & validation engine (Phases 6-7)
│   └── validation/     # 8 pluggable validators + ValidatorRegistry
├── hooks/              # App-level React hooks (Phase 7)
├── components/         # React UI components (Phases 8-12)
│   ├── App/            # Root app shell
│   ├── Canvas/         # Visual pipeline canvas (29 files)
│   ├── ConfigPanel/    # Node/Dataset configuration forms
│   ├── Palette/        # Draggable component palette
│   ├── ExportWizard/   # Multi-step export dialog
│   ├── CodeViewer/     # Generated code preview (local highlight.js)
│   ├── ValidationPanel/# Error/warning display
│   ├── UI/             # Reusable primitives (Button, Input, etc.)
│   └── [modals...]     # Tutorial, Walkthrough, Settings, etc.
├── styles/             # Global SCSS (Phase 8)
├── test/               # Test infrastructure (Phase 13)
└── main.tsx            # Entry point
```

---

## Review Phases

Each phase has a corresponding GitHub Issue with the exact files to review, focus areas, and a completion checklist.

### [Phase 0: Prerequisites (Self-Study)](https://github.com/kedro-org/kedro-builder/issues/21)
Bridge knowledge gaps on Redux Toolkit, ReactFlow, and TypeScript branded types.

### [Phase 1: Type System Foundation](https://github.com/kedro-org/kedro-builder/issues/22) (6 files, ~45 min)
Learn the vocabulary: `NodeId`, `DatasetId`, `KedroNode`, `KedroDataset`, `RootState`.

### [Phase 2: Constants & Configuration](https://github.com/kedro-org/kedro-builder/issues/23) (8 files, ~1 hour)
All magic values: canvas defaults, storage keys, dataset types, timing constants.

### [Phase 3: Domain Layer](https://github.com/kedro-org/kedro-builder/issues/24) (4 files, ~1 hour)
Pure business logic + tests: ID generation (`crypto.randomUUID()`), graph cycle detection, orphan detection.

### [Phase 4: Redux Store & Slices](https://github.com/kedro-org/kedro-builder/issues/25) (20 files, ~2 hours)
State management + tests: 7 feature slices, normalized state, auto-save middleware, selectors.

### [Phase 5: Persistence & Telemetry](https://github.com/kedro-org/kedro-builder/issues/26) (5 files, ~1 hour)
External integrations: localStorage with Zod validation, Heap Analytics with PII blocking.

### [Phase 6: Validation Engine](https://github.com/kedro-org/kedro-builder/issues/27) (16 files, ~1.5 hours)
Pipeline validation + tests: 8 pluggable validators (4 errors, 4 warnings), ValidatorRegistry.

### [Phase 7: Utilities & Hooks](https://github.com/kedro-org/kedro-builder/issues/28) (10 files, ~1 hour)
Shared utilities, app-level hooks + tests: filepath, fileTree, logger, telemetry, selections.

### [Phase 8: UI Primitives & Styling](https://github.com/kedro-org/kedro-builder/issues/29) (18 files, ~1.5 hours)
Design tokens, theme system, reusable components (Button, Input, ErrorBoundary, etc.).

### [Phase 9: Sidebar Components](https://github.com/kedro-org/kedro-builder/issues/30) (14 files, ~1.5 hours)
Component Palette (drag source) and Config Panel (node/dataset forms).

### [Phase 10: Canvas System](https://github.com/kedro-org/kedro-builder/issues/31) (29 files, ~2.5 hours)
The heart: ReactFlow integration, custom nodes/edges, 9 canvas hooks.

### [Phase 11: Code Generation & Export](https://github.com/kedro-org/kedro-builder/issues/32) (19 files, ~2 hours)
The crown jewel + tests: Builder pattern generating complete Kedro project ZIPs.

### [Phase 12: App Shell & Features](https://github.com/kedro-org/kedro-builder/issues/33) (27 files, ~2 hours)
How everything connects: initialization flow, modals, tutorial, walkthrough.

### [Phase 13: Test Infrastructure & Coverage](https://github.com/kedro-org/kedro-builder/issues/34) (7 files, ~1 hour)
Test setup, mock utilities, contract tests, and coverage gap assessment.

---

## How to Review

1. Read this guide first (architecture + data flow)
2. Complete Phase 0 (self-study on unfamiliar tech)
3. Work through phases 1-13 in order, following each GitHub Issue
4. Check the file list checkboxes as you go
5. Comment on the GitHub Issue with questions, concerns, or improvement suggestions
6. All code change requests will be collected into a single follow-up PR

---

## Getting Started Locally

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run test         # Run all 340 tests
npm run test:ui      # Vitest UI dashboard
npm run test:coverage # Coverage report
npm run lint         # ESLint check
```
