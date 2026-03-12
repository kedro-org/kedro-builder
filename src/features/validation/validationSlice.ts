import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ValidationState } from '../../types/redux';
import type { ValidationResult } from '../../utils/validation';

const initialState: ValidationState = {
  errors: [],
  warnings: [],
  isValid: true,
  lastChecked: null,
};

const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    setValidationResults: (state, action: PayloadAction<ValidationResult>) => {
      const { errors, warnings, isValid } = action.payload;
      state.errors = errors;
      state.warnings = warnings;
      state.isValid = isValid;
      state.lastChecked = Date.now();
    },
    clearValidation: (state) => {
      state.errors = [];
      state.warnings = [];
      state.isValid = true;
      state.lastChecked = null;
    },
  },
});

export const {
  setValidationResults,
  clearValidation,
} = validationSlice.actions;

export default validationSlice.reducer;
