/**
 * Core Kedro Builder type definitions
 * These types represent the domain model for Kedro pipelines
 */

export type NodeType =
  | 'data_ingestion'
  | 'data_processing'
  | 'model_training'
  | 'model_evaluation'
  | 'custom';

export type DatasetType =
  // Pandas datasets
  | 'csv'
  | 'parquet'
  | 'json'
  | 'excel'
  | 'feather'
  | 'hdf'
  | 'sql_table'
  | 'sql_query'
  | 'gbq_table'
  | 'gbq_query'
  // Spark datasets
  | 'spark_dataframe'
  | 'spark_hive'
  | 'spark_jdbc'
  // Delta Lake
  | 'delta_table'
  // Pickle datasets
  | 'pickle'
  // Text datasets
  | 'text'
  | 'yaml'
  // Image datasets
  | 'image'
  | 'matplotlib'
  // NetworkX datasets
  | 'networkx_json'
  | 'networkx_gml'
  | 'networkx_graphml'
  // Plotly datasets
  | 'plotly_json'
  // API datasets
  | 'api'
  // Tracking datasets
  | 'tracking'
  // Video datasets
  | 'video'
  // Polars datasets
  | 'polars_csv'
  | 'polars_parquet'
  | 'polars_lazy'
  // Dask datasets
  | 'dask_parquet'
  | 'dask_csv'
  // GeoJSON/Shapefile
  | 'geojson'
  // BioPython
  | 'biosequence'
  // TensorFlow/PyTorch
  | 'tensorflow'
  | 'pytorch'
  // Hugging Face
  | 'huggingface_dataset'
  | 'huggingface_model'
  // MATLAB
  | 'matlab'
  // XML
  | 'xml'
  // Holoviews
  | 'holoviews'
  // Ibis
  | 'ibis_table'
  // Memory (In-Memory)
  | 'memory';

export type DataLayer =
  | '01_raw'
  | '02_intermediate'
  | '03_primary'
  | '04_feature'
  | '05_model_input'
  | '06_models'
  | '07_model_output'
  | '08_reporting';

export interface KedroProject {
  id: string;
  name: string;
  description: string;
  pythonPackage: string;
  pipelineName: string;
  createdAt: number;
  updatedAt: number;
}

export interface KedroNode {
  id: string;
  name: string;
  type: NodeType;
  inputs: string[];
  outputs: string[];
  functionCode?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  position: { x: number; y: number };
  [key: string]: unknown;
}

export interface KedroDataset {
  id: string;
  name: string;
  type: DatasetType;
  filepath?: string;
  layer?: DataLayer;
  catalogConfig?: Record<string, unknown>;
  description?: string;
  versioned?: boolean;
  position: { x: number; y: number };
  [key: string]: unknown;
}

export interface KedroConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  datasetName?: string;
  [key: string]: unknown;
}

export interface ValidationError {
  id: string;
  severity: 'error' | 'warning';
  componentId: string;
  componentType: 'node' | 'dataset' | 'connection' | 'pipeline';
  field?: string;
  message: string;
  suggestion?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
  storageType: 'localStorage' | 'indexedDB';
}
