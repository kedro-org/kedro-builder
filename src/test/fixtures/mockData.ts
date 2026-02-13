import type {
  KedroNode,
  KedroDataset,
  KedroConnection,
  NodeType,
  DatasetType,
  DataLayer,
} from '../../types/kedro';
import type { ValidationError } from '../../utils/validation/types';

// Mock Nodes
export const mockNode1: KedroNode = {
  id: 'node-1',
  name: 'load_data',
  type: 'data_ingestion' as NodeType,
  inputs: ['raw_data'],
  outputs: ['processed_data'],
  functionCode: `def load_data(raw_data: pd.DataFrame) -> pd.DataFrame:
    """Load and clean raw data."""
    return raw_data.dropna()`,
  description: 'Load and clean raw data',
  position: { x: 100, y: 100 },
};

export const mockNode2: KedroNode = {
  id: 'node-2',
  name: 'train_model',
  type: 'model_training' as NodeType,
  inputs: ['processed_data', 'parameters'],
  outputs: ['trained_model'],
  functionCode: `def train_model(processed_data: pd.DataFrame, parameters: Dict) -> Any:
    """Train machine learning model."""
    model = SomeModel(**parameters)
    model.fit(processed_data)
    return model`,
  description: 'Train machine learning model',
  parameters: { learning_rate: 0.01, epochs: 100 },
  position: { x: 400, y: 100 },
};

export const mockNode3: KedroNode = {
  id: 'node-3',
  name: 'evaluate_model',
  type: 'model_evaluation' as NodeType,
  inputs: ['trained_model', 'test_data'],
  outputs: ['metrics'],
  functionCode: `def evaluate_model(trained_model: Any, test_data: pd.DataFrame) -> Dict:
    """Evaluate model performance."""
    predictions = trained_model.predict(test_data)
    return {"accuracy": 0.95}`,
  description: 'Evaluate model performance',
  position: { x: 700, y: 100 },
};

// Mock Datasets
export const mockDataset1: KedroDataset = {
  id: 'dataset-1',
  name: 'raw_data',
  type: 'csv' as DatasetType,
  filepath: 'data/01_raw/raw_data.csv',
  layer: '01_raw' as DataLayer,
  description: 'Raw input data',
  versioned: false,
  position: { x: 0, y: 100 },
};

export const mockDataset2: KedroDataset = {
  id: 'dataset-2',
  name: 'processed_data',
  type: 'parquet' as DatasetType,
  filepath: 'data/02_intermediate/processed_data.parquet',
  layer: '02_intermediate' as DataLayer,
  description: 'Cleaned and processed data',
  versioned: true,
  position: { x: 250, y: 100 },
};

export const mockDataset3: KedroDataset = {
  id: 'dataset-3',
  name: 'parameters',
  type: 'yaml' as DatasetType,
  filepath: 'data/05_model_input/parameters.yml',
  layer: '05_model_input' as DataLayer,
  description: 'Model training parameters',
  position: { x: 250, y: 200 },
};

export const mockDataset4: KedroDataset = {
  id: 'dataset-4',
  name: 'trained_model',
  type: 'pickle' as DatasetType,
  filepath: 'data/06_models/trained_model.pkl',
  layer: '06_models' as DataLayer,
  description: 'Trained ML model',
  versioned: true,
  position: { x: 550, y: 100 },
};

export const mockDataset5: KedroDataset = {
  id: 'dataset-5',
  name: 'test_data',
  type: 'csv' as DatasetType,
  filepath: 'data/01_raw/test_data.csv',
  layer: '01_raw' as DataLayer,
  description: 'Test dataset',
  position: { x: 550, y: 200 },
};

export const mockDataset6: KedroDataset = {
  id: 'dataset-6',
  name: 'metrics',
  type: 'json' as DatasetType,
  filepath: 'data/08_reporting/metrics.json',
  layer: '08_reporting' as DataLayer,
  description: 'Model evaluation metrics',
  position: { x: 850, y: 100 },
};

export const mockDatasetMemory: KedroDataset = {
  id: 'dataset-memory',
  name: 'temp_data',
  type: 'memory' as DatasetType,
  description: 'Temporary in-memory dataset',
  position: { x: 300, y: 300 },
};

export const mockDatasetWithConfig: KedroDataset = {
  id: 'dataset-config',
  name: 'custom_data',
  type: 'sql_table' as DatasetType,
  layer: '02_intermediate' as DataLayer,
  description: 'SQL table dataset',
  catalogConfig: {
    table_name: 'my_table',
    credentials: 'db_credentials',
  },
  versioned: false,
  position: { x: 400, y: 300 },
};

// Mock Connections
export const mockConnection1: KedroConnection = {
  id: 'connection-1',
  source: 'dataset-1',
  target: 'node-1',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'raw_data',
};

export const mockConnection2: KedroConnection = {
  id: 'connection-2',
  source: 'node-1',
  target: 'dataset-2',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'processed_data',
};

export const mockConnection3: KedroConnection = {
  id: 'connection-3',
  source: 'dataset-2',
  target: 'node-2',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'processed_data',
};

export const mockConnection4: KedroConnection = {
  id: 'connection-4',
  source: 'dataset-3',
  target: 'node-2',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'parameters',
};

export const mockConnection5: KedroConnection = {
  id: 'connection-5',
  source: 'node-2',
  target: 'dataset-4',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'trained_model',
};

export const mockConnection6: KedroConnection = {
  id: 'connection-6',
  source: 'dataset-4',
  target: 'node-3',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'trained_model',
};

export const mockConnection7: KedroConnection = {
  id: 'connection-7',
  source: 'dataset-5',
  target: 'node-3',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'test_data',
};

export const mockConnection8: KedroConnection = {
  id: 'connection-8',
  source: 'node-3',
  target: 'dataset-6',
  sourceHandle: 'output',
  targetHandle: 'input',
  datasetName: 'metrics',
};

// Mock Validation Errors
export const mockValidationError1: ValidationError = {
  id: 'error-1',
  severity: 'error',
  componentId: 'node-1',
  componentType: 'node',
  field: 'name',
  message: 'Node name must be in snake_case',
  suggestion: 'Use "load_data" instead of "LoadData"',
};

export const mockValidationWarning1: ValidationError = {
  id: 'warning-1',
  severity: 'warning',
  componentId: 'dataset-1',
  componentType: 'dataset',
  message: 'Dataset is not versioned',
  suggestion: 'Consider enabling versioning for audit trails',
};

// Collections for easier testing
export const mockNodes = [mockNode1, mockNode2, mockNode3];
export const mockDatasets = [
  mockDataset1,
  mockDataset2,
  mockDataset3,
  mockDataset4,
  mockDataset5,
  mockDataset6,
  mockDatasetMemory,
  mockDatasetWithConfig,
];
export const mockConnections = [
  mockConnection1,
  mockConnection2,
  mockConnection3,
  mockConnection4,
  mockConnection5,
  mockConnection6,
  mockConnection7,
  mockConnection8,
];

// Helper function to create a complete mock pipeline
export function createMockPipeline() {
  return {
    nodes: mockNodes,
    datasets: mockDatasets.slice(0, 6), // Exclude memory and config datasets
    connections: mockConnections,
  };
}

// Helper function to create a minimal pipeline
export function createMinimalPipeline() {
  return {
    nodes: [mockNode1],
    datasets: [mockDataset1, mockDataset2],
    connections: [mockConnection1, mockConnection2],
  };
}
