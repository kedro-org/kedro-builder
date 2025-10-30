import { Database, Cpu, BarChart3, Download, Settings } from 'lucide-react';
import type { NodeType } from '../../../types/kedro';
import './NodeCard.scss';

const NODE_ICONS = {
  data_ingestion: Download,
  data_processing: Database,
  model_training: Cpu,
  model_evaluation: BarChart3,
  custom: Settings,
};

interface NodeCardProps {
  type: NodeType;
  name: string;
  description: string;
}

export const NodeCard: React.FC<NodeCardProps> = ({ type, name, description }) => {
  const Icon = NODE_ICONS[type];

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/kedro-builder', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`node-card node-card--${type}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="node-card__icon">
        <Icon size={20} />
      </div>
      <div className="node-card__content">
        <h4 className="node-card__name">{name}</h4>
        <p className="node-card__description">{description}</p>
      </div>
    </div>
  );
};
