# Kedro Builder – Architecture & Technical Notes

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Key Architecture Decisions](#key-architecture-decisions)
4. [Architecture Overview](#architecture-overview)
5. [User Flow Diagram](#user-flow-diagram)
6. [Data Flow Diagram](#data-flow-diagram)
7. [Code Generation Flow](#code-generation-flow)
8. [State Management & Data Flow](#state-management--data-flow)
9. [Validation & Export Implementation](#validation--export-implementation)
10. [Project Structure](#project-structure)
11. [Implementation Patterns](#implementation-patterns)
12. [Testing Strategy](#testing-strategy)

---

## Project Overview

Enable Kedro newcomers and data practitioners to build production-ready pipelines without writing boilerplate. Kedro Builder turns drag-and-drop diagrams into validated Kedro projects that can be inspected, downloaded, and run immediately.

---

## Technology Stack

| Layer | Tools & Versions | Notes |
| --- | --- | --- |
| Runtime | React `19.1.1`, TypeScript `~5.9.3`, Vite `5.4.8` | Strict TS, fast dev feedback |
| State | Redux Toolkit `^2.9.0`, React-Redux | Normalized graph slices + UI slices |
| Canvas | `@xyflow/react` (ReactFlow) `^12.8.6` | Custom nodes, edges, selection tooling |
| UI | Radix UI primitives, Lucide icons, SCSS modules | BEM-style modules with theme variables |
| Forms | React Hook Form `^7.65.0` | Efficient form state for config panels |
| Export | JSZip `^3.10.1`, YAML/Handlebars-free TS templates | Pure TypeScript string templates; downloads via browser APIs |
| Feedback | react-hot-toast | Validation/export notifications |
| Testing | Vitest `^4.0.5`, Testing Library | Slice + generator unit tests |

Node.js `18.20.1` and npm `10+` are recommended for parity with local dev scripts.

---

## Key Architecture Decisions

1. **Normalized Redux Store**  
   Nodes, datasets, and connections follow the `{ byId, allIds }` pattern. This keeps lookups O(1), simplifies serialization, and reduces ReactFlow reconciliation cost.

2. **ID Prefix Strategy**  
   Generated IDs use `node-*`, `dataset-*`, and `connection-*`. Components infer entity type without extra metadata which streamlines selection, deletion, and validation.

3. **On-Demand Validation**  
   Validation runs when users open the code viewer/export wizard or when config changes during an export session. This avoids noisy real-time errors while keeping the export flow safe.

4. **Auto-Save Middleware**  
   A bespoke Redux middleware debounces write operations to localStorage, ensuring persistence without blocking the UI or spamming storage APIs.

5. **Template-Free Code Generation**  
   Instead of external template engines, TypeScript modules compose Kedro files directly. This keeps generation deterministic, typed, and testable.

6. **Guided Onboarding as Gatekeeping**  
   Canvas interactions stay disabled until a project exists; tutorial/walkthrough completion is persisted to avoid re-onboarding experienced users.



## Architecture Overview

```mermaid
graph TB
    subgraph UI["🎨 Frontend Layer"]
        Canvas[Visual Canvas]
        Palette[Component Palette]
        ConfigPanel[Config Panel]
        ExportWizard[Export Wizard]
    end

    subgraph State["⚡ State Management"]
        Redux[Redux Store]
        Nodes[Nodes State]
        Datasets[Datasets State]
        Connections[Connections State]
    end

    subgraph Logic["🛠️ Business Logic"]
        Validation[Validation Engine]
        CodeGen[Code Generators]
        Storage[localStorage]
    end

    subgraph Output["📥 Output"]
        Preview[Code Preview]
        ZIP[ZIP Download]
    end

    %% User interactions
    Palette --> Canvas
    Canvas --> Redux
    ConfigPanel --> Redux
    
    %% State management
    Redux --> Nodes
    Redux --> Datasets
    Redux --> Connections
    Redux --> Storage
    
    %% Export flow
    ExportWizard --> Validation
    Validation --> CodeGen
    CodeGen --> Preview
    CodeGen --> ZIP
    
    %% Data flow
    Redux --> Validation
    Redux --> CodeGen

    style UI fill:#e3f2fd
    style State fill:#fff3e0
    style Logic fill:#e8f5e9
    style Output fill:#fce4ec
```

---

## User Flow Diagram

```mermaid
flowchart TD
    Start([User Opens App]) --> Tutorial{First Time User?}
    
    Tutorial -->|Yes| TutorialMode[Interactive Tutorial]
    Tutorial -->|No| Canvas[Visual Canvas]
    
    TutorialMode --> Canvas
    
    Canvas --> DragDrop[Drag & Drop Components]
    
    DragDrop --> AddNode[Add Node to Canvas]
    DragDrop --> AddDataset[Add Dataset to Canvas]
    
    AddNode --> AutoConfig1[Auto-open Config Panel]
    AddDataset --> AutoConfig2[Auto-open Config Panel]
    
    AutoConfig1 --> ConfigNode[Configure Node Properties]
    AutoConfig2 --> ConfigDataset[Configure Dataset Properties]
    
    ConfigNode --> Connect[Connect Nodes & Datasets]
    ConfigDataset --> Connect
    
    Connect --> Validate{Validation Check}
    
    Validate -->|Invalid| ShowErrors[Show Validation Errors]
    ShowErrors --> FixErrors[Fix Errors]
    FixErrors --> Validate
    
    Validate -->|Valid| MoreComponents{Add More Components?}
    
    MoreComponents -->|Yes| DragDrop
    MoreComponents -->|No| Generate[Generate Kedro Code]
    
    Generate --> Preview[Preview Generated Code]
    
    Preview --> Satisfied{Satisfied with Code?}
    
    Satisfied -->|No| Modify[Modify Pipeline]
    Modify --> DragDrop
    
    Satisfied -->|Yes| Export[Export to ZIP]
    Export --> Download[Download Kedro Project]
    Download --> End([Complete])
    
    style Start fill:#4AE290
    style End fill:#4AE290
    style Validate fill:#E24A4A
    style Generate fill:#4A90E2
    style Download fill:#E2C44A
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant P as Component Palette
    participant C as Pipeline Canvas
    participant CP as Config Panel
    participant S as Redux Store
    participant M as Auto-save Middleware
    participant L as localStorage

    U->>P: Drag dataset/node
    P->>C: dataTransfer payload
    C->>S: dispatch(addDataset/addNode)
    S-->>C: Updated graph state
    C->>CP: openConfigPanel(selectedComponent)
    U->>CP: Submit configuration
    CP->>S: dispatch(updateDataset/updateNode)
    S-->>C: Updated canvas props
    S->>M: Trigger save debounce
    M->>L: Persist project snapshot
    U->>C: Connect handles
    C->>S: dispatch(addConnection)
    S-->>C: Edge rendered + validation hints
```

---

## Code Generation Flow

```mermaid
flowchart TD
    Start([User Triggers Export/View Code]) --> GetState[Get Pipeline State from Redux]
    
    GetState --> ExtractNodes[Extract Nodes Array]
    GetState --> ExtractDatasets[Extract Datasets Array]
    GetState --> ExtractEdges[Extract Edges Array]
    
    ExtractNodes --> ProcessNodes[Process Node Data]
    ProcessNodes --> NodeTemplate[Load Node Template]
    NodeTemplate --> GenerateFunctions[Generate Python Functions]
    
    ExtractDatasets --> ProcessDatasets[Process Dataset Data]
    ProcessDatasets --> DatasetTemplate[Load Dataset Template]
    DatasetTemplate --> GenerateCatalog[Generate catalog.yml]
    
    ExtractEdges --> ProcessEdges[Process Edge Data]
    ProcessEdges --> PipelineTemplate[Load Pipeline Template]
    PipelineTemplate --> GeneratePipeline[Generate pipeline.py]
    
    GenerateFunctions --> CombineCode[Combine Python Code]
    GenerateCatalog --> CombineYAML[Combine YAML Config]
    GeneratePipeline --> CombineCode
    
    CombineCode --> FormatCode[Format Python Code]
    CombineYAML --> FormatYAML[Format YAML]
    
    FormatCode --> BuildProject[Build Project Structure]
    FormatYAML --> BuildProject
    
    BuildProject --> CreateStructure[Create Directory Structure]
    CreateStructure --> CreateFiles[Create File Templates]
    
    CreateFiles --> GenerateZIP{Export Mode?}
    
    GenerateZIP -->|Export to ZIP| CreateZIPFile[Create ZIP Archive]
    GenerateZIP -->|View Code| DisplayCode[Display Code Preview]
    
    CreateZIPFile --> AddFiles[Add Files to ZIP]
    AddFiles --> DownloadFile[Trigger Download]
    
    DisplayCode --> UpdateStore[Update Code State]
    DownloadFile --> End([End])
    UpdateStore --> End
    
    style Start fill:#61dafb
    style GenerateFunctions fill:#4ecdc4
    style GenerateCatalog fill:#95e1d3
    style GeneratePipeline fill:#ff6b6b
    style CreateZIPFile fill:#feca57
    style End fill:#ff9ff3
```

---

## State Management & Data Flow

Kedro Builder uses **Redux Toolkit** with a **normalized state structure** for efficient lookups and updates. The state is organized into domain-specific slices, with middleware handling persistence and side effects.

### Key Implementation Details

1. **Initialization**  
   `useAppInitialization` inspects localStorage: it decides whether to show onboarding, restores saved projects, and hydrates Redux slices by replaying `addNode/addDataset/addConnection`.

2. **User Interaction Loop**  
   - Components dispatch slice actions (e.g., `nodesSlice.addNode`).  
   - Reducers update normalized state.  
   - Selectors and typed hooks (`useAppSelector`) keep ReactFlow and panels synced.  
   - ReactFlow callbacks (`onNodesChange`, `onConnect`) route through `useNodeHandlers` / `useConnectionHandlers` to produce Redux actions.

3. **Side Effects**  
   - Auto-save middleware debounces mutation-triggering actions defined in `SAVE_TRIGGER_ACTIONS`.  
   - `useValidation` listens for configuration changes during export and re-runs validation, pushing results into `validationSlice`.  
   - Toast notifications surface validation/export feedback.

4. **Normalized State Benefits**
   - O(1) lookups by ID
   - Efficient updates (no array scanning)
   - Easy serialization for localStorage
   - Simplified ReactFlow reconciliation

5. **ID Prefix Strategy**
   - `node-*`: Function nodes
   - `dataset-*`: Dataset nodes
   - `connection-*`: Edges between nodes and datasets
---

## Validation & Export Implementation

- **Validation (`src/utils/validation.ts`)**  
  DFS-based cycle detection converts dataset connections into node-to-node edges. Additional passes enforce unique snake_case names, detect empty/orphaned nodes and datasets, and warn about missing node function code or dataset configuration.

- **Export Flow (`src/components/App/hooks/useValidation.ts`)**  
  `handleViewCode` and `handleExport` both run validation. The export wizard consumes `ValidationResult` state; when users confirm, `generateKedroProject` collects graph data and writes:  
  - `pyproject.toml`, `.gitignore`, `README.md`  
  - `conf/base` (catalog, logging, parameters) and `conf/local/credentials.yml`  
  - `src/<package>/` pipelines (`nodes.py`, `pipeline.py`, registry, settings)  
  - Data layer directories with `.gitkeep` placeholders.

- **Download**  
  The zip is generated client-side via JSZip and downloaded using a temporary `<a>` element with an object URL.

---

## Project Structure

```
kedro-builder/
├── src/
│   ├── components/
│   │   ├── App/                 # Shell, layout, validation hooks
│   │   ├── Canvas/              # ReactFlow integration, overlays, handlers
│   │   ├── CodeViewer/          # File tree + syntax-highlighted preview
│   │   ├── ConfigPanel/         # Node & dataset configuration forms
│   │   ├── ExportWizard/        # Validation step + metadata confirmation
│   │   ├── Palette/             # Drag sources for nodes/datasets
│   │   ├── ProjectSetup/        # Project creation/edit modal
│   │   ├── Tutorial/            # Onboarding modal
│   │   ├── UI/                  # Buttons, inputs, theme toggle, helpers
│   │   └── ValidationPanel/     # Issue list surfaced from validation slice
│   ├── features/                # Redux slices per domain
│   │   ├── connections/
│   │   ├── datasets/
│   │   ├── nodes/
│   │   ├── project/
│   │   ├── theme/
│   │   ├── ui/
│   │   └── validation/
│   ├── store/                   # Store configuration, typed hooks, middleware
│   ├── utils/
│   │   ├── export/              # Kedro project generators + tests
│   │   ├── localStorage.ts
│   │   ├── validation.ts
│   │   └── logger.ts
│   ├── styles/                  # Global styles & variables
│   ├── types/                   # Domain and Redux typings
│   ├── constants/               # Timing, layout, etc.
│   ├── services/                # (Reserved for future external services)
│   └── main.tsx                 # App entry point
├── public/                      # Static assets
├── README.md                    # Quick start & usage
├── PROJECT_ARCHITECTURE.md      # This document
└── package.json / tsconfig / vite.config.ts
```

---

## Implementation Patterns

```typescript
// Debounced auto-save middleware (src/store/middleware/autoSaveMiddleware.ts)
const SAVE_TRIGGER_ACTIONS = [
  'project/createProject',
  'project/updateProject',
  'nodes/addNode',
  // ...additional mutation actions
];

export const autoSaveMiddleware: Middleware<{}, RootState> = store => next => action => {
  const result = next(action);
  if (shouldTriggerSave(action)) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveProjectToLocalStorage(store.getState());
      logger.save('Project auto-saved to localStorage');
    }, TIMING.AUTO_SAVE_DEBOUNCE);
  }
  return result;
};
```

```typescript
// Validation hook orchestrating code preview/export (src/components/App/hooks/useValidation.ts)
const { exportValidationResult, handleViewCode, handleExport, handleConfirmExport } =
  useValidation({ showExportWizard });
```

```typescript
// Node configuration name guard (src/components/ConfigPanel/NodeConfigForm/NodeConfigForm.tsx)
if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
  return 'Must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
}
```

---

## Testing Strategy

- **Implemented:**  
  - Vitest unit tests for validation helpers and export generators.  
  - Slice reducer tests covering node/dataset/connection mutations.
---

**Built with AI assistance.**

