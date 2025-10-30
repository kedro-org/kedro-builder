import { useEffect, useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectCodeFile } from '../../features/ui/uiSlice';
import { generateFileTree } from '../../utils/fileTreeGenerator';
import type { FileNode } from '../../utils/fileTreeGenerator';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import './FileTree.scss';

export const FileTree: React.FC = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((rootState) => rootState);
  const selectedFile = useAppSelector((rootState) => rootState.ui.selectedCodeFile);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Generate file tree from Redux state
  const fileTree = useMemo(() => {
    try {
      return generateFileTree(state);
    } catch (error) {
      console.error('Failed to generate file tree:', error);
      return null;
    }
  }, [state.project.current, state.nodes.allIds, state.datasets.allIds, state.connections.allIds]);

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
            style={{ paddingLeft: `${level * 16 + 12}px` }}
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
      return (
        <div
          key={node.path}
          className={`file-tree__file ${isSelected ? 'file-tree__file--selected' : ''}`}
          style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
          onClick={() => handleFileClick(node.path)}
        >
          <File size={16} className="file-tree__icon" />
          <span className="file-tree__name">{node.name}</span>
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
