import { useRef } from 'react';
import { Folder } from 'lucide-react';
import './FilepathBuilder.scss';

interface FilepathBuilderProps {
  baseLocation: string;
  dataLayer: string;
  fileName: string;
  datasetType: string;
  onBaseLocationChange: (value: string) => void;
  onDataLayerChange: (value: string) => void;
  onFileNameChange: (value: string) => void;
}

const DATA_LAYERS = [
  { value: '01_raw', label: '01_raw - Raw data' },
  { value: '02_intermediate', label: '02_intermediate - Intermediate data' },
  { value: '03_primary', label: '03_primary - Primary data' },
  { value: '04_feature', label: '04_feature - Feature engineering' },
  { value: '05_model_input', label: '05_model_input - Model inputs' },
  { value: '06_models', label: '06_models - Trained models' },
  { value: '07_model_output', label: '07_model_output - Model outputs' },
  { value: '08_reporting', label: '08_reporting - Reporting datasets' },
];

// Map dataset types to file extensions
const FILE_EXTENSIONS: Record<string, string> = {
  csv: '.csv',
  json: '.json',
  parquet: '.parquet',
  excel: '.xlsx,.xls',
  pickle: '.pkl,.pickle',
  sql: '.sql',
  memory: '', // Memory datasets don't have files
};

export const FilepathBuilder: React.FC<FilepathBuilderProps> = ({
  baseLocation,
  dataLayer,
  fileName,
  datasetType,
  onBaseLocationChange,
  onDataLayerChange,
  onFileNameChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get file extension for dataset type
  const getExtension = (type: string): string => {
    const ext = FILE_EXTENSIONS[type] || '';
    return ext.split(',')[0]; // Get first extension if multiple
  };

  // Get accept attribute for file input
  const getAcceptAttribute = (type: string): string => {
    return FILE_EXTENSIONS[type] || '*';
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileNameChange(file.name);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Generate full path
  const generateFullPath = (): string => {
    const base = baseLocation.trim() || 'data';
    const layer = dataLayer.trim();
    const file = fileName.trim();

    if (!file) {
      return `${base}/${layer}/`;
    }

    return `${base}/${layer}/${file}`;
  };

  return (
    <div className="filepath-builder">
      <label className="filepath-builder__label">Filepath:</label>

      <div className="filepath-builder__segments">
        {/* Base Location */}
        <div className="filepath-builder__segment">
          <label className="filepath-builder__segment-label">Base location:</label>
          <input
            type="text"
            className="filepath-builder__input"
            value={baseLocation}
            onChange={(e) => onBaseLocationChange(e.target.value)}
            placeholder="data"
          />
        </div>

        <span className="filepath-builder__separator">/</span>

        {/* Data Layer */}
        <div className="filepath-builder__segment">
          <label className="filepath-builder__segment-label">Data layer:</label>
          <select
            className="filepath-builder__select"
            value={dataLayer}
            onChange={(e) => onDataLayerChange(e.target.value)}
          >
            {DATA_LAYERS.map((layer) => (
              <option key={layer.value} value={layer.value}>
                {layer.label}
              </option>
            ))}
          </select>
        </div>

        <span className="filepath-builder__separator">/</span>

        {/* File Name */}
        <div className="filepath-builder__segment filepath-builder__segment--with-button">
          <label className="filepath-builder__segment-label">File name:</label>
          <div className="filepath-builder__input-wrapper">
            <input
              type="text"
              className="filepath-builder__input"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder={`example${getExtension(datasetType)}`}
            />
            <button
              type="button"
              className="filepath-builder__browse-button"
              onClick={handleBrowseClick}
              title="Browse for file"
            >
              <Folder size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="filepath-builder__file-input"
              accept={getAcceptAttribute(datasetType)}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Generated Path Preview */}
      <div className="filepath-builder__preview">
        <span className="filepath-builder__preview-label">Full path:</span>
        <code className="filepath-builder__preview-path">{generateFullPath()}</code>
      </div>
    </div>
  );
};
