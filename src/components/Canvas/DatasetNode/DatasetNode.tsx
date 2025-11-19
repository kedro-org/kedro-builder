import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import {
  Database,
  FileSpreadsheet,
  Sheet,
  Braces,
  FileCode,
  Archive,
  FileText,
  Feather,
  Image,
  Video,
  Cpu,
  Globe,
  LineChart,
  BarChart3,
  Map,
  type LucideIcon,
} from 'lucide-react';
import classNames from 'classnames';
import type { KedroDataset } from '../../../types/kedro';
import type { RootState } from '../../../types/redux';
import './DatasetNode.scss';

// Map dataset types to their icons
const getDatasetIcon = (datasetType?: string): LucideIcon => {
  if (!datasetType) return Database;

  const iconMap: Record<string, LucideIcon> = {
    csv: FileSpreadsheet,
    excel: Sheet,
    parquet: Database,
    json: Braces,
    yaml: FileCode,
    pickle: Archive,
    text: FileText,
    feather: Feather,
    xml: FileCode,
    hdf: Database,
    sql: Database,
    memory: Cpu,
    api: Globe,
    pillow: Image,
    image: Image,
    matplotlib: LineChart,
    plotly: BarChart3,
    video: Video,
    geojson: Map,
  };

  return iconMap[datasetType.toLowerCase()] || Database;
};

// Get file extension label for display
const getExtensionLabel = (datasetType?: string): string => {
  if (!datasetType) return '';

  const extensionMap: Record<string, string> = {
    'csv': 'csv',
    'excel': 'xlsx',
    'parquet': 'parquet',
    'json': 'json',
    'yaml': 'yml',
    'pickle': 'pkl',
    'feather': 'feather',
    'hdf': 'h5',
    'sql': 'db',
    'xml': 'xml',
    'text': 'txt',
    'pillow': 'png',
    'matplotlib': 'png',
    'plotly': 'json',
    'video': 'mp4',
    'memory': 'mem',
  };

  return extensionMap[datasetType.toLowerCase()] || datasetType;
};

export const DatasetNode = memo<NodeProps>(({ data, selected }) => {
  const datasetData = data as KedroDataset;
  const validationErrors = useSelector((state: RootState) => state.validation.errors);
  const validationWarnings = useSelector((state: RootState) => state.validation.warnings);

  // Check if this dataset has any validation issues
  const hasError = validationErrors.some(
    (err) => err.componentId === datasetData.id && err.componentType === 'dataset'
  );
  const hasWarning = validationWarnings.some(
    (warn) => warn.componentId === datasetData.id && warn.componentType === 'dataset'
  );

  // Get the appropriate icon for this dataset type
  const Icon = getDatasetIcon(datasetData.type);

  return (
    <div
      className={classNames('dataset-node', `dataset-node--${datasetData.type}`, {
        'dataset-node--selected': selected,
        'dataset-node--error': hasError,
        'dataset-node--warning': !hasError && hasWarning,
      })}
    >
      {/* Top Handle for connections from above */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="dataset-node__handle dataset-node__handle--top"
      />

      {/* Dataset content - icon, name, and type */}
      <div className="dataset-node__content">
        <div className="dataset-node__icon">
          <Icon size={20} />
        </div>
        <div className="dataset-node__info">
          <h4 className="dataset-node__name">{datasetData.name || 'Unnamed Dataset'}</h4>
          {datasetData.type && (
            <span className="dataset-node__type">{getExtensionLabel(datasetData.type)}</span>
          )}
        </div>
      </div>

      {/* Bottom Handle for connections to below */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="dataset-node__handle dataset-node__handle--bottom"
      />
    </div>
  );
});

DatasetNode.displayName = 'DatasetNode';
