/**
 * Generate pyproject.toml for Kedro project
 */

import type { ProjectMetadata } from './staticFilesGenerator';

/**
 * Map dataset types to their kedro-datasets extras
 * Format: dataset type -> extra name for pip install kedro-datasets[extra]
 */
const DATASET_TYPE_TO_EXTRA: Record<string, string> = {
  // Pandas datasets
  csv: 'pandas-csvdataset',
  parquet: 'pandas-parquetdataset',
  json: 'pandas-jsondataset',
  excel: 'pandas-exceldataset',
  feather: 'pandas-featherdataset',
  hdf: 'pandas-hdfdataset',
  sql_table: 'pandas-sqltabledataset',
  sql_query: 'pandas-sqlquerydataset',
  gbq_table: 'pandas-gbqtabledataset',
  gbq_query: 'pandas-gbqquerydataset',

  // Spark datasets
  spark_dataframe: 'spark-sparkdataset',
  spark_hive: 'spark-sparkhivedataset',
  spark_jdbc: 'spark-sparkjdbcdataset',

  // Delta Lake
  delta_table: 'databricks-managedtabledataset',

  // Polars datasets
  polars_csv: 'polars-polarscsvdataset',
  polars_parquet: 'polars-polarsparquetdataset',
  polars_lazy: 'polars-polarslazydataset',

  // Dask datasets
  dask_parquet: 'dask-parquetdataset',
  dask_csv: 'dask-csvdataset',

  // Pickle datasets
  pickle: 'pickle-pickledataset',

  // Text datasets
  text: 'text-textdataset',
  yaml: 'yaml-yamldataset',
  xml: 'xml-xmldataset',

  // Image & Visualization
  image: 'pillow-imagedataset',
  matplotlib: 'matplotlib-matplotlibwriter',
  plotly_json: 'plotly-jsondataset',
  video: 'video-videodataset',
  holoviews: 'holoviews-holoviewswriter',

  // Graph/Network datasets
  networkx_json: 'networkx-jsondataset',
  networkx_gml: 'networkx-gmldataset',
  networkx_graphml: 'networkx-graphmldataset',

  // Geospatial
  geojson: 'geopandas-geojsondataset',

  // Machine Learning Models
  tensorflow: 'tensorflow-tensorflowmodeldataset',
  pytorch: 'pytorch-pytorchdataset',
  huggingface_dataset: 'huggingface-hfdataset',
  huggingface_model: 'huggingface-hftransformerpipelinedataset',

  // Specialized formats
  api: 'api-apidataset',
  tracking: 'tracking-metricsdataset',
  biosequence: 'biosequence-biosequencedataset',
  matlab: 'matlab-matlabdataset',
  ibis_table: 'ibis-tabledataset',

  // Memory (no extra needed)
  memory: '',
};

/**
 * GenAI options for pyproject.toml generation
 */
export interface GenAIOptions {
  providers: string[];
}

/**
 * Generate pyproject.toml content
 */
export function generatePyproject(
  metadata: ProjectMetadata,
  datasetTypes?: string[],
  genAIOptions?: GenAIOptions
): string {
  const { projectName, pythonPackage } = metadata;

  // Generate kedro-datasets dependency with only the required extras
  let datasetsExtras: string[] = [];

  if (datasetTypes && datasetTypes.length > 0) {
    // Get unique extras for the used dataset types
    const extrasSet = new Set<string>();
    datasetTypes.forEach((type) => {
      const extra = DATASET_TYPE_TO_EXTRA[type];
      if (extra) {
        extrasSet.add(extra);
      }
    });
    datasetsExtras = Array.from(extrasSet).sort();
  } else {
    // Default to common pandas datasets if none specified
    datasetsExtras = ['pandas-csvdataset', 'pandas-exceldataset', 'pandas-parquetdataset'];
  }

  // Add provider-specific langchain dataset extras when GenAI nodes are present
  if (genAIOptions && genAIOptions.providers.length > 0) {
    const providerDatasetExtras: Record<string, string> = {
      openai: 'langchain-chatopenaidataset',
      anthropic: 'langchain-chatanthropicdataset',
      cohere: 'langchain-chatcoheredataset',
    };

    const uniqueProviders = [...new Set(genAIOptions.providers)];
    uniqueProviders.forEach((provider) => {
      const extra = providerDatasetExtras[provider];
      if (extra) datasetsExtras.push(extra);
    });

    datasetsExtras.sort();
  }

  // Format the kedro-datasets dependency
  const datasetsDep = datasetsExtras.length > 0
    ? `"kedro-datasets[${datasetsExtras.join(', ')}]>=3.0"`
    : '"kedro-datasets>=3.0"';

  // Generate GenAI dependencies when LLM context nodes are present
  // Note: langchain + provider packages (langchain-openai, etc.) are pulled in
  // transitively via kedro-datasets extras (e.g. langchain-chatopenaidataset),
  // so we only need python-dotenv for .env credential loading.
  const genAIDeps: string[] = [];
  if (genAIOptions && genAIOptions.providers.length > 0) {
    genAIDeps.push('"python-dotenv>=1.0"');
  }

  const genAIDepsStr = genAIDeps.length > 0
    ? '\n' + genAIDeps.map((dep) => `    ${dep},`).join('\n')
    : '';

  return `[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
requires-python = ">=3.10"
name = "${pythonPackage}"
readme = "README.md"
dynamic = ["version"]
dependencies = [
    "ipython>=8.10",
    "jupyterlab>=3.0",
    "notebook",
    "kedro[jupyter]~=1.0.0",
    ${datasetsDep},
    "kedro-viz>=6.7.0",${genAIDepsStr}
]

[project.scripts]
${projectName} = "${pythonPackage}.__main__:main"

[tool.kedro]
package_name = "${pythonPackage}"
project_name = "${projectName}"
kedro_init_version = "1.0.0"
tools = "['None']"
example_pipeline = "False"
source_dir = "src"

[project.entry-points."kedro.hooks"]

[tool.setuptools.dynamic.version]
attr = "${pythonPackage}.__version__"

[tool.setuptools.packages.find]
where = ["src"]
namespaces = false
`;
}
