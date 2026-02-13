/**
 * Tests safeGetItem / safeSetItem / safeRemoveItem against a REAL Storage implementation.
 *
 * The global test setup (test/setup.ts) replaces localStorage with vi.fn() stubs
 * that silently swallow every call -- exactly the over-mocking problem this test exists to fix.
 * We replace it with a functioning in-memory Storage so the safe* helpers are tested for real.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { safeSetItem, safeGetItem, safeRemoveItem, STORAGE_KEYS } from './storage';

describe('localStorage safe helpers (real Storage)', () => {
  const savedStorage = global.localStorage;

  beforeEach(() => {
    // Replace the vi.fn() mock with a real in-memory Storage
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
    } as Storage;
  });

  afterEach(() => {
    global.localStorage = savedStorage;
  });

  it('safeSetItem writes and safeGetItem reads back the value', () => {
    safeSetItem(STORAGE_KEYS.THEME, 'dark');

    const value = safeGetItem(STORAGE_KEYS.THEME);
    expect(value).toBe('dark');

    // Confirm it's in the underlying storage
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
  });

  it('safeSetItem returns true on success', () => {
    const result = safeSetItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
    expect(result).toBe(true);
  });

  it('safeRemoveItem removes the key from localStorage', () => {
    safeSetItem(STORAGE_KEYS.TELEMETRY, 'enabled');
    expect(safeGetItem(STORAGE_KEYS.TELEMETRY)).toBe('enabled');

    const removed = safeRemoveItem(STORAGE_KEYS.TELEMETRY);

    expect(removed).toBe(true);
    expect(safeGetItem(STORAGE_KEYS.TELEMETRY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.TELEMETRY)).toBeNull();
  });
});
