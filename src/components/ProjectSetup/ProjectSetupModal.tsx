import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../types/redux';
import { createProject as createProjectAction, clearProject } from '../../features/project/projectSlice';
import { closeProjectSetup, setHasActiveProject } from '../../features/ui/uiSlice';
import { clearNodes } from '../../features/nodes/nodesSlice';
import { clearDatasets } from '../../features/datasets/datasetsSlice';
import { clearConnections } from '../../features/connections/connectionsSlice';
import { clearProjectFromLocalStorage } from '../../utils/localStorage';
import { trackEvent } from '../../utils/telemetry';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import './ProjectSetupModal.scss';

export const ProjectSetupModal: React.FC = () => {
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.project.current);
  const isEditing = currentProject !== null;

  const [projectName, setProjectName] = useState(currentProject?.name || 'my-first-project');
  const [description, setDescription] = useState(currentProject?.description || '');
  const [nameError, setNameError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Update form when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setProjectName(currentProject.name);
      setDescription(currentProject.description || '');
    }
  }, [currentProject]);

  // Validate project name (alphanumeric, hyphens, underscores, no spaces)
  const validateProjectName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('Project name is required');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setNameError('Only letters, numbers, hyphens, and underscores allowed');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreate = () => {
    const isNameValid = validateProjectName(projectName);

    if (isNameValid) {
      // Create project with generated ID, timestamps, etc.
      dispatch(createProjectAction({
        name: projectName,
        description: description.trim(),
        pythonPackage: projectName.replace(/-/g, '_'), // Convert kebab-case to snake_case
        pipelineName: '__default__',
      }));

      // Track project creation
      trackEvent(isEditing ? 'project_updated' : 'project_created', {
        hasDescription: description.trim().length > 0,
      });

      // Set hasActiveProject to true so EmptyState is hidden
      dispatch(setHasActiveProject(true));

      // Close the modal
      dispatch(closeProjectSetup());
    }
  };

  const handleCancel = () => {
    dispatch(closeProjectSetup());
  };

  const handleResetProject = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    // Clear all Redux state
    dispatch(clearProject());
    dispatch(clearNodes());
    dispatch(clearDatasets());
    dispatch(clearConnections());

    // Clear localStorage
    clearProjectFromLocalStorage();

    // Update UI state
    dispatch(setHasActiveProject(false));

    // Close dialogs
    setShowResetConfirm(false);
    dispatch(closeProjectSetup());

    console.log('🗑️ Project reset');
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    if (nameError) validateProjectName(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="project-setup-modal">
      <div className="project-setup-modal__backdrop" onClick={handleCancel} />

      <div className="project-setup-modal__container">
        <h2 className="project-setup-modal__title">
          {isEditing ? 'Edit project' : 'Set up your project'}
        </h2>

        <div className="project-setup-modal__form">
          {/* Project Name */}
          <div className="project-setup-modal__field">
            <label htmlFor="project-name" className="project-setup-modal__label">
              Project name<span className="project-setup-modal__required">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className={`project-setup-modal__input ${
                nameError ? 'project-setup-modal__input--error' : ''
              }`}
              value={projectName}
              onChange={handleProjectNameChange}
              onKeyDown={handleKeyDown}
              placeholder="my-first-project"
              autoFocus
            />
            {nameError && <span className="project-setup-modal__error">{nameError}</span>}
            <span className="project-setup-modal__helper">
              Use lowercase letters, numbers, hyphens, and underscores
            </span>
          </div>

          {/* Description */}
          <div className="project-setup-modal__field">
            <label htmlFor="project-description" className="project-setup-modal__label">
              Description
            </label>
            <textarea
              id="project-description"
              className="project-setup-modal__textarea"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Describe what this pipeline does..."
              rows={3}
            />
            <span className="project-setup-modal__helper">
              Optional: Add a brief description of your pipeline
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="project-setup-modal__actions">
          <button
            className="project-setup-modal__button project-setup-modal__button--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          {isEditing && (
            <button
              className="project-setup-modal__button project-setup-modal__button--reset"
              onClick={handleResetProject}
            >
              Reset project
            </button>
          )}
          <button
            className="project-setup-modal__button project-setup-modal__button--create"
            onClick={handleCreate}
          >
            {isEditing ? 'Apply changes' : 'Create Project'}
          </button>
        </div>
      </div>

      {/* Reset confirmation dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Reset Project"
        message="Are you sure you want to reset the project? This will clear all current work and cannot be undone."
        confirmLabel="Reset"
        variant="danger"
      />
    </div>
  );
};
