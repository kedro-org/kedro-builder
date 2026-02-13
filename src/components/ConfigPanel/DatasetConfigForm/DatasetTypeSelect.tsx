import React, { useMemo } from 'react';
import { DATASET_TYPES } from '@/constants/datasetTypes';
import { SearchableSelect } from '../../common/SearchableSelect';
import type { SearchableSelectOption } from '../../common/SearchableSelect';
import type { DatasetType } from '@/types/kedro';

interface DatasetTypeSelectProps {
  value: DatasetType;
  onChange: (value: DatasetType) => void;
}

/**
 * Reusable dataset type selector with search functionality
 */
export const DatasetTypeSelect: React.FC<DatasetTypeSelectProps> = ({ value, onChange }) => {
  // Transform dataset types into SearchableSelectOption format
  const options: SearchableSelectOption[] = useMemo(() => {
    return DATASET_TYPES.map((type) => ({
      value: type.value,
      label: type.label,
      category: type.category,
    }));
  }, []);

  return (
    <div className="dataset-config-form__section">
      <label className="dataset-config-form__label">
        Dataset Type <span className="dataset-config-form__required">*</span>
      </label>
      <SearchableSelect
        options={options}
        value={value}
        onChange={(newValue) => onChange(newValue as DatasetType)}
        placeholder="Search dataset types..."
        grouped={true}
      />
      <span className="dataset-config-form__helper">
        Choose from {DATASET_TYPES.length} supported dataset types from kedro-datasets 3.0+.{' '}
        <a
          href="https://docs.kedro.org/projects/kedro-datasets/en/latest/"
          target="_blank"
          rel="noopener noreferrer"
          className="dataset-config-form__link"
        >
          View docs
        </a>
      </span>
    </div>
  );
};
