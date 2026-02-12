/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { parseFilepath, buildFilepath } from './filepath';

describe('filepath utilities', () => {
  describe('parseFilepath', () => {
    it('should parse full three-part filepath', () => {
      expect(parseFilepath('data/01_raw/companies.csv')).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'companies.csv',
      });
    });

    it('should parse two-part filepath with default baseLocation', () => {
      expect(parseFilepath('01_raw/companies.csv')).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'companies.csv',
      });
    });

    it('should parse single filename with defaults', () => {
      expect(parseFilepath('companies.csv')).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'companies.csv',
      });
    });

    it('should handle empty string with defaults', () => {
      expect(parseFilepath('')).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: '',
      });
    });

    it('should handle nested directories in fileName', () => {
      expect(parseFilepath('data/01_raw/subfolder/nested/file.csv')).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'subfolder/nested/file.csv',
      });
    });

    it('should handle different data layers', () => {
      const layers = ['02_intermediate', '03_primary', '04_feature', '05_model_input', '06_models', '07_model_output', '08_reporting'];
      layers.forEach((layer) => {
        const result = parseFilepath(`data/${layer}/file.csv`);
        expect(result.dataLayer).toBe(layer);
      });
    });

    it('should handle custom base location', () => {
      expect(parseFilepath('custom_data/01_raw/file.csv')).toEqual({
        baseLocation: 'custom_data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should filter out empty path segments (double slashes)', () => {
      expect(parseFilepath('data//01_raw///file.csv')).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should handle leading and trailing slashes', () => {
      expect(parseFilepath('/data/01_raw/file.csv/')).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should handle special characters in filename', () => {
      expect(parseFilepath('data/01_raw/file-with-dashes_and_underscores.csv').fileName)
        .toBe('file-with-dashes_and_underscores.csv');
    });

    it('should handle filepath with no file extension', () => {
      expect(parseFilepath('data/01_raw/datafile').fileName).toBe('datafile');
    });

    it('should handle filepath with multiple extensions', () => {
      expect(parseFilepath('data/01_raw/archive.tar.gz').fileName).toBe('archive.tar.gz');
    });
  });

  describe('buildFilepath', () => {
    it('should build full filepath from components', () => {
      expect(buildFilepath('data', '01_raw', 'companies.csv')).toBe('data/01_raw/companies.csv');
    });

    it('should use default base location when empty', () => {
      expect(buildFilepath('', '01_raw', 'file.csv')).toBe('data/01_raw/file.csv');
    });

    it('should use default base location when whitespace', () => {
      expect(buildFilepath('   ', '01_raw', 'file.csv')).toBe('data/01_raw/file.csv');
    });

    it('should return empty string when fileName is empty', () => {
      expect(buildFilepath('data', '01_raw', '')).toBe('');
    });

    it('should return empty string when fileName is whitespace', () => {
      expect(buildFilepath('data', '01_raw', '   ')).toBe('');
    });

    it('should trim whitespace from all components', () => {
      expect(buildFilepath('  data  ', '  01_raw  ', '  file.csv  ')).toBe('data/01_raw/file.csv');
    });

    it('should handle nested filename paths', () => {
      expect(buildFilepath('data', '01_raw', 'subfolder/file.csv')).toBe('data/01_raw/subfolder/file.csv');
    });

    it('should handle all data layers', () => {
      const layers = ['01_raw', '02_intermediate', '03_primary', '04_feature', '05_model_input', '06_models', '07_model_output', '08_reporting'];
      layers.forEach((layer) => {
        expect(buildFilepath('data', layer, 'file.csv')).toBe(`data/${layer}/file.csv`);
      });
    });
  });

  describe('roundtrip conversion', () => {
    it('should parse and rebuild standard filepaths', () => {
      const paths = [
        'data/01_raw/companies.csv',
        'data/02_intermediate/processed.parquet',
        'data/06_models/model.pkl',
        'data/01_raw/year/2023/file.csv',
        'custom_base/02_intermediate/data.parquet',
      ];

      paths.forEach((path) => {
        const parsed = parseFilepath(path);
        const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);
        expect(rebuilt).toBe(path);
      });
    });

    it('should normalize paths with multiple or leading/trailing slashes', () => {
      const parsed = parseFilepath('data//01_raw///file.csv');
      const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);
      expect(rebuilt).toBe('data/01_raw/file.csv');
    });
  });

  describe('edge cases', () => {
    it('should handle spaces in path components', () => {
      const result = buildFilepath('my data', '01 raw', 'my file.csv');
      expect(result).toBe('my data/01 raw/my file.csv');

      const parsed = parseFilepath('my data/01 raw/my file.csv');
      expect(parsed.baseLocation).toBe('my data');
      expect(parsed.dataLayer).toBe('01 raw');
      expect(parsed.fileName).toBe('my file.csv');
    });
  });
});
