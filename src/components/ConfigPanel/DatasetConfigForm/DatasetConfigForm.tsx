import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/store/hooks';
import { updateDataset, deleteDataset } from '@/features/datasets/datasetsSlice';
import { clearPendingComponent } from '@/features/ui/uiSlice';
import type { KedroDataset, DatasetType } from '@/types/kedro';
import { Button } from '../../UI/Button/Button';
import { Input } from '../../UI/Input/Input';
import { FilepathBuilder } from '../../UI/FilepathBuilder/FilepathBuilder';
import { ConfirmDialog } from '../../UI/ConfirmDialog';
import { DatasetTypeSelect } from './DatasetTypeSelect';
import { useFilepathBuilder } from './hooks/useFilepathBuilder';
import { isPythonKeyword } from '@/utils/validation';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { dispatchConfigUpdated } from '@/constants';
import { FILEPATH_EXEMPT_TYPES } from '@/constants/datasetTypes';
import './DatasetConfigForm.scss';

// Map dataset types to their expected file extensions
const DATASET_TYPE_EXTENSIONS: Record<string, string[]> = {
  csv: ['csv'],
  excel: ['xlsx', 'xls'],
  parquet: ['parquet', 'pq'],
  json: ['json'],
  yaml: ['yml', 'yaml'],
  pickle: ['pkl', 'pickle'],
  text: ['txt'],
  feather: ['feather'],
  orc: ['orc'],
  xml: ['xml'],
  gbq: [], // BigQuery doesn't use file extensions
  sql: [], // SQL doesn't use file extensions
  api: [], // API doesn't use file extensions
  memory: [], // Memory doesn't use files
};

// Get expected extensions for a dataset type
const getExpectedExtensions = (type: string): string[] => {
  return DATASET_TYPE_EXTENSIONS[type.toLowerCase()] || [];
};

// Get file extension from filepath
const getFileExtension = (filepath: string): string | null => {
  if (!filepath) return null;
  const filename = filepath.split('/').pop() || '';
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toLowerCase() || null;
  }
  return null;
};

interface DatasetFormData {
  name: string;
  type: DatasetType;
  filepath?: string;
  versioned?: boolean;
}

interface DatasetConfigFormProps {
  dataset: KedroDataset;
  onClose: () => void;
}

export const DatasetConfigForm: React.FC<DatasetConfigFormProps> = ({ dataset, onClose }) => {
  const dispatch = useAppDispatch();
  const [extensionWarning, setExtensionWarning] = useState<string>('');

  // Delete confirmation handler
  const handleConfirmDelete = useCallback(() => {
    dispatch(deleteDataset(dataset.id));
    dispatch(clearPendingComponent());
    onClose();
  }, [dispatch, dataset.id, onClose]);

  const deleteDialog = useConfirmDialog(handleConfirmDelete);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<DatasetFormData>({
    defaultValues: {
      name: dataset.name || '',
      type: dataset.type || 'csv',
      filepath: dataset.filepath || '',
      versioned: dataset.versioned || false,
    },
  });

  // Reset form when switching between different datasets
  // Only depends on dataset.id to avoid resetting during field edits
  useEffect(() => {
    reset({
      name: dataset.name || '',
      type: dataset.type || 'csv',
      filepath: dataset.filepath || '',
      versioned: dataset.versioned || false,
    });
    // Intentionally omit dataset.* fields - reset should only trigger on dataset switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset.id, reset]);

  const watchType = watch('type');
  const watchFilepath = watch('filepath');
  const watchName = watch('name');

  // Check for file extension mismatch
  const extensionMismatch = useMemo(() => {
    if (!watchFilepath || FILEPATH_EXEMPT_TYPES.has(watchType)) return null;

    const fileExt = getFileExtension(watchFilepath);
    if (!fileExt) return null;

    const expectedExts = getExpectedExtensions(watchType);
    if (expectedExts.length === 0) return null; // No extension requirements for this type

    if (!expectedExts.includes(fileExt)) {
      return {
        actual: fileExt,
        expected: expectedExts,
      };
    }
    return null;
  }, [watchFilepath, watchType]);

  // Update warning message when mismatch changes
  useEffect(() => {
    if (extensionMismatch) {
      const expectedStr = extensionMismatch.expected.length === 1
        ? `.${extensionMismatch.expected[0]}`
        : extensionMismatch.expected.map(e => `.${e}`).join(' or ');
      setExtensionWarning(
        `File extension ".${extensionMismatch.actual}" doesn't match ${watchType.toUpperCase()} dataset type. Expected: ${expectedStr}`
      );
    } else {
      setExtensionWarning('');
    }
  }, [extensionMismatch, watchType]);

  // Use custom hook for filepath building
  const { baseLocation, dataLayer, fileName, setBaseLocation, setDataLayer, setFileName } = useFilepathBuilder({
    initialFilepath: dataset.filepath || '',
    datasetName: watchName,
    datasetType: watchType,
    datasetId: dataset.id,
    setValue,
  });

  // Handle full path edit directly
  const handleFullPathChange = (fullPath: string) => {
    setValue('filepath', fullPath, { shouldDirty: true });
  };

  const onSubmit = (data: DatasetFormData) => {
    dispatch(
      updateDataset({
        id: dataset.id,
        changes: {
          name: data.name.trim(),
          type: data.type,
          filepath: !FILEPATH_EXEMPT_TYPES.has(data.type) ? data.filepath?.trim() : undefined,
          versioned: data.versioned || false,
        },
      })
    );

    // Don't clear pending here - ConfigPanel's handleClose will check if valid and clear it
    onClose();

    // Dispatch event to refresh validation if export wizard is open
    dispatchConfigUpdated();
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
                return 'Must start with lowercase letter and contain only lowercase letters, numbers, and underscores (no spaces)';
              }
              // Check for reserved Python keywords (complete list)
              if (isPythonKeyword(trimmed)) {
                return `"${trimmed}" is a Python reserved keyword`;
              }
              return true;
            },
          })}
        />
      </div>

      <DatasetTypeSelect
        value={watchType}
        onChange={(value) => setValue('type', value, { shouldDirty: true })}
      />

      {!FILEPATH_EXEMPT_TYPES.has(watchType) && (
        <div className="dataset-config-form__section">
          <FilepathBuilder
            baseLocation={baseLocation}
            dataLayer={dataLayer}
            fileName={fileName}
            datasetType={watchType}
            onBaseLocationChange={setBaseLocation}
            onDataLayerChange={setDataLayer}
            onFileNameChange={setFileName}
            onFullPathChange={handleFullPathChange}
          />
          {extensionWarning && (
            <span className="dataset-config-form__warning">
              ⚠️ {extensionWarning}
            </span>
          )}
        </div>
      )}

      {!FILEPATH_EXEMPT_TYPES.has(watchType) && (
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
        <Button type="button" variant="danger" onClick={deleteDialog.open}>
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

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={deleteDialog.confirm}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${dataset.name || 'this dataset'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </form>
  );
};
