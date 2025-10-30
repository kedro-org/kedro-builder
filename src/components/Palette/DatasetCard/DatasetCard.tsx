import React from 'react';
import { FileText, FileJson, Table, Archive, HardDrive, Server } from 'lucide-react';
import type { DatasetType } from '../../../types/kedro';
import './DatasetCard.scss';

interface DatasetCardProps {
  type: DatasetType;
  name: string;
  description: string;
}

const DATASET_ICONS: Partial<Record<DatasetType, React.ElementType>> = {
  csv: Table,
  parquet: Archive,
  json: FileJson,
  excel: FileText,
  pickle: Archive,
  memory: HardDrive,
  sql_table: Server,
  sql_query: Server,
};

export const DatasetCard: React.FC<DatasetCardProps> = ({ type, name, description }) => {
  const Icon = DATASET_ICONS[type] ?? FileText;

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/kedro-builder-dataset', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`dataset-card dataset-card--${type}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="dataset-card__icon">
        <Icon size={18} />
      </div>
      <div className="dataset-card__content">
        <h4 className="dataset-card__name">{name}</h4>
        <p className="dataset-card__description">{description}</p>
      </div>
    </div>
  );
};
