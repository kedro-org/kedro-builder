/**
 * ID Format Contract Tests
 *
 * These tests lock the ID generation formats to prevent accidental breaking changes.
 * The ID formats are used throughout the application and are persisted to localStorage.
 * Changing them would break existing users' saved projects.
 *
 * IMPORTANT: Do NOT change these formats without a migration strategy.
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  generateNodeId,
  generateDatasetId,
  generateCopyId,
  generateConnectionId,
  isNodeId,
  isDatasetId,
  isConnectionId,
  parseIdType,
} from './IdGenerator';

describe('ID Format Contracts', () => {
  describe('Node ID Format', () => {
    it('generates IDs with node- prefix', () => {
      const id = generateNodeId();
      expect(id).toMatch(/^node-.+$/);
    });

    it('generates unique IDs on each call', () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();
      expect(id1).not.toBe(id2);
    });

    it('generateId("node") produces same format as generateNodeId', () => {
      const id = generateId('node');
      expect(id).toMatch(/^node-.+$/);
    });

    it('isNodeId correctly identifies node IDs', () => {
      expect(isNodeId('node-123456789')).toBe(true);
      expect(isNodeId('node-1')).toBe(true);
      expect(isNodeId(generateNodeId())).toBe(true);
      expect(isNodeId('dataset-123')).toBe(false);
      expect(isNodeId('conn-a-b')).toBe(false);
      expect(isNodeId('invalid')).toBe(false);
    });
  });

  describe('Dataset ID Format', () => {
    it('generates IDs with dataset- prefix', () => {
      const id = generateDatasetId();
      expect(id).toMatch(/^dataset-.+$/);
    });

    it('generates unique IDs on each call', () => {
      const id1 = generateDatasetId();
      const id2 = generateDatasetId();
      expect(id1).not.toBe(id2);
    });

    it('generateId("dataset") produces same format as generateDatasetId', () => {
      const id = generateId('dataset');
      expect(id).toMatch(/^dataset-.+$/);
    });

    it('isDatasetId correctly identifies dataset IDs', () => {
      expect(isDatasetId('dataset-123456789')).toBe(true);
      expect(isDatasetId('dataset-1')).toBe(true);
      expect(isDatasetId(generateDatasetId())).toBe(true);
      expect(isDatasetId('node-123')).toBe(false);
      expect(isDatasetId('conn-a-b')).toBe(false);
      expect(isDatasetId('invalid')).toBe(false);
    });
  });

  describe('Connection ID Format', () => {
    it('generates deterministic IDs from source and target', () => {
      const id1 = generateConnectionId('node-123', 'dataset-456');
      const id2 = generateConnectionId('node-123', 'dataset-456');
      expect(id1).toBe(id2);
    });

    it('format is {source}-{target} without conn- prefix', () => {
      const id = generateConnectionId('node-123', 'dataset-456');
      // Connection IDs do NOT have conn- prefix (for localStorage compatibility)
      expect(id).toBe('node-123-dataset-456');
      expect(id).not.toMatch(/^conn-/);
    });

    it('includes source and target in ID', () => {
      const id = generateConnectionId('node-123', 'dataset-456');
      expect(id).toBe('node-123-dataset-456');
      expect(id).toContain('node-123');
      expect(id).toContain('dataset-456');
    });

    it('different source/target pairs produce different IDs', () => {
      const id1 = generateConnectionId('node-1', 'dataset-1');
      const id2 = generateConnectionId('node-1', 'dataset-2');
      const id3 = generateConnectionId('node-2', 'dataset-1');

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id2).not.toBe(id3);
    });

    it('isConnectionId correctly identifies connection IDs', () => {
      // Valid connection IDs contain both node- and dataset-
      expect(isConnectionId('node-123-dataset-456')).toBe(true);
      expect(isConnectionId('dataset-456-node-123')).toBe(true);
      // Invalid - only has one type
      expect(isConnectionId('node-123')).toBe(false);
      expect(isConnectionId('dataset-123')).toBe(false);
      expect(isConnectionId('invalid')).toBe(false);
    });
  });

  describe('Copy/Paste ID Format', () => {
    it('generates node copy IDs with node- prefix', () => {
      const id = generateCopyId('node');
      expect(id).toMatch(/^node-.+$/);
    });

    it('generates dataset copy IDs with dataset- prefix', () => {
      const id = generateCopyId('dataset');
      expect(id).toMatch(/^dataset-.+$/);
    });

    it('generates unique IDs even when called quickly', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCopyId('node'));
      }
      // All IDs should be unique
      expect(ids.size).toBe(100);
    });

    it('copy IDs are still recognized as node/dataset IDs', () => {
      const nodeId = generateCopyId('node');
      const datasetId = generateCopyId('dataset');

      expect(isNodeId(nodeId)).toBe(true);
      expect(isDatasetId(datasetId)).toBe(true);
    });
  });

  describe('parseIdType', () => {
    it('correctly parses node IDs', () => {
      expect(parseIdType('node-123456')).toBe('node');
      expect(parseIdType('node-123-abc')).toBe('node');
    });

    it('correctly parses dataset IDs', () => {
      expect(parseIdType('dataset-123456')).toBe('dataset');
      expect(parseIdType('dataset-123-abc')).toBe('dataset');
    });

    it('correctly parses connection IDs', () => {
      // Connection IDs contain both node- and dataset- (no conn- prefix)
      expect(parseIdType('node-1-dataset-2')).toBe('connection');
      expect(parseIdType('dataset-1-node-2')).toBe('connection');
    });

    it('returns null for invalid IDs', () => {
      expect(parseIdType('invalid')).toBe(null);
      expect(parseIdType('')).toBe(null);
      expect(parseIdType('NODE-123')).toBe(null); // case sensitive
    });
  });

  describe('ID Format Stability', () => {
    it('node IDs always start with node- prefix', () => {
      const ids = Array.from({ length: 10 }, () => generateNodeId());
      ids.forEach((id) => expect(id.startsWith('node-')).toBe(true));
    });

    it('dataset IDs always start with dataset- prefix', () => {
      const ids = Array.from({ length: 10 }, () => generateDatasetId());
      ids.forEach((id) => expect(id.startsWith('dataset-')).toBe(true));
    });

    it('connection ID format is stable', () => {
      const id = generateConnectionId('node-1704067200000', 'dataset-1704067200001');
      // No conn- prefix for localStorage compatibility
      expect(id).toBe('node-1704067200000-dataset-1704067200001');
    });

    it('generated IDs are compatible with existing type guards', () => {
      // Old timestamp-based IDs should still be recognized
      expect(isNodeId('node-1704067200000')).toBe(true);
      expect(isDatasetId('dataset-1704067200000')).toBe(true);
      // New UUID-based IDs should also be recognized
      expect(isNodeId(generateNodeId())).toBe(true);
      expect(isDatasetId(generateDatasetId())).toBe(true);
    });
  });
});
