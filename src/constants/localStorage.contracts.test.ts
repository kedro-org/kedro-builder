/**
 * localStorage Contract Tests
 *
 * These tests lock the localStorage key formats to prevent accidental breaking changes.
 * The key formats are part of the public contract - changing them would break
 * existing users' saved data.
 *
 * All assertions compare against real source-code exports, NOT hardcoded strings.
 * If a key value changes in source, the corresponding test will fail — which is
 * the entire point of a contract test.
 *
 * IMPORTANT: Do NOT change these values without a migration strategy.
 */

import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS } from '.';
import { TELEMETRY_KEY, TELEMETRY_CONSENT_SHOWN_KEY } from '../infrastructure/telemetry';

describe('localStorage Contracts', () => {
  describe('Key Format Invariants', () => {
    it('main project storage key is "kedro_builder_current_project"', () => {
      expect(STORAGE_KEYS.CURRENT_PROJECT).toBe('kedro_builder_current_project');
      expect(STORAGE_KEYS.CURRENT_PROJECT).toMatch(/^kedro_builder_/);
    });

    it('theme storage key is "kedro_builder_theme"', () => {
      expect(STORAGE_KEYS.THEME).toBe('kedro_builder_theme');
      expect(STORAGE_KEYS.THEME).toMatch(/^kedro_builder_/);
    });

    it('tutorial completion key is "kedro_builder_tutorial_completed"', () => {
      expect(STORAGE_KEYS.TUTORIAL_COMPLETED).toBe('kedro_builder_tutorial_completed');
      expect(STORAGE_KEYS.TUTORIAL_COMPLETED).toMatch(/^kedro_builder_/);
    });

    it('walkthrough completion key is "kedro_builder_walkthrough_completed"', () => {
      expect(STORAGE_KEYS.WALKTHROUGH_COMPLETED).toBe('kedro_builder_walkthrough_completed');
      expect(STORAGE_KEYS.WALKTHROUGH_COMPLETED).toMatch(/^kedro_builder_/);
    });

    it('telemetry key is "kedro-builder-telemetry"', () => {
      expect(STORAGE_KEYS.TELEMETRY).toBe('kedro-builder-telemetry');
      expect(STORAGE_KEYS.TELEMETRY).toMatch(/^kedro-builder-/);
    });

    it('telemetry consent shown key is "kedro-builder-telemetry-consent-shown"', () => {
      expect(STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN).toBe('kedro-builder-telemetry-consent-shown');
      expect(STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN).toMatch(/^kedro-builder-/);
    });
  });

  describe('Telemetry module re-exports match STORAGE_KEYS', () => {
    it('TELEMETRY_KEY is an alias for STORAGE_KEYS.TELEMETRY', () => {
      expect(TELEMETRY_KEY).toBe(STORAGE_KEYS.TELEMETRY);
    });

    it('TELEMETRY_CONSENT_SHOWN_KEY is an alias for STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN', () => {
      expect(TELEMETRY_CONSENT_SHOWN_KEY).toBe(STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN);
    });
  });

  describe('Key Naming Conventions', () => {
    it('app state keys (project, theme, tutorial, walkthrough) use underscore format', () => {
      const appStateKeys = [
        STORAGE_KEYS.CURRENT_PROJECT,
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.TUTORIAL_COMPLETED,
        STORAGE_KEYS.WALKTHROUGH_COMPLETED,
      ];

      appStateKeys.forEach((key) => {
        expect(key).toMatch(/^kedro_builder_[a-z_]+$/);
      });
    });

    it('telemetry keys use dash format', () => {
      const telemetryKeys = [
        STORAGE_KEYS.TELEMETRY,
        STORAGE_KEYS.TELEMETRY_CONSENT_SHOWN,
      ];

      telemetryKeys.forEach((key) => {
        expect(key).toMatch(/^kedro-builder-[a-z-]+$/);
      });
    });
  });

  describe('STORAGE_KEYS completeness', () => {
    it('has exactly 6 keys', () => {
      const keys = Object.keys(STORAGE_KEYS);
      expect(keys).toHaveLength(6);
      expect(keys).toEqual(expect.arrayContaining([
        'CURRENT_PROJECT',
        'THEME',
        'TUTORIAL_COMPLETED',
        'WALKTHROUGH_COMPLETED',
        'TELEMETRY',
        'TELEMETRY_CONSENT_SHOWN',
      ]));
    });
  });
});
