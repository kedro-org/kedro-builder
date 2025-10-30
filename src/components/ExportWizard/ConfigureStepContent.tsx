import React from 'react';
import { Download, Database, FunctionSquare, GitBranch } from 'lucide-react';

interface ConfigureStepContentProps {
  projectName: string;
  nodesCount: number;
  datasetsCount: number;
  hasWarnings: boolean;
  warningsCount: number;
  onProjectNameChange: (name: string) => void;
  onBack: () => void;
  onExport: () => void;
}

export const ConfigureStepContent: React.FC<ConfigureStepContentProps> = ({
  projectName,
  nodesCount,
  datasetsCount,
  onProjectNameChange,
  onBack,
  onExport,
}) => {
  const isValid = projectName.trim() !== '' && /^[a-zA-Z0-9_-]+$/.test(projectName);
  const pipelinesCount = 1; // Always 1 pipeline for now

  return (
    <div className="export-wizard__configure">
      {/* Summary Cards */}
      <div className="export-wizard__summary-cards">
        <div className="export-wizard__summary-card">
          <div className="export-wizard__summary-card-icon">
            <Database size={24} />
          </div>
          <div className="export-wizard__summary-card-content">
            <div className="export-wizard__summary-card-label">Datasets</div>
            <div className="export-wizard__summary-card-value">{datasetsCount}</div>
          </div>
        </div>

        <div className="export-wizard__summary-card">
          <div className="export-wizard__summary-card-icon">
            <FunctionSquare size={24} />
          </div>
          <div className="export-wizard__summary-card-content">
            <div className="export-wizard__summary-card-label">Nodes</div>
            <div className="export-wizard__summary-card-value">{nodesCount}</div>
          </div>
        </div>

        <div className="export-wizard__summary-card">
          <div className="export-wizard__summary-card-icon">
            <GitBranch size={24} />
          </div>
          <div className="export-wizard__summary-card-content">
            <div className="export-wizard__summary-card-label">Pipelines</div>
            <div className="export-wizard__summary-card-value">{pipelinesCount}</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="export-wizard__configure-content">
        {/* Left Column: Form */}
        <div className="export-wizard__configure-left">
          <div className="export-wizard__field">
            <label htmlFor="project-name">Kedro project name*</label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="my-first-project"
            />
            {!isValid && projectName && (
              <small className="export-wizard__field-error">
                Only letters, numbers, hyphens, and underscores allowed
              </small>
            )}
          </div>

          <div className="export-wizard__field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Add text"
              rows={4}
            />
          </div>
        </div>

        {/* Right Column: What will be exported */}
        <div className="export-wizard__configure-right">
          <h4>What will be exported:</h4>
          <ul className="export-wizard__export-list">
            <li>Complete Kedro project structure</li>
            <li>Pipeline code (nodes.py, pipeline.py)</li>
            <li>Data catalog configuration</li>
            <li>Project configuration files</li>
            <li>README with setup instructions</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="export-wizard__actions">
        <button
          className="export-wizard__button export-wizard__button--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="export-wizard__button export-wizard__button--primary"
          onClick={onExport}
          disabled={!isValid}
        >
          <Download size={18} />
          Download ZIP
        </button>
      </div>
    </div>
  );
};
