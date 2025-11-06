import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ThemeState } from '../../types/redux';

// Load theme from localStorage or default to light
const savedTheme = localStorage.getItem('kedro_builder_theme') as 'light' | 'dark' | null;

const initialState: ThemeState = {
  theme: savedTheme || 'light', // Default to light theme
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      // Save to localStorage
      localStorage.setItem('kedro_builder_theme', action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      // Save to localStorage
      localStorage.setItem('kedro_builder_theme', state.theme);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
