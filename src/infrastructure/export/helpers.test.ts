/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  toSnakeCase,
  isValidPythonIdentifier,
  inferDataLayer,
  getFileExtension,
  formatFunctionParams,
  formatDocstringParams,
  formatNodeInputs,
  formatNodeOutputs,
  indentCode,
  escapeYamlString,
} from './helpers';

describe('helpers', () => {
  describe('toSnakeCase', () => {
    it('should convert CamelCase to snake_case', () => {
      expect(toSnakeCase('MyFunction')).toBe('my_function');
      expect(toSnakeCase('ProcessData')).toBe('process_data');
      expect(toSnakeCase('XMLParser')).toBe('x_m_l_parser');
    });

    it('should convert spaces to underscores', () => {
      expect(toSnakeCase('My Function Name')).toBe('my_function_name');
      expect(toSnakeCase('Process   Multiple   Spaces')).toBe('process_multiple_spaces');
    });

    it('should handle already snake_case strings', () => {
      expect(toSnakeCase('already_snake_case')).toBe('already_snake_case');
      expect(toSnakeCase('process_data')).toBe('process_data');
    });

    it('should remove leading/trailing whitespace', () => {
      expect(toSnakeCase('  trimmed  ')).toBe('trimmed');
    });

    it('should handle leading underscores', () => {
      expect(toSnakeCase('_simple')).toBe('simple');
    });

    it('should collapse multiple underscores', () => {
      expect(toSnakeCase('multiple___underscores')).toBe('multiple_underscores');
    });
  });

  describe('isValidPythonIdentifier', () => {
    it('should accept valid Python identifiers', () => {
      expect(isValidPythonIdentifier('my_function')).toBe(true);
      expect(isValidPythonIdentifier('process_data')).toBe(true);
      expect(isValidPythonIdentifier('func123')).toBe(true);
    });

    it('should reject Python reserved keywords', () => {
      expect(isValidPythonIdentifier('for')).toBe(false);
      expect(isValidPythonIdentifier('class')).toBe(false);
      expect(isValidPythonIdentifier('return')).toBe(false);
      expect(isValidPythonIdentifier('import')).toBe(false);
    });

    it('should reject identifiers starting with numbers', () => {
      expect(isValidPythonIdentifier('123func')).toBe(false);
    });

    it('should accept names that convert to valid identifiers', () => {
      expect(isValidPythonIdentifier('My Function')).toBe(true); // Converts to my_function
      expect(isValidPythonIdentifier('ProcessData')).toBe(true); // Converts to process_data
    });
  });

  describe('inferDataLayer', () => {
    it('should infer 01_raw for raw data', () => {
      expect(inferDataLayer('raw_data')).toBe('01_raw');
      expect(inferDataLayer('Raw Sales')).toBe('01_raw');
    });

    it('should infer 02_intermediate', () => {
      expect(inferDataLayer('intermediate_data')).toBe('02_intermediate');
      expect(inferDataLayer('interim_results')).toBe('02_intermediate');
    });

    it('should infer 04_feature', () => {
      expect(inferDataLayer('feature_data')).toBe('04_feature');
      expect(inferDataLayer('customer_features')).toBe('04_feature');
    });

    it('should infer 06_models', () => {
      expect(inferDataLayer('trained_model')).toBe('06_models');
      expect(inferDataLayer('my_model')).toBe('06_models');
    });

    it('should infer 08_reporting', () => {
      expect(inferDataLayer('report_data')).toBe('08_reporting');
      expect(inferDataLayer('metrics_output')).toBe('08_reporting');
    });

    it('should default to 01_raw when cannot infer', () => {
      expect(inferDataLayer('some_data')).toBe('01_raw');
      expect(inferDataLayer('unknown')).toBe('01_raw');
    });

    it('should handle model_input vs model', () => {
      expect(inferDataLayer('model_input_data')).toBe('05_model_input');
      expect(inferDataLayer('my_model')).toBe('06_models');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extensions for common types', () => {
      expect(getFileExtension('pandas.CSVDataset')).toBe('.csv');
      expect(getFileExtension('pandas.ParquetDataset')).toBe('.parquet');
      expect(getFileExtension('pandas.PickleDataset')).toBe('.pkl');
      expect(getFileExtension('pandas.JSONDataset')).toBe('.json');
    });

    it('should handle SQL datasets', () => {
      // SQL datasets map to empty string in the type map
      expect(getFileExtension('pandas.SQLTableDataset')).toBe('.csv'); // fallback
      expect(getFileExtension('pandas.SQLQueryDataset')).toBe('.csv'); // fallback
    });

    it('should default to .csv for unknown types', () => {
      expect(getFileExtension('unknown.Dataset')).toBe('.csv');
    });
  });

  describe('formatFunctionParams', () => {
    it('should return empty string for no params', () => {
      expect(formatFunctionParams([])).toBe('');
    });

    it('should format single param', () => {
      expect(formatFunctionParams(['data'])).toBe('data: pd.DataFrame');
    });

    it('should format multiple params', () => {
      expect(formatFunctionParams(['data1', 'data2'])).toBe('data1: pd.DataFrame, data2: pd.DataFrame');
    });

    it('should convert param names to snake_case', () => {
      expect(formatFunctionParams(['MyData', 'ProcessedData'])).toBe('my_data: pd.DataFrame, processed_data: pd.DataFrame');
    });

    it('should use custom type hint', () => {
      expect(formatFunctionParams(['data'], 'Dict')).toBe('data: Dict');
    });
  });

  describe('formatDocstringParams', () => {
    it('should return empty string for no params', () => {
      expect(formatDocstringParams([])).toBe('');
    });

    it('should format single param with default indent', () => {
      const result = formatDocstringParams(['data']);
      expect(result).toContain('data: Input data');
      expect(result).toMatch(/^\s{8}data:/); // 8 spaces default
    });

    it('should format multiple params', () => {
      const result = formatDocstringParams(['input1', 'input2']);
      expect(result).toContain('input1: Input input1');
      expect(result).toContain('input2: Input input2');
      expect(result).toContain('\n');
    });

    it('should use custom indent', () => {
      const result = formatDocstringParams(['data'], '    ');
      expect(result).toMatch(/^\s{4}data:/); // 4 spaces custom
    });
  });

  describe('formatNodeInputs', () => {
    it('should return None for empty array', () => {
      expect(formatNodeInputs([])).toBe('None');
    });

    it('should return quoted string for single input', () => {
      expect(formatNodeInputs(['data'])).toBe('"data"');
    });

    it('should return array for multiple inputs', () => {
      expect(formatNodeInputs(['data1', 'data2'])).toBe('["data1", "data2"]');
      expect(formatNodeInputs(['a', 'b', 'c'])).toBe('["a", "b", "c"]');
    });
  });

  describe('formatNodeOutputs', () => {
    it('should return None for empty array', () => {
      expect(formatNodeOutputs([])).toBe('None');
    });

    it('should return quoted string for single output', () => {
      expect(formatNodeOutputs(['result'])).toBe('"result"');
    });

    it('should return array for multiple outputs', () => {
      expect(formatNodeOutputs(['out1', 'out2'])).toBe('["out1", "out2"]');
    });
  });

  describe('indentCode', () => {
    it('should indent single line with 4 spaces by default', () => {
      expect(indentCode('print("hello")')).toBe('    print("hello")');
    });

    it('should indent multiple lines', () => {
      const code = 'line1\nline2\nline3';
      const result = indentCode(code);
      expect(result).toBe('    line1\n    line2\n    line3');
    });

    it('should preserve empty lines', () => {
      const code = 'line1\n\nline3';
      const result = indentCode(code);
      expect(result).toBe('    line1\n\n    line3');
    });

    it('should use custom indent', () => {
      expect(indentCode('code', 2)).toBe('  code');
      expect(indentCode('code', 8)).toBe('        code');
    });

    it('should handle already indented code', () => {
      const code = '  already_indented';
      const result = indentCode(code, 4);
      // Adds indent to existing whitespace if line has content
      expect(result).toBe('      already_indented');
    });
  });

  describe('escapeYamlString', () => {
    it('should not quote simple strings', () => {
      expect(escapeYamlString('simple_string')).toBe('simple_string');
      expect(escapeYamlString('path/to/file.csv')).toBe('path/to/file.csv');
    });

    it('should quote strings with special YAML characters', () => {
      expect(escapeYamlString('path:with:colon')).toBe('"path:with:colon"');
      expect(escapeYamlString('value#comment')).toBe('"value#comment"');
      expect(escapeYamlString('s3://bucket/path')).toBe('"s3://bucket/path"');
      expect(escapeYamlString('value@symbol')).toBe('"value@symbol"');
    });

    it('should quote strings with newlines', () => {
      const result = escapeYamlString('line1\nline2');
      expect(result.startsWith('"')).toBe(true);
      expect(result.endsWith('"')).toBe(true);
      expect(result).toContain('line1');
    });

    it('should handle quotes in strings', () => {
      const result = escapeYamlString('path"with"quotes');
      // Quotes alone don't trigger YAML escaping, only special chars
      expect(result).toContain('path');
      expect(result).toContain('quotes');
    });

    it('should handle brackets and braces', () => {
      expect(escapeYamlString('value[0]')).toBe('"value[0]"');
      expect(escapeYamlString('dict{key}')).toBe('"dict{key}"');
    });
  });
});
