# Contributing to Kedro Builder

Thank you for contributing to Kedro Builder! This guide will help you get started.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/kedro-org/kedro-builder.git
cd kedro-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build (tsc -b + Vite) |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests with Vitest (watch mode by default) |
| `npm run test:ui` | Vitest UI dashboard |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |

Before submitting a PR, run:
```bash
npm run build && npx vitest run
```

## Code Standards

### File Naming
- **Components**: PascalCase (`CustomNode.tsx`, `DatasetNode.tsx`)
- **Hooks**: camelCase with `use` prefix (`useNodeSelection.ts`, `useAutoLayout.ts`)
- **Utilities**: camelCase (`formatNode.ts`, `generateId.ts`)
- **Types**: PascalCase (`NodeTypes.ts`, `PipelineTypes.ts`)
- **Constants**: SCREAMING_SNAKE_CASE values, camelCase filename (`storageKeys.ts`)
- **Tests**: Same name with `.test.tsx` or `.test.ts` suffix

### Import Order
```typescript
// 1. External libraries
import { useCallback, useState } from 'react';
import { Node, Edge } from '@xyflow/react';

// 2. Internal absolute imports (@ aliases)
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/store/hooks';
import { selectNodes } from '@/features/nodes/nodesSelectors';

// 3. Relative imports
import { TaskNodeData } from './types';
import { validateConnection } from './utils';
```

### TypeScript
- **Strict mode enabled** - no implicit any
- Avoid `any` unless absolutely necessary (document with comment)
- Prefer `interface` for object shapes
- Prefer `type` for unions, intersections, and branded types
- Export shared types from `types/` directory

## Project Structure

```
src/
├── components/          # React components
│   ├── UI/             # Primitives (Button, Input, ErrorBoundary, ThemeToggle)
│   ├── Canvas/         # ReactFlow canvas, custom nodes/edges, 14 canvas hooks
│   ├── App/            # App shell, layout, validation hooks
│   ├── ConfigPanel/    # Node & dataset configuration forms
│   ├── CodeViewer/     # File tree + syntax-highlighted code preview
│   ├── ExportWizard/   # Validation step + metadata confirmation
│   ├── Palette/        # Drag sources for nodes/datasets
│   └── ...             # Tutorial, Walkthrough, Settings, Feedback, etc.
├── features/           # Redux slices + selectors
│   ├── nodes/          │   ├── datasets/
│   ├── connections/    │   ├── project/
│   ├── onboarding/     │   ├── validation/
│   ├── ui/             │   ├── theme/
│   └── canvas/         # Combined canvas selectors
├── validation/         # Pipeline validation engine (8 validators)
├── store/              # Redux store setup, hooks, middleware
├── domain/             # Pure business logic (IdGenerator, PipelineGraph)
├── infrastructure/     # External concerns (export, localStorage, telemetry)
├── hooks/              # Shared custom React hooks
├── types/              # Shared TypeScript types (including branded IDs)
├── constants/          # Application constants (timing, storage keys, layout)
└── utils/              # Input validation and utility functions
```

## Testing

We use **Vitest** and **React Testing Library**.

```bash
# Run all tests (watch mode by default)
npm run test

# Vitest UI dashboard
npm run test:ui

# Check coverage
npm run test:coverage
```

Place test files alongside the code they test:
```
CustomNode.tsx
CustomNode.test.tsx
```

Focus on:
- Component rendering and user interactions
- Redux slice reducers and selectors
- Business logic in domain validators
- Utility functions

## Kedro Domain Rules

Kedro Builder models Kedro data pipelines. Key connection rules:

**Allowed Connections:**
- Dataset → Task (input)
- Task → Dataset (output)
- Parameter → Task (input)

**Not Allowed:**
- Task → Task (must connect through a dataset)
- Dataset → Dataset (no direct data-to-data connections)
- Task → Parameter (parameters are inputs only, not outputs)

See `src/validation/validators/` for validation logic and `src/domain/PipelineGraph.ts` for graph operations.

## Pull Request Process

1. **Create a focused PR** - one feature or fix per PR
2. **Follow branch naming** - `feature/description` or `fix/description`
3. **Write clear commit messages** - describe what and why
4. **Run checks locally** - `npm run build && npm run test`
5. **Update tests** - add/update tests for your changes
6. **Target the correct branch** - usually `develop`
7. **Link related issues** - reference issue numbers in PR description

### PR Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] No console.log or debug code left in
- [ ] Changes documented if needed

## Questions or Issues?

- Open an issue on GitHub for bugs or feature requests
- Check existing issues before creating new ones
- Provide clear reproduction steps for bugs

Thank you for contributing!
