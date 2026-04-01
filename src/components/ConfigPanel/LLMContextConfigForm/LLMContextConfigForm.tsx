import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { updateNode, deleteNode } from '@/features/nodes/nodesSlice';
import { clearPendingComponent } from '@/features/ui/uiSlice';
import type { KedroNode, LLMProvider } from '@/types/kedro';
import { Button } from '../../UI/Button/Button';
import { Input } from '../../UI/Input/Input';
import { ConfirmDialog } from '../../UI/ConfirmDialog';
import { isPythonKeyword } from '@/validation';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { dispatchConfigUpdated } from '@/constants';
import { LLM_PROVIDERS, DEFAULT_LLM_PROVIDER, DEFAULT_MODEL, DEFAULT_TEMPERATURE } from '@/constants/llm';
import './LLMContextConfigForm.scss';

interface PromptEntry {
  name: string;
}

interface LLMContextFormData {
  name: string;
  llmProvider: LLMProvider;
  modelName: string;
  temperature: number;
  prompts: PromptEntry[];
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

  const initialPrompts: PromptEntry[] =
    node.promptNames && node.promptNames.length > 0
      ? node.promptNames.map((n) => ({ name: n }))
      : [{ name: '' }];

  const {
    register,
    handleSubmit,
    control,
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
      prompts: initialPrompts,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prompts',
  });

  useEffect(() => {
    const prompts: PromptEntry[] =
      node.promptNames && node.promptNames.length > 0
        ? node.promptNames.map((n) => ({ name: n }))
        : [{ name: '' }];

    reset({
      name: node.name || '',
      llmProvider: node.llmProvider || DEFAULT_LLM_PROVIDER,
      modelName: node.modelName || DEFAULT_MODEL,
      temperature: node.temperature ?? DEFAULT_TEMPERATURE,
      prompts,
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
    const promptNames = data.prompts
      .map((p) => p.name.trim())
      .filter((n) => n.length > 0);

    dispatch(
      updateNode({
        id: node.id,
        changes: {
          name: data.name.trim(),
          llmProvider: data.llmProvider,
          modelName: data.modelName,
          temperature: data.temperature,
          promptNames,
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
        <span className="llm-context-form__helper">
          Catalog dataset names for prompt templates (e.g., system_prompt, user_prompt)
        </span>
        <div className="llm-context-form__prompt-list">
          {fields.map((field, index) => (
            <div key={field.id} className="llm-context-form__prompt-row">
              <input
                className="llm-context-form__prompt-input"
                placeholder="e.g., system_prompt"
                {...register(`prompts.${index}.name`, {
                  validate: (value) => {
                    if (value.trim() === '') return true; // Allow empty (will be filtered)
                    if (!/^[a-z][a-z0-9_]*$/.test(value.trim())) {
                      return 'Use snake_case';
                    }
                    return true;
                  },
                })}
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  className="llm-context-form__prompt-remove"
                  onClick={() => remove(index)}
                  aria-label="Remove prompt"
                >
                  x
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="llm-context-form__add-prompt"
            onClick={() => append({ name: '' })}
          >
            + Add prompt
          </button>
        </div>
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
