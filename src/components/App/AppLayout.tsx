import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { ComponentPalette } from '../Palette/ComponentPalette';
import { PipelineCanvas } from '../Canvas/PipelineCanvas';
import { ConfigPanel } from '../ConfigPanel/ConfigPanel';

interface AppLayoutProps {
  showExportWizard: boolean;
}

/**
 * Main application layout with sidebar, canvas, and optional config panel
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ showExportWizard }) => {
  const showConfigPanel = useAppSelector((state) => state.ui.showConfigPanel);

  return (
    <main className="app__main">
      <aside className="app__sidebar">
        <ComponentPalette />
      </aside>
      <div className="app__canvas">
        <PipelineCanvas exportWizardOpen={showExportWizard} />
      </div>
      {showConfigPanel && (
        <aside className="app__config-panel">
          <ConfigPanel />
        </aside>
      )}
    </main>
  );
};
