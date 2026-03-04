import { Database, Cpu, BarChart3, Download, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DND_TYPES } from '@/constants';
import './NodeCard.scss';

const NODE_ICONS: Record<string, LucideIcon> = {
  data_ingestion: Download,
  data_processing: Database,
  model_training: Cpu,
  model_evaluation: BarChart3,
  custom: Settings,
};

interface NodeCardProps {
  type: string;
  name: string;
  description: string;
}

export const NodeCard: React.FC<NodeCardProps> = ({ type, name, description }) => {
  const Icon = NODE_ICONS[type] ?? Settings;

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(DND_TYPES.NODE, type);
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
