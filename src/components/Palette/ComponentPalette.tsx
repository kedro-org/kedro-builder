import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { Database, Brain } from 'lucide-react';
import { DND_TYPES } from '../../constants';
import './ComponentPalette.scss';

type TabType = 'components' | 'templates';

export const ComponentPalette = () => {
  const [activeTab, setActiveTab] = useState<TabType>('components');
  const hasActiveProject = useAppSelector((state) => state.ui.hasActiveProject);

  // Disable dragging only if no project is created
  const isDragDisabled = !hasActiveProject;

  const handleNodeDragStart = (event: React.DragEvent) => {
    if (isDragDisabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(DND_TYPES.NODE, 'custom');
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDatasetDragStart = (event: React.DragEvent) => {
    if (isDragDisabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(DND_TYPES.DATASET, 'csv');
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleLLMContextDragStart = (event: React.DragEvent) => {
    if (isDragDisabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(DND_TYPES.LLM_CONTEXT, 'llm_context');
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="component-palette">
      <div className="component-palette__tabs">
        <button
          className={`component-palette__tab ${activeTab === 'components' ? 'component-palette__tab--active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
        <button
          className="component-palette__tab component-palette__tab--disabled"
          disabled
        >
          Templates
        </button>
      </div>

      <div className="component-palette__header">
        <p className="component-palette__subtitle">
          {activeTab === 'components' ? 'Drag components below onto the canvas to build your pipeline.' : ''}
        </p>
      </div>

      <div className="component-palette__section">
        <div className="component-palette__list" data-walkthrough="component-palette-list">
          {/* Dataset - First for beginners */}
          <div
            className={`component-card component-card--dataset ${isDragDisabled ? 'component-card--disabled' : ''}`}
            draggable={!isDragDisabled}
            onDragStart={handleDatasetDragStart}
            data-walkthrough="dataset-button"
            title={!hasActiveProject ? 'Create a project first' : ''}
          >
            <div className="component-card__icon">
              <Database size={20} />
            </div>
            <div className="component-card__content">
              <h4 className="component-card__name">Dataset</h4>
              <p className="component-card__description">Add a data source with name, type and location</p>
            </div>
          </div>

          {/* Function Node - Second */}
          <div
            className={`component-card component-card--function ${isDragDisabled ? 'component-card--disabled' : ''}`}
            draggable={!isDragDisabled}
            onDragStart={handleNodeDragStart}
            title={!hasActiveProject ? 'Create a project first' : ''}
          >
            <div className="component-card__icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">
                  ƒ
                </text>
              </svg>
            </div>
            <div className="component-card__content">
              <h4 className="component-card__name">Function Node</h4>
              <p className="component-card__description">Create a python function</p>
            </div>
          </div>

          {/* LLM Context Node */}
          <div
            className={`component-card component-card--llm-context ${isDragDisabled ? 'component-card--disabled' : ''}`}
            draggable={!isDragDisabled}
            onDragStart={handleLLMContextDragStart}
            title={!hasActiveProject ? 'Create a project first' : ''}
          >
            <div className="component-card__icon">
              <Brain size={20} />
            </div>
            <div className="component-card__content">
              <h4 className="component-card__name">LLM Context <span className="component-card__badge">NEW</span></h4>
              <p className="component-card__description">Bundle LLM, prompts and tools for GenAI pipelines</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
