/**
 * Validator interface for Strategy Pattern
 * Each validator implements this interface and focuses on a single validation concern
 */

import type { RootState } from '@/store';
import type { ValidationError } from '../types';

/**
 * Base interface for all pipeline validators
 */
export interface Validator {
  /** Unique identifier for this validator */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** Whether this validator produces errors (blocking) or warnings (non-blocking) */
  readonly severity: 'error' | 'warning';

  /**
   * Run validation against the pipeline state
   * @param state - The Redux root state
   * @returns Array of validation errors/warnings (empty if validation passes)
   */
  validate(state: RootState): ValidationError[];
}

/**
 * Registry to manage and execute validators
 */
export class ValidatorRegistry {
  private validators: Map<string, Validator> = new Map();

  /**
   * Register a validator
   */
  register(validator: Validator): this {
    this.validators.set(validator.id, validator);
    return this;
  }

  /**
   * Get all registered validators
   */
  getAll(): Validator[] {
    return Array.from(this.validators.values());
  }

  /**
   * Run all validators and collect results
   */
  validateAll(state: RootState): ValidationError[] {
    const results: ValidationError[] = [];

    for (const validator of this.validators.values()) {
      results.push(...validator.validate(state));
    }

    return results;
  }
}
