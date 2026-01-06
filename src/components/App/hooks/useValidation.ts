import { useState, useEffect } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { store } from '../../../store';
import {
  openCodeViewer,
  openExportWizard,
  closeExportWizard,
} from '../../../features/ui/uiSlice';
import { setValidationResults } from '../../../features/validation/validationSlice';
import { validatePipeline } from '../../../utils/validation';
import type { ValidationResult } from '../../../utils/validation';
import { generateKedroProject, downloadProject } from '../../../infrastructure/export';
import { logger } from '../../../utils/logger';
import { trackEvent } from '../../../infrastructure/telemetry';
import toast from 'react-hot-toast';

interface UseValidationProps {
  showExportWizard: boolean;
}

interface ExportMetadata {
  projectName: string;
  pythonPackage: string;
  pipelineName: string;
  description: string;
}

/**
 * Custom hook to manage validation logic and export handlers
 */
export const useValidation = ({ showExportWizard }: UseValidationProps) => {
  const dispatch = useAppDispatch();
  const [exportValidationResult, setExportValidationResult] = useState<ValidationResult | null>(null);

  // Listen for config updates to refresh validation if export wizard is open
  useEffect(() => {
    const handleConfigUpdate = () => {
      if (showExportWizard) {
        // Re-run validation
        const state = store.getState();
        const validationResult = validatePipeline(state);

        // Update validation results
        dispatch(setValidationResults(validationResult));
        setExportValidationResult(validationResult);
      }
    };

    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => window.removeEventListener('configUpdated', handleConfigUpdate);
  }, [showExportWizard, dispatch]);

  // Sync export validation result when showExportWizard changes
  useEffect(() => {
    if (showExportWizard) {
      // Get validation results from Redux (already set by CodeViewerModal or handleExport)
      const state = store.getState();
      const validationResult = validatePipeline(state);
      setExportValidationResult(validationResult);
    }
  }, [showExportWizard]);

  // Handler to open Code Viewer (with validation check)
  const handleViewCode = () => {
    // Get current state from store
    const state = store.getState();

    // Run validation
    const validationResult = validatePipeline(state);

    // Check if there are any errors
    if (!validationResult.isValid) {
      // Find specific error types for better user feedback
      const cycleError = validationResult.errors.find(e => e.message.includes('Circular dependency'));
      const duplicateError = validationResult.errors.find(e => e.message.includes('Duplicate'));
      const invalidNameError = validationResult.errors.find(e => e.message.includes('Invalid'));
      const emptyNameError = validationResult.errors.find(e => e.message.includes('no name'));

      // Show specific error message based on error type
      let errorMessage = 'Cannot view code: Please fix validation errors first';
      if (cycleError) {
        errorMessage = `Cannot view code: ${cycleError.message}`;
      } else if (duplicateError) {
        errorMessage = `Cannot view code: ${duplicateError.message}`;
      } else if (invalidNameError) {
        errorMessage = `Cannot view code: ${invalidNameError.message}`;
      } else if (emptyNameError) {
        errorMessage = `Cannot view code: ${emptyNameError.message}`;
      }

      toast.error(errorMessage, {
        duration: 5000,
        style: {
          maxWidth: '500px',
        },
      });
      // Store validation results so user can see them
      dispatch(setValidationResults(validationResult));
      return;
    }

    // Track code viewer opened
    trackEvent('code_viewed', {
      nodeCount: state.nodes.allIds.length,
      datasetCount: state.datasets.allIds.length,
    });

    // Validation passed - open code viewer
    dispatch(openCodeViewer());
  };

  const handleExport = () => {
    // Get current state from store
    const state = store.getState();

    // Run validation
    const validationResult = validatePipeline(state);

    // Store validation results in Redux (for ValidationPanel compatibility)
    dispatch(setValidationResults(validationResult));

    // Store validation results in local state for ExportWizard
    setExportValidationResult(validationResult);

    // Open export wizard using Redux action
    dispatch(openExportWizard());
  };

  const handleConfirmExport = async (metadata: ExportMetadata) => {
    try {
      logger.feature('Generating Kedro project...');

      // Get current state
      const state = store.getState();

      // Generate ZIP file
      const zipBlob = await generateKedroProject(state, metadata);

      // Download the file
      downloadProject(zipBlob, metadata.projectName);

      // Track successful export
      trackEvent('project_exported', {
        nodeCount: state.nodes.allIds.length,
        datasetCount: state.datasets.allIds.length,
        connectionCount: state.connections.allIds.length,
      });

      // Close dialog using Redux action
      dispatch(closeExportWizard());

      // Clear validation results to remove yellow warning borders
      dispatch(setValidationResults({ errors: [], warnings: [], isValid: true }));
      setExportValidationResult(null);

      logger.success('Project exported successfully!');

      // Show success toast
      toast.success(`Project "${metadata.projectName}" exported successfully!`, {
        duration: 5000,
        position: 'bottom-right',
        style: {
          maxWidth: '400px',
          wordBreak: 'break-word',
        },
      });
    } catch (error) {
      logger.error('Export failed:', error);
      toast.error('Failed to export project. Please try again.', {
        duration: 4000,
        position: 'bottom-right',
      });
    }
  };

  const handleCloseExportWizard = () => {
    dispatch(closeExportWizard());
    // Clear validation results to remove yellow warning borders
    dispatch(setValidationResults({ errors: [], warnings: [], isValid: true }));
    setExportValidationResult(null);
  };

  return {
    exportValidationResult,
    handleViewCode,
    handleExport,
    handleConfirmExport,
    handleCloseExportWizard,
  };
};
