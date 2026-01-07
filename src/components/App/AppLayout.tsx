import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { ComponentPalette } from '../Palette/ComponentPalette';
import { PipelineCanvas } from '../Canvas/PipelineCanvas';
import { ConfigPanel } from '../ConfigPanel/ConfigPanel';
import { ErrorBoundary } from '../UI/ErrorBoundary';

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
        <ErrorBoundary componentName="Pipeline Canvas" showRetry>
          <PipelineCanvas exportWizardOpen={showExportWizard} />
        </ErrorBoundary>
      </div>
      {showConfigPanel && (
        <aside className="app__config-panel">
          <ErrorBoundary componentName="Configuration Panel" showRetry>
            <ConfigPanel />
          </ErrorBoundary>
        </aside>
      )}
    </main>
  );
};
