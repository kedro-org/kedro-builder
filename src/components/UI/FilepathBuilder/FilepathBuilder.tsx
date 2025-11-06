import { useState, useEffect } from 'react';
import './FilepathBuilder.scss';

interface FilepathBuilderProps {
  baseLocation: string;
  dataLayer: string;
  fileName: string;
  onBaseLocationChange: (value: string) => void;
  onDataLayerChange: (value: string) => void;
  onFileNameChange: (value: string) => void;
  onFullPathChange?: (value: string) => void;
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

export const FilepathBuilder: React.FC<FilepathBuilderProps> = ({
  baseLocation,
  dataLayer,
  fileName,
  onBaseLocationChange,
  onDataLayerChange,
  onFileNameChange,
  onFullPathChange,
}) => {
  // Generate full path from segments
  const generateFullPath = (): string => {
    const base = baseLocation.trim() || 'data';
    const layer = dataLayer.trim();
    const file = fileName.trim();

    if (!file) {
      return `${base}/${layer}/`;
    }

    return `${base}/${layer}/${file}`;
  };

  // Local state for full path to make it editable
  const [fullPath, setFullPath] = useState(generateFullPath());

  // Sync full path when segments change
  useEffect(() => {
    setFullPath(generateFullPath());
  }, [baseLocation, dataLayer, fileName]);

  // Handle full path edit
  const handleFullPathChange = (value: string) => {
    setFullPath(value);
    onFullPathChange?.(value);
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
        <div className="filepath-builder__segment">
          <label className="filepath-builder__segment-label">File name:</label>
          <input
            type="text"
            className="filepath-builder__input"
            value={fileName}
            onChange={(e) => onFileNameChange(e.target.value)}
            placeholder="example.csv"
          />
        </div>
      </div>

      {/* Full Path - Editable Input */}
      <div className="filepath-builder__fullpath">
        <label className="filepath-builder__fullpath-label">Full path (editable):</label>
        <input
          type="text"
          className="filepath-builder__fullpath-input"
          value={fullPath}
          onChange={(e) => handleFullPathChange(e.target.value)}
          placeholder="data/01_raw/example.csv"
        />
      </div>
    </div>
  );
};
