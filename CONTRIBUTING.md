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
| `npm run build` | Production build (type-checks first) |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run typecheck` | Run TypeScript type checking |

Before submitting a PR, run:
```bash
npm run build && npm run test
```

## Code Standards

### File Naming
- **Components**: PascalCase (`TaskNode.tsx`, `NodePalette.tsx`)
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
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Input, etc.)
│   └── Canvas/         # ReactFlow canvas components
├── features/           # Feature modules (Redux slices + selectors)
│   ├── nodes/
│   ├── connections/
│   ├── layers/
│   └── ...
├── store/              # Redux store setup, hooks, middleware
├── domain/             # Pure business logic (validators, rules)
├── infrastructure/     # External concerns (export, storage, telemetry)
├── hooks/              # Shared custom React hooks
├── types/              # Shared TypeScript types
└── utils/              # Pure utility functions
```

## Testing

We use **Vitest** and **React Testing Library**.

```bash
# Run all tests
npm run test

# Watch mode during development
npm run test:watch

# Check coverage
npm run test:coverage
```

Place test files alongside the code they test:
```
TaskNode.tsx
TaskNode.test.tsx
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

See `src/domain/validators/` for validation logic.

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
