import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { closeCodeViewer, openExportWizard } from '../../features/ui/uiSlice';
import { setValidationResults } from '../../features/validation/validationSlice';
import { store } from '../../store';
import { validatePipeline } from '../../utils/validation';
import { FileTree } from './FileTree';
import { CodeDisplay } from './CodeDisplay';
import { X, Download } from 'lucide-react';
import './CodeViewerModal.scss';

export const CodeViewerModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const showCodeViewer = useAppSelector((state) => state.ui.showCodeViewer);
  const projectName = useAppSelector((state) => state.project.current?.name);

  if (!showCodeViewer) return null;

  const handleClose = () => {
    dispatch(closeCodeViewer());
  };

  const handleExport = () => {
    // Close modal
    handleClose();

    // Run validation
    const state = store.getState();
    const validationResult = validatePipeline(state);

    // Store validation results in Redux
    dispatch(setValidationResults(validationResult));

    // Open export wizard using Redux action
    dispatch(openExportWizard());
  };

  return (
    <div className="code-viewer-modal">
      <div className="code-viewer-modal__backdrop" onClick={handleClose} />
      <div className="code-viewer-modal__container">
        <header className="code-viewer-modal__header">
          <h2 className="code-viewer-modal__title">
            Kedro Project Directory
            {projectName && <span className="code-viewer-modal__project-name"> - {projectName}</span>}
          </h2>
          <button
            className="code-viewer-modal__close"
            onClick={handleClose}
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="code-viewer-modal__content">
          <aside className="code-viewer-modal__sidebar">
            <FileTree />
          </aside>
          <main className="code-viewer-modal__main">
            <CodeDisplay />
          </main>
        </div>

        <footer className="code-viewer-modal__footer">
          <button
            className="code-viewer-modal__export"
            onClick={handleExport}
            title="Open Export Wizard"
          >
            <Download size={18} />
            Export Project
          </button>
        </footer>
      </div>
    </div>
  );
};
