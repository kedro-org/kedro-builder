import { useAppSelector, useAppDispatch } from '../../store/hooks';
import type { RootState, AppDispatch } from '../../store';
import { closeConfigPanel, clearPendingComponent } from '../../features/ui/uiSlice';
import { selectNodeById } from '../../features/nodes/nodesSelectors';
import { selectDatasetById } from '../../features/datasets/datasetsSelectors';
import { deleteNode } from '../../features/nodes/nodesSlice';
import { deleteDataset } from '../../features/datasets/datasetsSlice';
import { NodeConfigForm } from './NodeConfigForm/NodeConfigForm';
import { DatasetConfigForm } from './DatasetConfigForm/DatasetConfigForm';
import { X } from 'lucide-react';
import './ConfigPanel.scss';

// Thunk: auto-delete a pending component that was closed without a valid name
const closeAndCleanPending = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  const pending = state.ui.pendingComponentId;
  const selected = state.ui.selectedComponent;

  if (pending && selected && pending.id === selected.id) {
    const componentData =
      pending.type === 'node'
        ? selectNodeById(state, pending.id)
        : selectDatasetById(state, pending.id);

    const hasValidName = componentData?.name && componentData.name.trim().length > 0;

    if (!hasValidName) {
      if (pending.type === 'node') {
        dispatch(deleteNode(pending.id));
      } else {
        dispatch(deleteDataset(pending.id));
      }
    }

    dispatch(clearPendingComponent());
  }

  dispatch(closeConfigPanel());
};

export const ConfigPanel = () => {
  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.ui.showConfigPanel);
  const selectedComponent = useAppSelector((state) => state.ui.selectedComponent);

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
    dispatch(closeAndCleanPending());
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
