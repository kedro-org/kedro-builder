/**
 * Validators barrel export
 * Strategy pattern implementation for pipeline validation
 */

// Import for local use
import { ValidatorRegistry } from './Validator';
import { CircularDependencyValidator } from './CircularDependencyValidator';
import { DuplicateNameValidator } from './DuplicateNameValidator';
import { InvalidNameValidator } from './InvalidNameValidator';
import { EmptyNameValidator } from './EmptyNameValidator';
import { OrphanedNodeValidator } from './OrphanedNodeValidator';
import { OrphanedDatasetValidator } from './OrphanedDatasetValidator';
import { MissingCodeValidator } from './MissingCodeValidator';
import { MissingConfigValidator } from './MissingConfigValidator';

// Re-exports
export { type Validator, ValidatorRegistry } from './Validator';
export { CircularDependencyValidator } from './CircularDependencyValidator';
export { DuplicateNameValidator } from './DuplicateNameValidator';
export { InvalidNameValidator } from './InvalidNameValidator';
export { EmptyNameValidator } from './EmptyNameValidator';
export { OrphanedNodeValidator } from './OrphanedNodeValidator';
export { OrphanedDatasetValidator } from './OrphanedDatasetValidator';
export { MissingCodeValidator } from './MissingCodeValidator';
export { MissingConfigValidator } from './MissingConfigValidator';

/**
 * Create a pre-configured validator registry with all default validators
 * @returns ValidatorRegistry with all validators registered
 */
export function createDefaultValidatorRegistry(): ValidatorRegistry {
  const registry = new ValidatorRegistry();

  // Register error validators (blocking)
  registry
    .register(new CircularDependencyValidator())
    .register(new DuplicateNameValidator())
    .register(new InvalidNameValidator())
    .register(new EmptyNameValidator());

  // Register warning validators (non-blocking)
  registry
    .register(new OrphanedNodeValidator())
    .register(new OrphanedDatasetValidator())
    .register(new MissingCodeValidator())
    .register(new MissingConfigValidator());

  return registry;
}

// Pre-created default registry for convenience
let defaultRegistry: ValidatorRegistry | null = null;

/**
 * Get the default validator registry (singleton)
 * Creates it on first access
 */
export function getDefaultValidatorRegistry(): ValidatorRegistry {
  if (!defaultRegistry) {
    defaultRegistry = createDefaultValidatorRegistry();
  }
  return defaultRegistry;
}
