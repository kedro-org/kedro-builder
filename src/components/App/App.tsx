import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectTheme } from '../../features/theme/themeSelectors';
import { TutorialModal } from '../Tutorial/TutorialModal';
import { WalkthroughOverlay } from '../Walkthrough/WalkthroughOverlay';
import { ProjectSetupModal } from '../ProjectSetup/ProjectSetupModal';
import { ValidationPanel } from '../ValidationPanel/ValidationPanel';
import { ExportWizard } from '../ExportWizard/ExportWizard';
import { CodeViewerModal } from '../CodeViewer';
import { TelemetryConsent } from '../TelemetryConsent';
import { FeedbackButton } from '../Feedback';
import { ErrorBoundary } from '../UI/ErrorBoundary';
import { AppHeader } from './AppHeader';
import { AppLayout } from './AppLayout';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useValidation } from './hooks/useValidation';
import { trackEvent, setGlobalEventProperties } from '../../infrastructure/telemetry';
import { Toaster } from 'react-hot-toast';
import './App.scss';

function App() {
  const theme = useAppSelector(selectTheme);
  const showWalkthrough = useAppSelector((state) => state.onboarding.showWalkthrough);
  const showProjectSetup = useAppSelector((state) => state.ui.showProjectSetup);
  const showExportWizard = useAppSelector((state) => state.ui.showExportWizard);
  const showConfigPanel = useAppSelector((state) => state.ui.showConfigPanel);
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

  // Initialize telemetry on app load - intentionally runs once on mount
  // We capture initial values only; subsequent changes are tracked separately
  useEffect(() => {
    // Set global event properties
    setGlobalEventProperties({
      version: import.meta.env.VITE_APP_VERSION || '0.1.0',
      theme: theme,
    });

    // Track app opened event
    trackEvent('app_opened', {
      hasProject: nodes.length > 0 || datasets.length > 0,
      theme: theme,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme property when theme changes
  useEffect(() => {
    setGlobalEventProperties({ theme });
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
      <ErrorBoundary componentName="Code Viewer" showRetry>
        <CodeViewerModal />
      </ErrorBoundary>
      <ValidationPanel />
      {exportValidationResult && (
        <ErrorBoundary componentName="Export Wizard" showRetry>
          <ExportWizard
            isOpen={showExportWizard}
            onClose={handleCloseExportWizard}
            validationResult={exportValidationResult}
            onExport={handleConfirmExport}
          />
        </ErrorBoundary>
      )}

      {/* Telemetry Consent Banner */}
      <TelemetryConsent />

      {/* Toast notifications */}
      <Toaster />

      {/* Feedback button */}
      <FeedbackButton showConfigPanel={showConfigPanel} />
    </div>
  );
}

export default App;
