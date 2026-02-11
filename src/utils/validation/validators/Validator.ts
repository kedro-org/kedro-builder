/**
 * Validator interface for Strategy Pattern
 * Each validator implements this interface and focuses on a single validation concern
 */

import type { RootState } from '@/types/redux';
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
   * Unregister a validator by ID
   */
  unregister(id: string): boolean {
    return this.validators.delete(id);
  }

  /**
   * Get a validator by ID
   */
  get(id: string): Validator | undefined {
    return this.validators.get(id);
  }

  /**
   * Get all registered validators
   */
  getAll(): Validator[] {
    return Array.from(this.validators.values());
  }

  /**
   * Get validators by severity
   */
  getBySeverity(severity: 'error' | 'warning'): Validator[] {
    return this.getAll().filter(v => v.severity === severity);
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

  /**
   * Run only error validators (blocking checks)
   */
  validateErrors(state: RootState): ValidationError[] {
    const results: ValidationError[] = [];

    for (const validator of this.getBySeverity('error')) {
      results.push(...validator.validate(state));
    }

    return results;
  }

  /**
   * Run only warning validators (non-blocking checks)
   */
  validateWarnings(state: RootState): ValidationError[] {
    const results: ValidationError[] = [];

    for (const validator of this.getBySeverity('warning')) {
      results.push(...validator.validate(state));
    }

    return results;
  }
}
