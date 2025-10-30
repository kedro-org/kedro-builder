import React from 'react';
import { DATASET_TYPES, groupDatasetTypesByCategory } from '../../../constants/datasetTypes';
import type { UseFormRegister } from 'react-hook-form';

interface DatasetTypeSelectProps {
  register: UseFormRegister<any>;
}

/**
 * Reusable dataset type selector with categorized options
 */
export const DatasetTypeSelect: React.FC<DatasetTypeSelectProps> = ({ register }) => {
  const groupedTypes = groupDatasetTypesByCategory();

  return (
    <div className="dataset-config-form__section">
      <label className="dataset-config-form__label">
        Dataset Type <span className="dataset-config-form__required">*</span>
      </label>
      <select className="dataset-config-form__select" {...register('type', { required: true })}>
        {Object.entries(groupedTypes).map(([category, types]) => (
          <optgroup key={category} label={category}>
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className="dataset-config-form__helper">
        Choose from {DATASET_TYPES.length} supported dataset types from kedro-datasets 3.0+
      </span>
    </div>
  );
};
