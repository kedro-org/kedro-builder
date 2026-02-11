import { useEffect, useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useStore } from 'react-redux';
import { selectCodeFile } from '../../features/ui/uiSlice';
import { selectFileTreeDependencies, selectSelectedCodeFile } from '../../features/ui/uiSelectors';
import { generateFileTree } from '../../utils/fileTreeGenerator';
import type { FileNode } from '../../utils/fileTreeGenerator';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import { calculateTreeIndent } from '../../constants/fileTree';
import { logger } from '../../utils/logger';
import type { RootState } from '../../types/redux';
import './FileTree.scss';

export const FileTree: React.FC = () => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  // Use specific selectors instead of selecting entire state
  // This prevents re-renders on unrelated state changes
  const { projectCurrent, nodeIds, datasetIds, connectionIds } = useAppSelector(selectFileTreeDependencies);
  const selectedFile = useAppSelector(selectSelectedCodeFile);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Generate file tree from Redux state
  // nodeIds, datasetIds, connectionIds trigger re-computation when data changes
  const fileTree = useMemo(() => {
    // Only generate if project exists
    if (!projectCurrent) return null;

    try {
      // Get the full state only when we need to generate the tree
      return generateFileTree(store.getState());
    } catch (error) {
      logger.error('Failed to generate file tree:', error);
      return null;
    }
    // nodeIds, datasetIds, connectionIds are intentional deps for triggering recomputation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectCurrent, nodeIds, datasetIds, connectionIds, store]);

  // Initialize expanded folders
  useEffect(() => {
    if (!fileTree) return;

    const expanded = new Set<string>();
    const collectExpandedPaths = (node: FileNode) => {
      if (node.type === 'folder' && node.expanded) {
        expanded.add(node.path);
      }
      node.children?.forEach(collectExpandedPaths);
    };
    collectExpandedPaths(fileTree);
    setExpandedFolders(expanded);
  }, [fileTree]);

  const handleFileClick = (path: string) => {
    dispatch(selectCodeFile(path));
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, level: number = 0): React.ReactNode => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.path} className="file-tree__folder">
          <div
            className="file-tree__folder-header"
            style={{ '--tree-indent': calculateTreeIndent(level) } as React.CSSProperties}
            onClick={() => toggleFolder(node.path)}
          >
            {hasChildren && (
              <>
                {isExpanded ? (
                  <ChevronDown size={16} className="file-tree__chevron" />
                ) : (
                  <ChevronRight size={16} className="file-tree__chevron" />
                )}
              </>
            )}
            {!hasChildren && <span className="file-tree__spacer" />}
            <Folder size={16} className="file-tree__icon" />
            <span className="file-tree__name">{node.name}</span>
          </div>
          {isExpanded && hasChildren && (
            <div className="file-tree__children">
              {node.children!.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      const isSelected = selectedFile === node.path;
      const isKeyFile = node.isKeyFile === true;
      return (
        <div
          key={node.path}
          className={`file-tree__file ${isSelected ? 'file-tree__file--selected' : ''} ${isKeyFile ? 'file-tree__file--key' : ''}`}
          style={{ '--tree-indent': calculateTreeIndent(level, true) } as React.CSSProperties}
          onClick={() => handleFileClick(node.path)}
        >
          <File size={16} className="file-tree__icon" />
          <span className="file-tree__name">{node.name}</span>
          {isKeyFile && <span className="file-tree__badge">M</span>}
        </div>
      );
    }
  };

  if (!fileTree) {
    return (
      <div className="file-tree file-tree--empty">
        <p>Failed to load file tree</p>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {renderNode(fileTree)}
    </div>
  );
};
