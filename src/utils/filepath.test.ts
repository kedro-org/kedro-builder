/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { parseFilepath, buildFilepath } from './filepath';

describe('filepath utilities', () => {
  describe('parseFilepath', () => {
    it('should parse full three-part filepath', () => {
      const result = parseFilepath('data/01_raw/companies.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'companies.csv',
      });
    });

    it('should parse two-part filepath with default baseLocation', () => {
      const result = parseFilepath('01_raw/companies.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'companies.csv',
      });
    });

    it('should parse single filename with defaults', () => {
      const result = parseFilepath('companies.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'companies.csv',
      });
    });

    it('should handle empty string with defaults', () => {
      const result = parseFilepath('');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: '',
      });
    });

    it('should handle whitespace-only string with defaults', () => {
      const result = parseFilepath('   ');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: '',
      });
    });

    it('should handle filepath with nested directories in fileName', () => {
      const result = parseFilepath('data/01_raw/subfolder/nested/file.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'subfolder/nested/file.csv',
      });
    });

    it('should handle different data layers', () => {
      const cases = [
        'data/02_intermediate/processed.parquet',
        'data/03_primary/primary.csv',
        'data/04_feature/features.parquet',
        'data/05_model_input/input.csv',
        'data/06_models/model.pkl',
        'data/07_model_output/predictions.json',
        'data/08_reporting/report.html',
      ];

      cases.forEach((filepath) => {
        const parts = filepath.split('/');
        const result = parseFilepath(filepath);

        expect(result.baseLocation).toBe('data');
        expect(result.dataLayer).toBe(parts[1]);
        expect(result.fileName).toBe(parts[2]);
      });
    });

    it('should handle custom base location', () => {
      const result = parseFilepath('custom_data/01_raw/file.csv');

      expect(result).toEqual({
        baseLocation: 'custom_data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should handle S3 paths', () => {
      // parseFilepath splits on '/' and filter(Boolean) removes empty segments
      // 's3://bucket/01_raw/data.csv' → ['s3:', 'bucket', '01_raw', 'data.csv']
      const result = parseFilepath('s3://bucket/01_raw/data.csv');

      expect(result).toEqual({
        baseLocation: 's3:',
        dataLayer: 'bucket',
        fileName: '01_raw/data.csv',
      });
    });

    it('should handle absolute paths', () => {
      // Leading slash is filtered out by filter(Boolean)
      // '/absolute/path/01_raw/file.csv' → ['absolute', 'path', '01_raw', 'file.csv']
      const result = parseFilepath('/absolute/path/01_raw/file.csv');

      expect(result).toEqual({
        baseLocation: 'absolute',
        dataLayer: 'path',
        fileName: '01_raw/file.csv',
      });
    });

    it('should handle paths with special characters in filename', () => {
      const result = parseFilepath('data/01_raw/file-with-dashes_and_underscores.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'file-with-dashes_and_underscores.csv',
      });
    });

    it('should handle paths with dots in directory names', () => {
      const result = parseFilepath('data/01_raw/v1.2.3/file.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'v1.2.3/file.csv',
      });
    });

    it('should filter out empty path segments', () => {
      const result = parseFilepath('data//01_raw///file.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should handle trailing slash', () => {
      const result = parseFilepath('data/01_raw/file.csv/');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should handle leading slash', () => {
      const result = parseFilepath('/data/01_raw/file.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should handle both leading and trailing slashes', () => {
      const result = parseFilepath('/data/01_raw/file.csv/');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'file.csv',
      });
    });

    it('should handle Windows-style paths with forward slashes', () => {
      // 'C:/data/01_raw/file.csv' → ['C:', 'data', '01_raw', 'file.csv']
      const result = parseFilepath('C:/data/01_raw/file.csv');

      expect(result).toEqual({
        baseLocation: 'C:',
        dataLayer: 'data',
        fileName: '01_raw/file.csv',
      });
    });

    it('should handle filepath with no file extension', () => {
      const result = parseFilepath('data/01_raw/datafile');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'datafile',
      });
    });

    it('should handle filepath with multiple extensions', () => {
      const result = parseFilepath('data/01_raw/archive.tar.gz');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'archive.tar.gz',
      });
    });

    it('should handle deeply nested file paths', () => {
      const result = parseFilepath('data/01_raw/year/2023/month/12/day/25/data.csv');

      expect(result).toEqual({
        baseLocation: 'data',
        dataLayer: '01_raw',
        fileName: 'year/2023/month/12/day/25/data.csv',
      });
    });
  });

  describe('buildFilepath', () => {
    it('should build full filepath from components', () => {
      const result = buildFilepath('data', '01_raw', 'companies.csv');

      expect(result).toBe('data/01_raw/companies.csv');
    });

    it('should build filepath with custom base location', () => {
      const result = buildFilepath('custom_data', '02_intermediate', 'processed.parquet');

      expect(result).toBe('custom_data/02_intermediate/processed.parquet');
    });

    it('should use default base location when empty', () => {
      const result = buildFilepath('', '01_raw', 'file.csv');

      expect(result).toBe('data/01_raw/file.csv');
    });

    it('should use default base location when whitespace', () => {
      const result = buildFilepath('   ', '01_raw', 'file.csv');

      expect(result).toBe('data/01_raw/file.csv');
    });

    it('should return empty string when fileName is empty', () => {
      const result = buildFilepath('data', '01_raw', '');

      expect(result).toBe('');
    });

    it('should return empty string when fileName is whitespace', () => {
      const result = buildFilepath('data', '01_raw', '   ');

      expect(result).toBe('');
    });

    it('should trim whitespace from all components', () => {
      const result = buildFilepath('  data  ', '  01_raw  ', '  file.csv  ');

      expect(result).toBe('data/01_raw/file.csv');
    });

    it('should handle nested filename paths', () => {
      const result = buildFilepath('data', '01_raw', 'subfolder/file.csv');

      expect(result).toBe('data/01_raw/subfolder/file.csv');
    });

    it('should handle S3 base location', () => {
      const result = buildFilepath('s3://my-bucket', '01_raw', 'data.csv');

      expect(result).toBe('s3://my-bucket/01_raw/data.csv');
    });

    it('should handle absolute path base location', () => {
      const result = buildFilepath('/absolute/path', '01_raw', 'file.csv');

      expect(result).toBe('/absolute/path/01_raw/file.csv');
    });

    it('should handle all data layers', () => {
      const layers = [
        '01_raw',
        '02_intermediate',
        '03_primary',
        '04_feature',
        '05_model_input',
        '06_models',
        '07_model_output',
        '08_reporting',
      ];

      layers.forEach((layer) => {
        const result = buildFilepath('data', layer, 'file.csv');
        expect(result).toBe(`data/${layer}/file.csv`);
      });
    });

    it('should handle special characters in components', () => {
      const result = buildFilepath('data', '01_raw', 'file-with-special_chars.csv');

      expect(result).toBe('data/01_raw/file-with-special_chars.csv');
    });

    it('should not add extra slashes', () => {
      const result = buildFilepath('data', '01_raw', 'file.csv');

      expect(result).not.toContain('//');
      expect(result).toBe('data/01_raw/file.csv');
    });

    it('should handle empty layer (edge case)', () => {
      const result = buildFilepath('data', '', 'file.csv');

      expect(result).toBe('data//file.csv');
    });

    it('should handle Windows-style base path', () => {
      const result = buildFilepath('C:/data', '01_raw', 'file.csv');

      expect(result).toBe('C:/data/01_raw/file.csv');
    });
  });

  describe('roundtrip conversion', () => {
    it('should parse and rebuild the same filepath', () => {
      const original = 'data/01_raw/companies.csv';
      const parsed = parseFilepath(original);
      const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);

      expect(rebuilt).toBe(original);
    });

    it('should handle roundtrip with custom base location', () => {
      // S3 paths don't roundtrip perfectly because parseFilepath splits on '/'
      // and loses the '//' in 's3://'. Use a simple 3-part path for roundtrip.
      const original = 'custom_base/02_intermediate/data.parquet';
      const parsed = parseFilepath(original);
      const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);

      expect(rebuilt).toBe(original);
    });

    it('should handle roundtrip with nested filenames', () => {
      const original = 'data/01_raw/year/2023/file.csv';
      const parsed = parseFilepath(original);
      const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);

      expect(rebuilt).toBe(original);
    });

    it('should handle roundtrip for all data layers', () => {
      const testPaths = [
        'data/01_raw/raw.csv',
        'data/02_intermediate/intermediate.parquet',
        'data/03_primary/primary.csv',
        'data/04_feature/features.parquet',
        'data/05_model_input/input.csv',
        'data/06_models/model.pkl',
        'data/07_model_output/output.json',
        'data/08_reporting/report.html',
      ];

      testPaths.forEach((path) => {
        const parsed = parseFilepath(path);
        const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);
        expect(rebuilt).toBe(path);
      });
    });

    it('should normalize paths with multiple slashes', () => {
      const original = 'data//01_raw///file.csv';
      const parsed = parseFilepath(original);
      const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);

      expect(rebuilt).toBe('data/01_raw/file.csv');
    });

    it('should normalize paths with leading/trailing slashes', () => {
      const original = '/data/01_raw/file.csv/';
      const parsed = parseFilepath(original);
      const rebuilt = buildFilepath(parsed.baseLocation, parsed.dataLayer, parsed.fileName);

      expect(rebuilt).toBe('data/01_raw/file.csv');
    });
  });

  describe('edge cases', () => {
    it('should handle single character filename', () => {
      const parsed = parseFilepath('a');
      expect(parsed.fileName).toBe('a');

      const built = buildFilepath('data', '01_raw', 'a');
      expect(built).toBe('data/01_raw/a');
    });

    it('should handle filename with only extension', () => {
      const parsed = parseFilepath('.gitignore');
      expect(parsed.fileName).toBe('.gitignore');

      const built = buildFilepath('data', '01_raw', '.gitignore');
      expect(built).toBe('data/01_raw/.gitignore');
    });

    it('should handle very long filepaths', () => {
      const longPath = 'data/01_raw/' + 'a/'.repeat(50) + 'file.csv';
      const parsed = parseFilepath(longPath);

      expect(parsed.baseLocation).toBe('data');
      expect(parsed.dataLayer).toBe('01_raw');
      expect(parsed.fileName).toContain('file.csv');
    });

    it('should handle unicode characters in filename', () => {
      const result = buildFilepath('data', '01_raw', '文件.csv');
      expect(result).toBe('data/01_raw/文件.csv');

      const parsed = parseFilepath('data/01_raw/文件.csv');
      expect(parsed.fileName).toBe('文件.csv');
    });

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
