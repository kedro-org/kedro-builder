/**
 * Real-time input validation for forms
 * Validates names as users type
 */

import type { InputValidationResult } from './types';
import { PYTHON_KEYWORDS } from '../../constants/python';

export { PYTHON_KEYWORDS };

// Regex patterns for name validation
const NODE_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_\s]*$/;
const DATASET_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

/**
 * Check if a name is a reserved Python keyword
 * @param name - The name to check (case-insensitive)
 * @returns true if the name is a reserved Python keyword
 */
export function isPythonKeyword(name: string): boolean {
  const trimmed = name.trim();
  return PYTHON_KEYWORDS.has(trimmed) || PYTHON_KEYWORDS.has(trimmed.toLowerCase());
}

/**
 * Validate a node name in real-time as user types
 * @param name - The name to validate
 * @param existingNames - Set of existing node names (excluding current node)
 * @returns Validation result with error message if invalid
 */
export function validateNodeName(name: string, existingNames?: Set<string>): InputValidationResult {
  const trimmed = name.trim();

  // Check for empty name
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Name is required' };
  }

  // Check minimum length
  if (trimmed.length < 2) {
    return { isValid: false, errorMessage: 'Name must be at least 2 characters' };
  }

  // Check maximum length
  if (trimmed.length > 100) {
    return { isValid: false, errorMessage: 'Name must be less than 100 characters' };
  }

  // Check pattern (starts with letter, allows letters, numbers, underscores, spaces)
  if (!NODE_NAME_PATTERN.test(trimmed)) {
    if (!/^[a-zA-Z]/.test(trimmed)) {
      return { isValid: false, errorMessage: 'Name must start with a letter' };
    }
    return { isValid: false, errorMessage: 'Name can only contain letters, numbers, underscores, and spaces' };
  }

  // Check for reserved Python keywords
  const lowerName = trimmed.toLowerCase();
  if (PYTHON_KEYWORDS.has(trimmed) || PYTHON_KEYWORDS.has(lowerName)) {
    return { isValid: false, errorMessage: `"${trimmed}" is a reserved Python keyword` };
  }

  // Check for duplicates
  if (existingNames && existingNames.has(lowerName)) {
    return { isValid: false, errorMessage: 'A node with this name already exists' };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * Validate a dataset name in real-time as user types
 * Dataset names must be in snake_case format
 * @param name - The name to validate
 * @param existingNames - Set of existing dataset names (excluding current dataset)
 * @returns Validation result with error message if invalid
 */
export function validateDatasetName(name: string, existingNames?: Set<string>): InputValidationResult {
  const trimmed = name.trim();

  // Check for empty name
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Name is required' };
  }

  // Check minimum length
  if (trimmed.length < 2) {
    return { isValid: false, errorMessage: 'Name must be at least 2 characters' };
  }

  // Check maximum length
  if (trimmed.length > 100) {
    return { isValid: false, errorMessage: 'Name must be less than 100 characters' };
  }

  // Check for spaces (common mistake)
  if (/\s/.test(trimmed)) {
    return { isValid: false, errorMessage: 'Dataset names cannot contain spaces. Use underscores instead.' };
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(trimmed)) {
    return { isValid: false, errorMessage: 'Dataset names must be lowercase (snake_case format)' };
  }

  // Check pattern (snake_case: starts with lowercase letter, only lowercase, numbers, underscores)
  if (!DATASET_NAME_PATTERN.test(trimmed)) {
    if (!/^[a-z]/.test(trimmed)) {
      return { isValid: false, errorMessage: 'Name must start with a lowercase letter' };
    }
    return { isValid: false, errorMessage: 'Use snake_case: lowercase letters, numbers, and underscores only' };
  }

  // Check for reserved Python keywords
  if (PYTHON_KEYWORDS.has(trimmed)) {
    return { isValid: false, errorMessage: `"${trimmed}" is a reserved Python keyword` };
  }

  // Check for duplicates
  if (existingNames && existingNames.has(trimmed)) {
    return { isValid: false, errorMessage: 'A dataset with this name already exists' };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * Sanitize a string for use in Python identifiers
 * Converts to snake_case and removes invalid characters
 */
export function sanitizeForPython(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '')     // Remove invalid characters
    .replace(/^[0-9]+/, '')         // Remove leading numbers
    .replace(/_+/g, '_')            // Replace multiple underscores with single
    .replace(/^_|_$/g, '');         // Remove leading/trailing underscores
}
