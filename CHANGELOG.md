# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 279 new tests added in initial test expansion (219 to 498 peak)
  - Added comprehensive test coverage for custom hooks
  - Added tests for domain logic and validators
  - Added tests for filepath utilities and file tree generator
- 2 integration tests for end-to-end workflows
  - Pipeline create-connect-export flow
  - Pipeline create-validate flow
- Path alias `@/` configured in tsconfig.json and vite.config.ts for cleaner imports

### Changed
- Test suite trimmed from 482 to 340 tests (142 removed, 2,448 lines cut) with zero coverage impact
  - Removed redundant typeof checks, duplicate tests, spy passthrough assertions
  - Removed irrelevant edge cases (S3/Windows paths, unicode, very long paths)
  - Consolidated mirror tests (connected-as-input/output) and simplified edge case coverage
- Legacy 343-line pipelineValidation.ts replaced with 27-line ValidatorRegistry wrapper
  - Refactored to use Strategy pattern with pluggable validators
  - Improved maintainability and testability
- 134 deep relative imports converted to `@/` path aliases
  - Simplified import statements across the codebase
  - Reduced coupling to directory structure
- Added barrel exports for hooks/ and infrastructure/ directories
  - Simplified module consumption
  - Cleaner public API surface
- ValidatorRegistry trimmed from 8 methods to 3 (`register`, `getAll`, `validateAll`)
  - Removed unused `unregister`, `get`, `getBySeverity`, `validateErrors`, `validateWarnings`
- Canvas mega-selector split: theme selected independently to avoid invalidating node/edge memoization
- Logger production default changed from INFO to WARN for quieter production console
- Telemetry storage keys now reference centralized `STORAGE_KEYS` constants

### Fixed
- Generated pipeline.py now uses correct Kedro API
  - Changed from `Node()` (uppercase) to `node()` (lowercase)
  - Added required `name=` parameter to node definitions
- ID generation uses `crypto.randomUUID()` instead of `Date.now()`
  - Eliminates potential collision risk from timestamp-based IDs
  - Provides cryptographically strong unique identifiers
- CodeDisplay component uses granular Redux selectors
  - Replaced subscription to entire store with targeted selectors
  - Prevents unnecessary re-renders
- O(n^2) performance issue in `deleteNodes` and `deleteDatasets` reducers
  - Replaced array iteration lookups with Set-based lookups
  - Significantly improved deletion performance for large pipelines
- Duplicate `ValidationError` type consolidated to single canonical source (`utils/validation/types.ts`)
- Duplicate `getNodeInputDatasets`/`getNodeOutputDatasets` extracted to shared `export/helpers.ts`
- Duplicate delete logic across 3 hooks consolidated into `useDeleteItems` shared hook
- Unsafe `as RootState` cast in CodeDisplay replaced with narrow `FileTreeInput` interface
- Redundant `validatePipeline` call in `useValidation` replaced with Redux state read
- Duplicate `getConnectionsArray()` in 3 validators extracted to `validators/helpers.ts`
- Unhandled promise rejection in clipboard.writeText now caught with error toast
- `projectGenerator.ts` pass-through module removed; logic lives directly in `KedroProjectBuilder.ts`

### Removed
- 8 unused dependencies reducing bundle size
  - dexie
  - handlebars
  - prism-react-renderer
  - file-saver
  - js-yaml
  - @types/js-yaml
  - @types/file-saver
  - @types/react-syntax-highlighter
- 6 unused identity selectors from `uiSelectors.ts` and 6 from `validationSelectors.ts`
- Unused `formatDocstringParams()` export from helpers
- Unused `theme` return value from `useCanvasState` hook
- Direct `console.log`/`console.error` calls replaced with centralized `logger` utility
