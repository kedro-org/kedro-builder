/**
 * Helper utilities for Kedro project export
 */

/**
 * Convert string to snake_case for Python naming conventions
 */
export function toSnakeCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '')
    .replace(/__+/g, '_')
    .toLowerCase();
}

/**
 * Python reserved keywords - cannot be used as identifiers
 */
const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
];

/**
 * Validate if a name is a valid Python identifier
 */
export function isValidPythonIdentifier(name: string): boolean {
  const identifier = toSnakeCase(name);

  // Must start with letter or underscore
  if (!/^[a-z_]/.test(identifier)) {
    return false;
  }

  // Can only contain letters, numbers, and underscores
  if (!/^[a-z0-9_]+$/.test(identifier)) {
    return false;
  }

  // Cannot be a Python keyword
  if (PYTHON_KEYWORDS.includes(identifier)) {
    return false;
  }

  return true;
}

/**
 * Infer Kedro data layer from dataset name or type
 */
export function inferDataLayer(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('raw')) return '01_raw';
  if (lowerName.includes('intermediate') || lowerName.includes('interim')) return '02_intermediate';
  if (lowerName.includes('primary') || lowerName.includes('master')) return '03_primary';
  if (lowerName.includes('feature')) return '04_feature';
  if (lowerName.includes('model_input') || lowerName.includes('model-input')) return '05_model_input';
  if (lowerName.includes('model') && !lowerName.includes('input')) return '06_models';
  if (lowerName.includes('model_output') || lowerName.includes('prediction')) return '07_model_output';
  if (lowerName.includes('report') || lowerName.includes('metric')) return '08_reporting';

  // Default to raw if cannot infer
  return '01_raw';
}

/**
 * Get file extension for dataset type
 */
export function getFileExtension(datasetType: string): string {
  const typeMap: Record<string, string> = {
    'pandas.CSVDataset': '.csv',
    'pandas.ParquetDataset': '.parquet',
    'pandas.ExcelDataset': '.xlsx',
    'pandas.JSONDataset': '.json',
    'pandas.PickleDataset': '.pkl',
    'pandas.FeatherDataset': '.feather',
    'pandas.HDFDataset': '.h5',
    'pandas.SQLTableDataset': '',
    'pandas.SQLQueryDataset': '',
    'pickle.PickleDataset': '.pkl',
    'json.JSONDataset': '.json',
    'yaml.YAMLDataset': '.yml',
    'text.TextDataset': '.txt',
  };

  return typeMap[datasetType] || '.csv';
}

/**
 * Format Python function parameters with type hints
 */
export function formatFunctionParams(
  params: string[],
  typeHint: string = 'pd.DataFrame'
): string {
  if (params.length === 0) return '';
  return params.map((p) => `${toSnakeCase(p)}: ${typeHint}`).join(', ');
}

/**
 * Format Python docstring parameters
 */
export function formatDocstringParams(params: string[], indent: string = '        '): string {
  if (params.length === 0) return '';
  return params
    .map((p) => `${indent}${toSnakeCase(p)}: Input ${p}`)
    .join('\n');
}

/**
 * Format inputs for Kedro node definition
 * Single input: "input_name"
 * Multiple inputs: ["input1", "input2"]
 * No inputs: None
 */
export function formatNodeInputs(inputs: string[]): string {
  if (inputs.length === 0) return 'None';
  if (inputs.length === 1) return `"${inputs[0]}"`;
  return `[${inputs.map((i) => `"${i}"`).join(', ')}]`;
}

/**
 * Format outputs for Kedro node definition
 * Single output: "output_name"
 * Multiple outputs: ["output1", "output2"]
 * No outputs: None
 */
export function formatNodeOutputs(outputs: string[]): string {
  if (outputs.length === 0) return 'None';
  if (outputs.length === 1) return `"${outputs[0]}"`;
  return `[${outputs.map((o) => `"${o}"`).join(', ')}]`;
}

/**
 * Indent Python code block
 */
export function indentCode(code: string, spaces: number = 4): string {
  const indent = ' '.repeat(spaces);
  return code
    .split('\n')
    .map((line) => (line.trim() ? indent + line : line))
    .join('\n');
}

/**
 * Escape special characters in YAML strings
 */
export function escapeYamlString(str: string): string {
  if (/[:#\[\]{}|>@`]/.test(str) || str.includes('\n')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}
