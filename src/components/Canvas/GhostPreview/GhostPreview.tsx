import React from 'react';
import { Database } from 'lucide-react';
import type { GhostPreviewState } from '../hooks/useConnectionHandlers';
import './GhostPreview.scss';

interface GhostPreviewProps {
  ghostPreview: GhostPreviewState;
}

export const GhostPreview: React.FC<GhostPreviewProps> = ({ ghostPreview }) => {
  const { sourceType, position } = ghostPreview;

  // Show a node preview if dragging from a dataset, and vice versa
  const showNodePreview = sourceType === 'dataset';
  const showDatasetPreview = sourceType === 'node';

  return (
    <div
      className="ghost-preview"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {showNodePreview && (
        <div className="ghost-preview__node">
          <div className="ghost-preview__icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">
                ƒ
              </text>
            </svg>
          </div>
          <div className="ghost-preview__label">New Node</div>
        </div>
      )}
      {showDatasetPreview && (
        <div className="ghost-preview__dataset">
          <div className="ghost-preview__icon">
            <Database size={20} />
          </div>
          <div className="ghost-preview__label">New Dataset</div>
        </div>
      )}
    </div>
  );
};
