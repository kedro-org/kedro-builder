import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { store } from '../../store';
import { closeConfigPanel, clearPendingComponent } from '../../features/ui/uiSlice';
import { selectNodeById } from '../../features/nodes/nodesSelectors';
import { selectDatasetById } from '../../features/datasets/datasetsSelectors';
import { deleteNode } from '../../features/nodes/nodesSlice';
import { deleteDataset } from '../../features/datasets/datasetsSlice';
import { NodeConfigForm } from './NodeConfigForm/NodeConfigForm';
import { DatasetConfigForm } from './DatasetConfigForm/DatasetConfigForm';
import { X } from 'lucide-react';
import './ConfigPanel.scss';

export const ConfigPanel = () => {
  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.ui.showConfigPanel);
  const selectedComponent = useAppSelector((state) => state.ui.selectedComponent);
  const pendingComponent = useAppSelector((state) => state.ui.pendingComponentId);

  // Get the selected node or dataset
  const selectedNode = useAppSelector((state) =>
    selectedComponent?.type === 'node' && selectedComponent?.id
      ? selectNodeById(state, selectedComponent.id)
      : undefined
  );

  const selectedDataset = useAppSelector((state) =>
    selectedComponent?.type === 'dataset' && selectedComponent?.id
      ? selectDatasetById(state, selectedComponent.id)
      : undefined
  );

  if (!showPanel || !selectedComponent) {
    return null;
  }

  const handleClose = () => {
    // Check if there's a pending component that needs to be deleted
    if (pendingComponent && pendingComponent.id === selectedComponent.id) {
      // Get fresh data from store (not from render-time selectors)
      // This ensures we see any updates made by form submission
      const currentState = store.getState();
      const componentData =
        pendingComponent.type === 'node'
          ? selectNodeById(currentState, pendingComponent.id)
          : selectDatasetById(currentState, pendingComponent.id);

      const hasValidName = componentData?.name && componentData.name.trim().length > 0;

      if (!hasValidName) {
        // Component doesn't have a valid name - delete it
        if (pendingComponent.type === 'node') {
          dispatch(deleteNode(pendingComponent.id));
        } else {
          dispatch(deleteDataset(pendingComponent.id));
        }
      }

      // Clear pending status
      dispatch(clearPendingComponent());
    }

    dispatch(closeConfigPanel());
  };

  return (
    <div className="config-panel">
      <div className="config-panel__header">
        <h3 className="config-panel__title">
          {selectedComponent.type === 'node' ? 'Configure Node' : 'Configure Dataset'}
        </h3>
        <button
          onClick={handleClose}
          className="config-panel__close"
          aria-label="Close configuration panel"
        >
          <X size={20} />
        </button>
      </div>

      <div className="config-panel__content">
        {selectedComponent.type === 'node' && selectedNode && (
          <NodeConfigForm node={selectedNode} onClose={handleClose} />
        )}

        {selectedComponent.type === 'dataset' && selectedDataset && (
          <DatasetConfigForm dataset={selectedDataset} onClose={handleClose} />
        )}
      </div>
    </div>
  );
};
