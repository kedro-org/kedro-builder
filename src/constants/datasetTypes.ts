import type { DatasetType } from '../types/kedro';

/**
 * Comprehensive list of dataset types from kedro-datasets 3.0+
 * Organized by category for better UX in dropdowns
 */
export const DATASET_TYPES: { value: DatasetType; label: string; category: string }[] = [
  // Pandas datasets (most common)
  { value: 'csv', label: 'CSV', category: 'Pandas' },
  { value: 'parquet', label: 'Parquet', category: 'Pandas' },
  { value: 'json', label: 'JSON', category: 'Pandas' },
  { value: 'excel', label: 'Excel (XLSX/XLS)', category: 'Pandas' },
  { value: 'feather', label: 'Feather', category: 'Pandas' },
  { value: 'hdf', label: 'HDF5', category: 'Pandas' },
  { value: 'sql_table', label: 'SQL Table', category: 'Pandas' },
  { value: 'sql_query', label: 'SQL Query', category: 'Pandas' },
  { value: 'gbq_table', label: 'Google BigQuery Table', category: 'Pandas' },
  { value: 'gbq_query', label: 'Google BigQuery Query', category: 'Pandas' },

  // Spark datasets
  { value: 'spark_dataframe', label: 'Spark DataFrame', category: 'Spark' },
  { value: 'spark_hive', label: 'Spark Hive Table', category: 'Spark' },
  { value: 'spark_jdbc', label: 'Spark JDBC', category: 'Spark' },

  // Delta Lake
  { value: 'delta_table', label: 'Delta Table', category: 'Delta Lake' },

  // Polars datasets (modern alternative to pandas)
  { value: 'polars_csv', label: 'Polars CSV', category: 'Polars' },
  { value: 'polars_parquet', label: 'Polars Parquet', category: 'Polars' },
  { value: 'polars_lazy', label: 'Polars LazyFrame', category: 'Polars' },

  // Dask datasets (parallel computing)
  { value: 'dask_parquet', label: 'Dask Parquet', category: 'Dask' },
  { value: 'dask_csv', label: 'Dask CSV', category: 'Dask' },

  // Pickle datasets
  { value: 'pickle', label: 'Pickle (Binary)', category: 'Serialization' },

  // Text datasets
  { value: 'text', label: 'Text File', category: 'Text' },
  { value: 'yaml', label: 'YAML', category: 'Text' },
  { value: 'xml', label: 'XML', category: 'Text' },

  // Image & Visualization
  { value: 'image', label: 'Image (PNG/JPG/etc)', category: 'Image & Video' },
  { value: 'matplotlib', label: 'Matplotlib Figure', category: 'Image & Video' },
  { value: 'plotly_json', label: 'Plotly JSON', category: 'Image & Video' },
  { value: 'video', label: 'Video', category: 'Image & Video' },
  { value: 'holoviews', label: 'Holoviews', category: 'Image & Video' },

  // Graph/Network datasets
  { value: 'networkx_json', label: 'NetworkX JSON', category: 'Graph' },
  { value: 'networkx_gml', label: 'NetworkX GML', category: 'Graph' },
  { value: 'networkx_graphml', label: 'NetworkX GraphML', category: 'Graph' },

  // Geospatial
  { value: 'geojson', label: 'GeoJSON', category: 'Geospatial' },

  // Machine Learning Models
  { value: 'tensorflow', label: 'TensorFlow Model', category: 'ML Models' },
  { value: 'pytorch', label: 'PyTorch Model', category: 'ML Models' },
  { value: 'huggingface_dataset', label: 'Hugging Face Dataset', category: 'ML Models' },
  { value: 'huggingface_model', label: 'Hugging Face Model', category: 'ML Models' },

  // Specialized formats
  { value: 'api', label: 'API Dataset', category: 'API & Cloud' },
  { value: 'tracking', label: 'Tracking Dataset', category: 'API & Cloud' },
  { value: 'biosequence', label: 'Bio Sequence (BioPython)', category: 'Scientific' },
  { value: 'matlab', label: 'MATLAB (.mat)', category: 'Scientific' },
  { value: 'ibis_table', label: 'Ibis Table', category: 'Database' },

  // Memory (no file)
  { value: 'memory', label: 'Memory (In-Memory)', category: 'Memory' },
];

/**
 * Group dataset types by category for organized display
 */
export const groupDatasetTypesByCategory = (): Record<string, typeof DATASET_TYPES> => {
  return DATASET_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof DATASET_TYPES>);
};
