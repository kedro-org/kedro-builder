import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeConfigPanel } from '../../features/ui/uiSlice';

import { CustomNode } from './CustomNode/CustomNode';
import { DatasetNode } from './DatasetNode/DatasetNode';
import { CustomEdge } from './CustomEdge/CustomEdge';
import { CanvasOverlay } from './CanvasOverlay/CanvasOverlay';
import { CanvasControls } from './CanvasControls/CanvasControls';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { GhostPreview } from './GhostPreview/GhostPreview';

import { useCanvasState } from './hooks/useCanvasState';
import { useConnectionHandlers } from './hooks/useConnectionHandlers';
import { useNodeHandlers } from './hooks/useNodeHandlers';
import { useSelectionHandlers } from './hooks/useSelectionHandlers';

import './PipelineCanvas.scss';

const nodeTypes = {
  kedroNode: CustomNode,
  datasetNode: DatasetNode,
};

const edgeTypes = {
  kedroEdge: CustomEdge,
};

interface PipelineCanvasProps {
  exportWizardOpen?: boolean;
}

const PipelineCanvasInner = ({ exportWizardOpen = false }: PipelineCanvasProps) => {
  const dispatch = useAppDispatch();

  // Custom hooks for state management
  const {
    reduxNodes,
    reduxDatasets,
    selectedNodeIds,
    selectedEdgeIds,
    isEmpty,
    isDraggingOver,
    setIsDraggingOver,
    isPanMode,
    setIsPanMode,
    connectionState,
    setConnectionState,
    nodes,
    edges,
    setEdges,
    onNodesChange: onNodesChangeBase,
    onEdgesChange,
    selectionType,
    totalSelected,
    getNodeColor,
  } = useCanvasState();

  // Connection handlers hook
  const {
    isValidConnection,
    handleConnectStart,
    handleConnectEnd,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    handleConnect,
    ghostPreview,
  } = useConnectionHandlers({
    setEdges: setEdges as any,
    connectionState,
    setConnectionState,
  });

  // Node handlers hook
  const {
    handleNodesDelete,
    handleNodesChange,
    handleDrop,
    handleDragLeave,
    handleDragOver,
    handleNodeClick,
    nodeDeleteConfirmation,
    confirmNodeDelete,
    cancelNodeDelete,
  } = useNodeHandlers({
    onNodesChange: onNodesChangeBase,
    setIsDraggingOver,
    isDraggingOver,
    isEmpty,
  });

  // Selection handlers hook
  const {
    handleEdgeClick,
    handlePaneClick,
    handleSelectionChange,
    handleBulkDelete,
    handleBulkClear,
    handleEdgesDelete,
    deleteConfirmation,
    confirmDelete,
    cancelDelete,
  } = useSelectionHandlers({
    reduxNodes,
    reduxDatasets,
    selectedNodeIds,
    selectedEdgeIds,
    isPanMode,
    setIsPanMode,
    exportWizardOpen,
  });

  // Auto-close config panel when all components are deleted from canvas
  const showConfigPanel = useAppSelector((state) => state.ui.showConfigPanel);
  useEffect(() => {
    // If config panel is open but there are no nodes or datasets, close it
    if (showConfigPanel && reduxNodes.length === 0 && reduxDatasets.length === 0) {
      dispatch(closeConfigPanel());
    }
  }, [showConfigPanel, reduxNodes.length, reduxDatasets.length, dispatch]);

  // Ref for ReactFlow wrapper to handle focus
  const reactFlowWrapper = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Auto-focus the ReactFlow container so keyboard events work
      node.focus();
    }
  }, []);

  return (
    <div
      className={`pipeline-canvas ${isPanMode ? 'pipeline-canvas--pan-mode' : ''} ${
        connectionState.source && connectionState.target && !connectionState.isValid
          ? 'pipeline-canvas--invalid-connection'
          : ''
      }`}
      ref={reactFlowWrapper}
      tabIndex={0}
      onDragLeave={handleDragLeave}
    >
      {/* Canvas Overlay - Empty state and bulk actions toolbar */}
      <CanvasOverlay
        isEmpty={isEmpty}
        isDraggingOver={isDraggingOver}
        totalSelected={totalSelected}
        selectionType={selectionType}
        onBulkDelete={handleBulkDelete}
        onBulkClear={handleBulkClear}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        selectNodesOnDrag={false}
        panOnDrag={isPanMode ? true : [2]}
        selectionOnDrag={!isPanMode && !exportWizardOpen}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        multiSelectionKeyCode={exportWizardOpen ? null : ['Meta', 'Control', 'Shift']}
        deleteKeyCode={['Delete', 'Backspace']}
        defaultEdgeOptions={{
          animated: true,
          style: {
            strokeWidth: 3,
            stroke: 'var(--color-connection)',
            strokeDasharray: '5, 5',
          },
          interactionWidth: 20,
        }}
        edgesReconnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <CanvasControls getNodeColor={getNodeColor} />
      </ReactFlow>

      {/* Ghost preview during connection drag - outside ReactFlow for proper positioning */}
      {ghostPreview && <GhostPreview ghostPreview={ghostPreview} />}

      {/* Custom delete confirmation dialog for bulk actions */}
      <ConfirmDialog
        isOpen={!!deleteConfirmation}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Items"
        message={
          deleteConfirmation?.type === 'edges'
            ? `Delete ${deleteConfirmation.count} selected connections? This action cannot be undone.`
            : `Delete ${deleteConfirmation?.count || 0} selected items? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Custom delete confirmation dialog for keyboard deletion */}
      <ConfirmDialog
        isOpen={!!nodeDeleteConfirmation}
        onClose={cancelNodeDelete}
        onConfirm={confirmNodeDelete}
        title="Delete Items"
        message={`Delete ${nodeDeleteConfirmation?.count || 0} selected items? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export const PipelineCanvas = ({ exportWizardOpen }: PipelineCanvasProps) => (
  <ReactFlowProvider>
    <PipelineCanvasInner exportWizardOpen={exportWizardOpen} />
  </ReactFlowProvider>
);
