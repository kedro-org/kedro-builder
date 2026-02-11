# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 279 new tests increasing total test count from 219 to 498
  - Added comprehensive test coverage for custom hooks
  - Added tests for domain logic and validators
  - Added tests for filepath utilities and file tree generator
- 2 integration tests for end-to-end workflows
  - Pipeline create-connect-export flow
  - Pipeline create-validate flow
- Path alias `@/` configured in tsconfig.json and vite.config.ts for cleaner imports

### Changed
- Legacy 343-line pipelineValidation.ts replaced with 27-line ValidatorRegistry wrapper
  - Refactored to use Strategy pattern with pluggable validators
  - Improved maintainability and testability
- 134 deep relative imports converted to `@/` path aliases
  - Simplified import statements across the codebase
  - Reduced coupling to directory structure
- Added barrel exports for hooks/ and infrastructure/ directories
  - Simplified module consumption
  - Cleaner public API surface

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
