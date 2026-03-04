/**
 * Zod schemas for localStorage data validation
 * Provides runtime type safety when loading data from localStorage
 */

import { z } from 'zod';

// Position schema (used by nodes and datasets)
const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Node type - open string to allow any user-defined category
const NodeTypeSchema = z.string();

// Dataset type enum (comprehensive list)
const DatasetTypeSchema = z.enum([
  // Pandas datasets
  'csv', 'parquet', 'json', 'excel', 'feather', 'hdf',
  'sql_table', 'sql_query', 'gbq_table', 'gbq_query',
  // Spark datasets
  'spark_dataframe', 'spark_hive', 'spark_jdbc',
  // Delta Lake
  'delta_table',
  // Pickle datasets
  'pickle',
  // Text datasets
  'text', 'yaml',
  // Image datasets
  'image', 'matplotlib',
  // NetworkX datasets
  'networkx_json', 'networkx_gml', 'networkx_graphml',
  // Plotly datasets
  'plotly_json',
  // API datasets
  'api',
  // Tracking datasets
  'tracking',
  // Video datasets
  'video',
  // Polars datasets
  'polars_csv', 'polars_parquet', 'polars_lazy',
  // Dask datasets
  'dask_parquet', 'dask_csv',
  // GeoJSON/Shapefile
  'geojson',
  // BioPython
  'biosequence',
  // TensorFlow/PyTorch
  'tensorflow', 'pytorch',
  // Hugging Face
  'huggingface_dataset', 'huggingface_model',
  // MATLAB
  'matlab',
  // XML
  'xml',
  // Holoviews
  'holoviews',
  // Ibis
  'ibis_table',
  // Memory
  'memory',
]);

// Data layer enum
const DataLayerSchema = z.enum([
  '01_raw',
  '02_intermediate',
  '03_primary',
  '04_feature',
  '05_model_input',
  '06_models',
  '07_model_output',
  '08_reporting',
]);

// KedroProject schema
export const KedroProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  pythonPackage: z.string(),
  pipelineName: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// KedroNode schema
export const KedroNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: NodeTypeSchema,
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  functionCode: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  position: PositionSchema,
}).passthrough(); // Allow additional properties

// KedroDataset schema
export const KedroDatasetSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: DatasetTypeSchema,
  filepath: z.string().optional(),
  layer: DataLayerSchema.optional(),
  catalogConfig: z.record(z.string(), z.unknown()).optional(),
  versioned: z.boolean().optional(),
  position: PositionSchema,
}).passthrough(); // Allow additional properties

// KedroConnection schema
export const KedroConnectionSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string(),
  targetHandle: z.string(),
  datasetName: z.string().optional(),
}).passthrough(); // Allow additional properties

// StoredProjectState schema (the complete localStorage data structure)
export const StoredProjectStateSchema = z.object({
  project: KedroProjectSchema,
  nodes: z.array(KedroNodeSchema),
  datasets: z.array(KedroDatasetSchema),
  connections: z.array(KedroConnectionSchema),
});

// Type inference from schemas
export type ValidatedStoredProjectState = z.infer<typeof StoredProjectStateSchema>;

/**
 * Safely parse localStorage data with detailed error reporting
 * @param data - Raw data from localStorage (already JSON.parsed)
 * @returns Parsed data or null with error details logged
 */
export function parseStoredProjectState(data: unknown): ValidatedStoredProjectState | null {
  const result = StoredProjectStateSchema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  // Return null - error details will be logged by caller
  return null;
}

/**
 * Get validation errors in a readable format
 * @param data - Raw data to validate
 * @returns Array of error messages or empty array if valid
 */
export function getValidationErrors(data: unknown): string[] {
  const result = StoredProjectStateSchema.safeParse(data);

  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
}
