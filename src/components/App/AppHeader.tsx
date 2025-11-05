import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { openTutorial, openProjectSetup } from '../../features/ui/uiSlice';
import { SettingsModal } from '../Settings';
import { Code, Download, Edit2, Settings } from 'lucide-react';

interface AppHeaderProps {
  hasPipelineContent: boolean;
  onViewCode: () => void;
  onExport: () => void;
}

/**
 * Application header with project info and action buttons
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ hasPipelineContent, onViewCode, onExport }) => {
  const dispatch = useAppDispatch();
  const hasActiveProject = useAppSelector((state) => state.ui.hasActiveProject);
  const currentProject = useAppSelector((state) => state.project.current);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenTutorial = () => {
    dispatch(openTutorial());
  };

  const handleEditProject = () => {
    dispatch(openProjectSetup());
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <header className="app__header">
      <div className="app__header-content">
        <div className="app__header-title">
          <svg className="app__kedro-icon" viewBox="0 0 32 32" fill="none">
            <path d="M16 0L6.55651e-07 16L16 32L32 16L16 0Z" fill="var(--color-kedro-yellow)" />
          </svg>
          <div className="app__header-project">
            <h1>Kedro</h1>
          </div>

          <div className="app__header-project-controls">
            {/* Project name display - only show if project exists */}
            {hasActiveProject && currentProject && (
              <>
                <p className="app__project-name">{currentProject.name}</p>

                {/* Edit Project Button - Opens ProjectSetupModal */}
                <button className="app__project-name-edit" onClick={handleEditProject} title="Edit project">
                  <Edit2 size={16} />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        <div className="app__header-actions">
          <button className="app__header-button" onClick={handleOpenTutorial} title="Tutorial">
            Tutorial
          </button>
          <button
            className="app__header-button"
            data-walkthrough="view-code-button"
            disabled={!hasActiveProject || !hasPipelineContent}
            onClick={onViewCode}
            title="View Generated Code"
          >
            <Code size={18} />
            View Code
          </button>
          <button
            className="app__header-button app__header-button--primary"
            data-walkthrough="export-button"
            disabled={!hasActiveProject || !hasPipelineContent}
            onClick={onExport}
            title="Validate & Export Kedro Project"
          >
            <Download size={18} />
            Validate & Export
          </button>
          <button
            className="app__header-button"
            onClick={handleOpenSettings}
            title="Settings"
            aria-label="Open settings"
            data-heap-redact-text
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </header>
  );
};
