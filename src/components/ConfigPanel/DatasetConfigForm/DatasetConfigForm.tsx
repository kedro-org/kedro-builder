import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../../store/hooks';
import { updateDataset, deleteDataset } from '../../../features/datasets/datasetsSlice';
import { clearPendingComponent } from '../../../features/ui/uiSlice';
import type { KedroDataset, DatasetType } from '../../../types/kedro';
import { Button } from '../../UI/Button/Button';
import { Input } from '../../UI/Input/Input';
import { FilepathBuilder } from '../../UI/FilepathBuilder/FilepathBuilder';
import { DatasetTypeSelect } from './DatasetTypeSelect';
import { useFilepathBuilder } from './hooks/useFilepathBuilder';
import './DatasetConfigForm.scss';

interface DatasetFormData {
  name: string;
  type: DatasetType;
  filepath?: string;
  description?: string;
  versioned?: boolean;
}

interface DatasetConfigFormProps {
  dataset: KedroDataset;
  onClose: () => void;
}

export const DatasetConfigForm: React.FC<DatasetConfigFormProps> = ({ dataset, onClose }) => {
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<DatasetFormData>({
    defaultValues: {
      name: dataset.name || '',
      type: dataset.type || 'csv',
      filepath: dataset.filepath || '',
      description: dataset.description || '',
      versioned: dataset.versioned || false,
    },
  });

  const watchType = watch('type');

  // Use custom hook for filepath building
  const { baseLocation, dataLayer, fileName, setBaseLocation, setDataLayer, setFileName } = useFilepathBuilder({
    initialFilepath: dataset.filepath || '',
    setValue,
  });

  const onSubmit = (data: DatasetFormData) => {
    dispatch(
      updateDataset({
        id: dataset.id,
        changes: {
          name: data.name.trim(),
          type: data.type,
          filepath: data.type !== 'memory' ? data.filepath?.trim() : undefined,
          description: data.description?.trim(),
          versioned: data.versioned || false,
        },
      })
    );

    // Don't clear pending here - ConfigPanel's handleClose will check if valid and clear it
    onClose();

    // Dispatch event to refresh validation if export wizard is open
    window.dispatchEvent(new CustomEvent('configUpdated'));
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete dataset "${dataset.name}"?`)) {
      dispatch(deleteDataset(dataset.id));
      dispatch(clearPendingComponent());
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="dataset-config-form">
      <div className="dataset-config-form__section">
        <Input
          label="Dataset Name"
          placeholder="e.g., raw_companies_data"
          error={errors.name?.message}
          helperText="Use snake_case naming (lowercase with underscores)"
          required
          {...register('name', {
            required: 'Dataset name is required',
            validate: (value) => {
              const trimmed = value.trim();
              if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
                return 'Must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
              }
              // Check for reserved Python keywords
              const reserved = ['for', 'if', 'else', 'while', 'def', 'class', 'return', 'import'];
              if (reserved.includes(trimmed)) {
                return `"${trimmed}" is a Python reserved keyword`;
              }
              return true;
            },
          })}
        />
      </div>

      <DatasetTypeSelect register={register} />

      {watchType !== 'memory' && (
        <div className="dataset-config-form__section">
          <FilepathBuilder
            baseLocation={baseLocation}
            dataLayer={dataLayer}
            fileName={fileName}
            datasetType={watchType}
            onBaseLocationChange={setBaseLocation}
            onDataLayerChange={setDataLayer}
            onFileNameChange={setFileName}
          />
        </div>
      )}

      <div className="dataset-config-form__section">
        <label className="dataset-config-form__label">Description</label>
        <textarea
          className="dataset-config-form__textarea"
          rows={3}
          placeholder="Describe this dataset..."
          {...register('description')}
        />
      </div>

      {watchType !== 'memory' && (
        <div className="dataset-config-form__section">
          <label className="dataset-config-form__checkbox-label">
            <input type="checkbox" className="dataset-config-form__checkbox" {...register('versioned')} />
            <span className="dataset-config-form__checkbox-text">
              Enable versioning
              <span className="dataset-config-form__helper dataset-config-form__helper--inline">
                Kedro will create timestamped versions for time-travel and audit trails
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="dataset-config-form__actions">
        <Button type="button" variant="danger" onClick={handleDelete}>
          Delete
        </Button>
        <div className="dataset-config-form__actions-right">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
};
