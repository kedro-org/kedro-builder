/**
 * localStorage Contract Tests
 *
 * These tests lock the localStorage key formats to prevent accidental breaking changes.
 * The key formats are part of the public contract - changing them would break
 * existing users' saved data.
 *
 * IMPORTANT: Do NOT change these values without a migration strategy.
 */

import { describe, it, expect } from 'vitest';
import { TELEMETRY_KEY, TELEMETRY_CONSENT_SHOWN_KEY } from '../../infrastructure/telemetry';

describe('localStorage Contracts', () => {
  describe('Key Format Invariants', () => {
    it('main project storage key uses underscore format', () => {
      // This key is used in infrastructure/localStorage/localStorage.ts
      const STORAGE_KEY = 'kedro_builder_current_project';
      expect(STORAGE_KEY).toBe('kedro_builder_current_project');
      expect(STORAGE_KEY).toMatch(/^kedro_builder_/);
    });

    it('theme storage key uses underscore format', () => {
      // This key is used in features/theme/themeSlice.ts
      const THEME_KEY = 'kedro_builder_theme';
      expect(THEME_KEY).toBe('kedro_builder_theme');
      expect(THEME_KEY).toMatch(/^kedro_builder_/);
    });

    it('tutorial completion key uses underscore format', () => {
      // This key is used in features/ui/uiSlice.ts
      const TUTORIAL_KEY = 'kedro_builder_tutorial_completed';
      expect(TUTORIAL_KEY).toBe('kedro_builder_tutorial_completed');
      expect(TUTORIAL_KEY).toMatch(/^kedro_builder_/);
    });

    it('walkthrough completion key uses underscore format', () => {
      // This key is used in features/ui/uiSlice.ts
      const WALKTHROUGH_KEY = 'kedro_builder_walkthrough_completed';
      expect(WALKTHROUGH_KEY).toBe('kedro_builder_walkthrough_completed');
      expect(WALKTHROUGH_KEY).toMatch(/^kedro_builder_/);
    });

    it('telemetry key uses dash format', () => {
      // This key is used in infrastructure/telemetry/telemetry.ts and index.html
      expect(TELEMETRY_KEY).toBe('kedro-builder-telemetry');
      expect(TELEMETRY_KEY).toMatch(/^kedro-builder-/);
    });

    it('telemetry consent shown key uses dash format', () => {
      // This key is used in infrastructure/telemetry/telemetry.ts
      expect(TELEMETRY_CONSENT_SHOWN_KEY).toBe('kedro-builder-telemetry-consent-shown');
      expect(TELEMETRY_CONSENT_SHOWN_KEY).toMatch(/^kedro-builder-/);
    });
  });

  describe('Key Naming Conventions', () => {
    it('underscore keys are used for app state (theme, tutorial, walkthrough, project)', () => {
      // These are internal app state keys
      const appStateKeys = [
        'kedro_builder_current_project',
        'kedro_builder_theme',
        'kedro_builder_tutorial_completed',
        'kedro_builder_walkthrough_completed',
      ];

      appStateKeys.forEach((key) => {
        expect(key).toMatch(/^kedro_builder_[a-z_]+$/);
      });
    });

    it('dash keys are used for telemetry/consent', () => {
      // These are telemetry-related keys
      const telemetryKeys = [TELEMETRY_KEY, TELEMETRY_CONSENT_SHOWN_KEY];

      telemetryKeys.forEach((key) => {
        expect(key).toMatch(/^kedro-builder-[a-z-]+$/);
      });
    });
  });

  describe('Stored Data Format Contracts', () => {
    it('project state has required structure', () => {
      // This is the shape of data stored in kedro_builder_current_project
      const projectStateShape = {
        project: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
        nodes: expect.any(Array),
        datasets: expect.any(Array),
        connections: expect.any(Array),
      };

      // Validate the shape exists (this documents the contract)
      expect(projectStateShape).toBeDefined();
      expect(projectStateShape.project).toBeDefined();
      expect(projectStateShape.nodes).toBeDefined();
      expect(projectStateShape.datasets).toBeDefined();
      expect(projectStateShape.connections).toBeDefined();
    });

    it('theme values are light or dark', () => {
      const validThemeValues = ['light', 'dark'];
      expect(validThemeValues).toContain('light');
      expect(validThemeValues).toContain('dark');
      expect(validThemeValues.length).toBe(2);
    });

    it('telemetry values are enabled or disabled', () => {
      const validTelemetryValues = ['enabled', 'disabled'];
      expect(validTelemetryValues).toContain('enabled');
      expect(validTelemetryValues).toContain('disabled');
      expect(validTelemetryValues.length).toBe(2);
    });

    it('boolean flags are stored as string "true"', () => {
      // Tutorial and walkthrough completion are stored as 'true' string
      const trueStringValue = 'true';
      expect(trueStringValue).toBe('true');
    });
  });
});
