/**
 * Generate pyproject.toml for Kedro project
 */

import type { ProjectMetadata } from './staticFilesGenerator';

/**
 * Generate pyproject.toml content
 */
export function generatePyproject(metadata: ProjectMetadata): string {
  const { projectName, pythonPackage } = metadata;

  return `[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
requires-python = ">=3.9"
name = "${pythonPackage}"
readme = "README.md"
dynamic = ["version"]
dependencies = [
    "ipython>=8.10",
    "jupyterlab>=3.0",
    "notebook",
    "kedro[jupyter]~=1.0.0",
    "kedro-datasets[pandas-csvdataset, pandas-exceldataset, pandas-parquetdataset]>=3.0",
    "kedro-viz>=6.7.0",
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
