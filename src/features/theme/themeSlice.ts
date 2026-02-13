import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS, safeGetItem } from '../../constants';
import type { ThemeState } from '../../types/redux';

const getInitialTheme = (): ThemeState['theme'] => {
  const storedTheme = safeGetItem(STORAGE_KEYS.THEME);
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light';
};

const initialState: ThemeState = {
  theme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
