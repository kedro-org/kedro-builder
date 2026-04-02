import { useForm } from 'react-hook-form';
import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateNode, deleteNode } from '@/features/nodes/nodesSlice';
import { clearPendingComponent } from '@/features/ui/uiSlice';
import { selectAllConnections } from '@/features/connections/connectionsSelectors';
import type { KedroNode, LLMProvider } from '@/types/kedro';
import { Button } from '../../UI/Button/Button';
import { Input } from '../../UI/Input/Input';
import { ConfirmDialog } from '../../UI/ConfirmDialog';
import { isPythonKeyword } from '@/validation';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { dispatchConfigUpdated } from '@/constants';
import { LLM_PROVIDERS, DEFAULT_LLM_PROVIDER, DEFAULT_MODEL, DEFAULT_TEMPERATURE, PROMPT_DATASET_TYPES } from '@/constants/llm';
import { isDatasetId } from '@/domain/IdGenerator';
import './LLMContextConfigForm.scss';

interface LLMContextFormData {
  name: string;
  llmProvider: LLMProvider;
  modelName: string;
  temperature: number;
}

interface LLMContextConfigFormProps {
  node: KedroNode;
  onClose: () => void;
}

export const LLMContextConfigForm: React.FC<LLMContextConfigFormProps> = ({ node, onClose }) => {
  const dispatch = useAppDispatch();

  const handleConfirmDelete = useCallback(() => {
    dispatch(deleteNode(node.id));
    dispatch(clearPendingComponent());
    onClose();
  }, [dispatch, node.id, onClose]);

  const deleteDialog = useConfirmDialog(handleConfirmDelete);

  const connections = useAppSelector(selectAllConnections);
  const datasetsById = useAppSelector((s) => s.datasets.byId);

  const connectedPromptNames = useMemo(() => {
    return connections
      .filter((c) => c.target === node.id && isDatasetId(c.source))
      .map((c) => datasetsById[c.source])
      .filter((ds) => ds && PROMPT_DATASET_TYPES.has(ds.type))
      .map((ds) => ds.name);
  }, [connections, datasetsById, node.id]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<LLMContextFormData>({
    defaultValues: {
      name: node.name || '',
      llmProvider: node.llmProvider || DEFAULT_LLM_PROVIDER,
      modelName: node.modelName || DEFAULT_MODEL,
      temperature: node.temperature ?? DEFAULT_TEMPERATURE,
    },
  });

  useEffect(() => {
    reset({
      name: node.name || '',
      llmProvider: node.llmProvider || DEFAULT_LLM_PROVIDER,
      modelName: node.modelName || DEFAULT_MODEL,
      temperature: node.temperature ?? DEFAULT_TEMPERATURE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, reset]);

  const watchProvider = watch('llmProvider');
  const watchTemperature = watch('temperature');

  const currentProviderConfig = LLM_PROVIDERS.find((p) => p.value === watchProvider);
  const availableModels = currentProviderConfig?.models ?? [];

  const handleProviderChange = (newProvider: LLMProvider) => {
    setValue('llmProvider', newProvider, { shouldDirty: true });
    const providerConfig = LLM_PROVIDERS.find((p) => p.value === newProvider);
    if (providerConfig && providerConfig.models.length > 0) {
      setValue('modelName', providerConfig.models[0], { shouldDirty: true });
    }
  };

  const onSubmit = (data: LLMContextFormData) => {
    dispatch(
      updateNode({
        id: node.id,
        changes: {
          name: data.name.trim(),
          llmProvider: data.llmProvider,
          modelName: data.modelName,
          temperature: data.temperature,
        },
      })
    );

    onClose();
    dispatchConfigUpdated();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="llm-context-form">
      <div className="llm-context-form__section">
        <Input
          label="Context Node Name"
          placeholder="e.g., response_context"
          error={errors.name?.message}
          helperText="Use snake_case naming. This becomes the output dataset name."
          required
          {...register('name', {
            required: 'Name is required',
            validate: (value) => {
              const trimmed = value.trim();
              if (trimmed.length === 0) return 'Name cannot be empty';
              if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
                return 'Must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
              }
              if (isPythonKeyword(trimmed)) {
                return `"${trimmed}" is a Python reserved keyword`;
              }
              return true;
            },
          })}
        />
      </div>

      <div className="llm-context-form__section">
        <label className="llm-context-form__label">LLM Provider</label>
        <div className="llm-context-form__provider-grid">
          {LLM_PROVIDERS.map((provider) => (
            <button
              key={provider.value}
              type="button"
              className={`llm-context-form__provider-btn ${
                watchProvider === provider.value ? 'llm-context-form__provider-btn--active' : ''
              }`}
              onClick={() => handleProviderChange(provider.value)}
            >
              {provider.label}
            </button>
          ))}
        </div>
      </div>

      <div className="llm-context-form__section">
        <label className="llm-context-form__label">Model</label>
        <select
          className="llm-context-form__select"
          {...register('modelName')}
        >
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div className="llm-context-form__section">
        <label className="llm-context-form__label">
          Temperature: {Number(watchTemperature).toFixed(1)}
        </label>
        <input
          type="range"
          className="llm-context-form__slider"
          min="0"
          max="2"
          step="0.1"
          {...register('temperature', { valueAsNumber: true })}
        />
        <div className="llm-context-form__slider-labels">
          <span>Precise (0.0)</span>
          <span>Creative (2.0)</span>
        </div>
      </div>

      <div className="llm-context-form__section">
        <label className="llm-context-form__label">Prompts</label>
        {connectedPromptNames.length > 0 ? (
          <div className="llm-context-form__prompt-list">
            {connectedPromptNames.map((name) => (
              <div key={name} className="llm-context-form__prompt-row">
                <span className="llm-context-form__prompt-readonly">{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="llm-context-form__helper">
            Connect text or YAML dataset nodes to this node to add prompts.
          </span>
        )}
      </div>

      <div className="llm-context-form__actions">
        <Button type="button" variant="danger" onClick={deleteDialog.open}>
          Delete
        </Button>
        <div className="llm-context-form__actions-right">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={deleteDialog.confirm}
        title="Delete LLM Context Node"
        message={`Are you sure you want to delete "${node.name || 'this node'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </form>
  );
};
