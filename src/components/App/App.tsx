import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { TutorialModal } from '../Tutorial/TutorialModal';
import { WalkthroughOverlay } from '../Walkthrough/WalkthroughOverlay';
import { ProjectSetupModal } from '../ProjectSetup/ProjectSetupModal';
import { ValidationPanel } from '../ValidationPanel/ValidationPanel';
import { ExportWizard } from '../ExportWizard/ExportWizard';
import { CodeViewerModal } from '../CodeViewer';
import { AppHeader } from './AppHeader';
import { AppLayout } from './AppLayout';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useValidation } from './hooks/useValidation';
import { Toaster } from 'react-hot-toast';
import './App.scss';

function App() {
  const theme = useAppSelector((state) => state.theme.theme);
  const showWalkthrough = useAppSelector((state) => state.ui.showWalkthrough);
  const showProjectSetup = useAppSelector((state) => state.ui.showProjectSetup);
  const showExportWizard = useAppSelector((state) => state.ui.showExportWizard);
  const nodes = useAppSelector((state) => state.nodes.allIds);
  const datasets = useAppSelector((state) => state.datasets.allIds);

  // Check if pipeline has any content (nodes or datasets)
  const hasPipelineContent = nodes.length > 0 || datasets.length > 0;

  // Initialize app from localStorage
  useAppInitialization();

  // Handle validation and export logic
  const { exportValidationResult, handleViewCode, handleExport, handleConfirmExport, handleCloseExportWizard } =
    useValidation({
      showExportWizard,
    });

  // Apply theme class to root element
  useEffect(() => {
    document.documentElement.className = `kedro-builder kui-theme--${theme}`;
  }, [theme]);

  return (
    <div className="kedro-builder" data-theme={theme}>
      <div className="app">
        <AppHeader hasPipelineContent={hasPipelineContent} onViewCode={handleViewCode} onExport={handleExport} />
        <AppLayout showExportWizard={showExportWizard} />
      </div>

      {/* Modals and overlays */}
      <TutorialModal />
      {showWalkthrough && <WalkthroughOverlay />}
      {showProjectSetup && <ProjectSetupModal />}
      <CodeViewerModal />
      <ValidationPanel />
      {exportValidationResult && (
        <ExportWizard
          isOpen={showExportWizard}
          onClose={handleCloseExportWizard}
          validationResult={exportValidationResult}
          onExport={handleConfirmExport}
        />
      )}

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
