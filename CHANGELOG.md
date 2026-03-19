# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive code review fixes across 13 phases (44 individual fixes) — PR #37
  - Cycle detection during drag (live red line via `isValidConnection`)
  - Copy/paste now preserves connections between pasted nodes
  - `FILEPATH_EXEMPT_TYPES` set for datasets that don't need file paths (SQL, BigQuery, Spark Hive, etc.)
  - `TUTORIAL_STEP_COUNT` constant to prevent hard-coded step limits
  - `themeSelectors.ts` with `selectTheme` replacing inline `state.theme.theme` access
  - Coverage thresholds enforced in Vitest config (statements 60%, branches 50%, functions 60%, lines 60%)
  - CSS tokens `--color-text-muted` and `--color-dataset` defined in light/dark theme blocks
  - Tests for `detectCycles` and `wouldCreateCycle` graph operations
- Onboarding slice extracted from uiSlice (tutorial + walkthrough state)
- Validation engine moved to top-level `src/validation/` directory
- ValidationCode enum to replace brittle message-string matching
- Dev-time guard for TUTORIAL_STEP_COUNT sync
- 375 tests across 47 test files with 64%+ coverage
- Path alias `@/` configured in tsconfig.json and vite.config.ts for cleaner imports
- 2 integration tests for end-to-end workflows

### Changed
- Test suite expanded to 375 tests across 47 test files (from initial 219)
- Legacy 343-line pipelineValidation.ts replaced with 27-line ValidatorRegistry wrapper (Strategy pattern)
- 134 deep relative imports converted to `@/` path aliases
- Barrel exports added for hooks/ and infrastructure/ directories
- ValidatorRegistry trimmed from 8 methods to 3 (`register`, `getAll`, `validateAll`)
- Canvas mega-selector split: theme selected independently to avoid invalidating node/edge memoization
- Logger production default changed from INFO to WARN
- Telemetry storage keys now reference centralized `STORAGE_KEYS` constants
- `RootState` derived from `ReturnType<typeof store.getState>` instead of hand-written interface
- `NodeType` changed from fixed union to open `string` type
- Ghost preview caches node bounds at drag-start instead of querying DOM on every mousemove
- `ConfigPanel` replaced direct `store.getState()` call with a thunk for proper Redux data flow
- `pythonPackage` name generation now includes `.toLowerCase()` for valid Python packages
- Mock store helpers (`createMockState`, `createTestState`) aligned with real initial state values
- `localStorage.getItem` mock returns `null` (matching real API) instead of `undefined`
- `renderWithProviders` test helper adds `serializableCheck: false` matching production store config
- DFS cycle detection deduplicated into shared `dfsWalk` helper

### Fixed
- Generated pipeline.py uses correct `node()` (lowercase) with required `name=` parameter
- ID generation uses `crypto.randomUUID()` instead of `Date.now()`
- CodeDisplay uses granular Redux selectors preventing unnecessary re-renders
- O(n^2) `deleteNodes`/`deleteDatasets` replaced with Set-based lookups
- `autoSaveMiddleware` now triggers on `deleteDatasets` and `addDataset`
- Parameterized selectors use factory + per-component instance pattern for proper memoization
- `addNode` prepare callback guards against falsy `payload.id`
- `selectSelectionType` returns `'none'` instead of `'nodes'` on empty selection
- `saveProjectToLocalStorage` no longer mutates `updatedAt` (store is source of truth)
- `setTelemetryConsent` no longer calls `window.location.reload()`
- `isLocalStorageAvailable()` result cached per session
- `PYTHON_KEYWORDS` moved to `constants/python.ts` (correct layer)
- `MissingConfigValidator` exempts 8 dataset types that don't need file paths
- `sanitizeForPython("")` returns `'unnamed_function'` instead of empty string
- Regex patterns exported from `inputValidation.ts` instead of duplicated in validators
- `'Unnamed Node'`/`'Unnamed Dataset'` extracted to constants
- `useClearSelections` now also clears dataset selections
- `useSelectAndOpenConfig` routes to correct action for datasets vs nodes
- ErrorBoundary.scss uses real project CSS tokens instead of undefined custom properties
- FilepathBuilder full-path edits now parse and sync with segment state
- Input `htmlFor` uses `useId()` fallback for accessible labels
- FilepathBuilder.scss uses `.kui-theme--dark` matching the app's actual theme class
- `.DatasetCard__icon` selectors match actual type values (`sql_table`, `sql_query`)
- `useFilepathBuilder` no longer marks form dirty on mount
- Escape key clears selection only when focus is not in an input/textarea
- `.gitignore` pattern correctly exposes nested `.gitkeep` files
- `catalog.yml` generator handles SQL datasets correctly (table_name/credentials/inline sql)
- `generateCustomFunction` matches function name to node name
- TutorialModal null guard placed after all hooks (React rules of hooks)
- 9 localStorage and telemetry infrastructure issues fixed

### Removed
- 8 unused dependencies (dexie, handlebars, prism-react-renderer, file-saver, js-yaml, and their type packages)
- Dead code cleanup: 11 dead actions, 5 dead selectors, 3 dead state fields across 6 slices
  - Removed `setSavedList`, `setLastSaved`, `savedList`, `lastSaved` from project slice
  - Removed `showCodePreview`, `setTutorialStep`, `setWalkthroughStep`, `reopenWalkthrough`, `toggleCodePreview`, `setShowCodePreview` from ui slice
  - Removed `toggleDatasetSelection`, `selectDatasets` from datasets slice
  - Removed `setValidationErrors` from validation slice
  - Removed `hoverNode` from nodes slice
  - Removed `selectSavedProjects`, `selectLastSaved`, `selectSelectedDatasets`, `selectSelectedDataset`, `selectIsDatasetSelected` selectors
- 6 unused identity selectors from `uiSelectors.ts` and 6 from `validationSelectors.ts`
- `storageType: 'indexedDB'` option (never implemented)
- Unused telemetry content
- Direct `console.log`/`console.error` calls replaced with centralized `logger` utility
