import { useCallback, useState, useMemo } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { clearSelection, selectNodes, addNode } from '../../../features/nodes/nodesSlice';
import { addDataset } from '../../../features/datasets/datasetsSlice';
import { generateCopyId, isNodeId, isDatasetId } from '../../../domain/IdGenerator';
import { logger } from '../../../utils/logger';
import { trackEvent } from '../../../infrastructure/telemetry';
import type { KedroNode, KedroDataset } from '../../../types/kedro';

interface CopiedItems {
  nodes: KedroNode[];
  datasets: KedroDataset[];
}

const PASTE_OFFSET = 50;

/**
 * Hook for copy/paste functionality
 * Handles copying selected nodes/datasets and pasting them with smart name generation
 */
export const useCopyPaste = (
  selectedNodeIds: string[],
  reduxNodes: KedroNode[],
  reduxDatasets: KedroDataset[]
) => {
  const dispatch = useAppDispatch();
  const [copiedItems, setCopiedItems] = useState<CopiedItems | null>(null);

  // Create Maps for O(1) lookup instead of O(n) array.find()
  const nodesById = useMemo(
    () => new Map(reduxNodes.map((node) => [node.id, node])),
    [reduxNodes]
  );

  const datasetsById = useMemo(
    () => new Map(reduxDatasets.map((dataset) => [dataset.id, dataset])),
    [reduxDatasets]
  );

  // Memoize existing names set for paste operation
  const existingNamesSet = useMemo(
    () => new Set([...reduxNodes.map((n) => n.name), ...reduxDatasets.map((d) => d.name)]),
    [reduxNodes, reduxDatasets]
  );

  // Generate unique name with smart _copy suffix
  const generateUniqueName = useCallback((baseName: string, existingNames: Set<string>): string => {
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    // Check if name already has _copy suffix
    const copyMatch = baseName.match(/^(.+)_copy(_(\d+))?$/);
    if (copyMatch) {
      const nameWithoutSuffix = copyMatch[1];
      const currentNum = copyMatch[3] ? parseInt(copyMatch[3], 10) : 1;

      // Find next available number
      let nextNum = currentNum + 1;
      while (existingNames.has(`${nameWithoutSuffix}_copy_${nextNum}`)) {
        nextNum++;
      }
      return `${nameWithoutSuffix}_copy_${nextNum}`;
    }

    // First copy
    const newName = `${baseName}_copy`;
    if (!existingNames.has(newName)) {
      return newName;
    }

    // Find next available _copy_N
    let num = 2;
    while (existingNames.has(`${baseName}_copy_${num}`)) {
      num++;
    }
    return `${baseName}_copy_${num}`;
  }, []);

  // Copy selected items to state - uses Map for O(1) lookups
  const handleCopy = useCallback(() => {
    if (selectedNodeIds.length === 0) return;

    const nodesToCopy: KedroNode[] = [];
    const datasetsToCopy: KedroDataset[] = [];

    // O(1) lookup per ID instead of O(n)
    selectedNodeIds.forEach((id) => {
      if (isNodeId(id)) {
        const node = nodesById.get(id);
        if (node) nodesToCopy.push(node);
      } else if (isDatasetId(id)) {
        const dataset = datasetsById.get(id);
        if (dataset) datasetsToCopy.push(dataset);
      }
    });

    setCopiedItems({
      nodes: nodesToCopy,
      datasets: datasetsToCopy,
    });

    logger.debug('Copied items:', { nodes: nodesToCopy.length, datasets: datasetsToCopy.length });

    trackEvent('items_copied', {
      nodeCount: nodesToCopy.length,
      datasetCount: datasetsToCopy.length,
    });
  }, [selectedNodeIds, nodesById, datasetsById]);

  // Paste copied items with offset and smart naming
  const handlePaste = useCallback(() => {
    if (!copiedItems || (copiedItems.nodes.length === 0 && copiedItems.datasets.length === 0)) {
      return;
    }

    // Clone the memoized set for mutation during paste
    const existingNames = new Set(existingNamesSet);

    const newlyCreatedIds: string[] = [];

    // Paste nodes
    copiedItems.nodes.forEach((node) => {
      const newId = generateCopyId('node');
      const newName = generateUniqueName(node.name, existingNames);
      existingNames.add(newName); // Add to set to avoid duplicates within the paste operation

      const newNode: KedroNode = {
        ...node,
        id: newId,
        name: newName,
        position: {
          x: node.position.x + PASTE_OFFSET,
          y: node.position.y + PASTE_OFFSET,
        },
      };

      dispatch(addNode(newNode));
      newlyCreatedIds.push(newId);
    });

    // Paste datasets
    copiedItems.datasets.forEach((dataset) => {
      const newId = generateCopyId('dataset');
      const newName = generateUniqueName(dataset.name, existingNames);
      existingNames.add(newName);

      const newDataset: KedroDataset = {
        ...dataset,
        id: newId,
        name: newName,
        position: {
          x: dataset.position.x + PASTE_OFFSET,
          y: dataset.position.y + PASTE_OFFSET,
        },
      };

      dispatch(addDataset(newDataset));
      newlyCreatedIds.push(newId);
    });

    // Select newly pasted items
    dispatch(clearSelection());
    dispatch(selectNodes(newlyCreatedIds));

    logger.debug('Pasted items:', newlyCreatedIds);

    trackEvent('items_pasted', {
      nodeCount: copiedItems.nodes.length,
      datasetCount: copiedItems.datasets.length,
    });
  }, [copiedItems, existingNamesSet, dispatch, generateUniqueName]);

  return {
    handleCopy,
    handlePaste,
    hasCopiedItems: !!copiedItems && (copiedItems.nodes.length > 0 || copiedItems.datasets.length > 0),
  };
};
