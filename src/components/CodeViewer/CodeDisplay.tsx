import { useMemo, useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/hooks';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import ini from 'highlight.js/lib/languages/ini';
import markdown from 'highlight.js/lib/languages/markdown';
import { generateFileTree, findFileByPath, getFileLanguage } from '../../utils/fileTreeGenerator';
import { logger } from '../../utils/logger';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import './CodeDisplay.scss';

// Register languages
hljs.registerLanguage('python', python);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('toml', ini);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('markdown', markdown);

export const CodeDisplay: React.FC = () => {
  const projectCurrent = useAppSelector((s) => s.project.current);
  const nodesById = useAppSelector((s) => s.nodes.byId);
  const nodesAllIds = useAppSelector((s) => s.nodes.allIds);
  const datasetsById = useAppSelector((s) => s.datasets.byId);
  const datasetsAllIds = useAppSelector((s) => s.datasets.allIds);
  const connectionsById = useAppSelector((s) => s.connections.byId);
  const connectionsAllIds = useAppSelector((s) => s.connections.allIds);
  const theme = useAppSelector((s) => s.theme.theme);
  const selectedFilePath = useAppSelector((s) => s.ui.selectedCodeFile);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const existingLink = document.getElementById('hljs-theme');
    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.id = 'hljs-theme';
    link.rel = 'stylesheet';
    link.href = theme === 'dark'
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
    document.head.appendChild(link);

    return () => {
      const linkToRemove = document.getElementById('hljs-theme');
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [theme]);

  // Generate file tree only when relevant domain data changes
  const fileTree = useMemo(() => {
    try {
      return generateFileTree({
        project: { current: projectCurrent },
        nodes: { byId: nodesById, allIds: nodesAllIds },
        datasets: { byId: datasetsById, allIds: datasetsAllIds },
        connections: { byId: connectionsById, allIds: connectionsAllIds },
      });
    } catch (error) {
      logger.error('Failed to generate file tree:', error);
      return null;
    }
  }, [projectCurrent, nodesById, nodesAllIds, datasetsById, datasetsAllIds, connectionsById, connectionsAllIds]);

  const selectedFile = useMemo(() => {
    if (!selectedFilePath || !fileTree) return null;
    return findFileByPath(fileTree, selectedFilePath);
  }, [fileTree, selectedFilePath]);

  // Apply syntax highlighting when content or theme changes
  useEffect(() => {
    if (codeRef.current && selectedFile?.content) {
      // Remove previous highlighting attribute to allow re-highlighting
      delete codeRef.current.dataset.highlighted;
      hljs.highlightElement(codeRef.current);
    }
  }, [selectedFile?.content, theme]);

  const handleCopy = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      toast.success('Copied to clipboard!');
    }
  };

  if (!fileTree) {
    return (
      <div className="code-display code-display--empty">
        <p>Failed to load file content</p>
      </div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="code-display code-display--empty">
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  if (selectedFile.type === 'folder') {
    return (
      <div className="code-display code-display--empty">
        <p>This is a folder. Select a file to view its contents.</p>
      </div>
    );
  }

  const language = getFileLanguage(selectedFile.name);

  return (
    <div className="code-display" data-theme={theme}>
      <div className="code-display__header">
        <h3 className="code-display__filename">
          {selectedFile.path}
        </h3>
        <button
          className="code-display__copy"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          <Copy size={16} />
          Copy
        </button>
      </div>
      <div className="code-display__content">
        <pre>
          <code ref={codeRef} className={`language-${language}`}>
            {selectedFile.content || '// Empty file'}
          </code>
        </pre>
      </div>
    </div>
  );
};
