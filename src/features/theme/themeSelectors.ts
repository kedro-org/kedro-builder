import type { RootState } from '../../types/redux';

export const selectTheme = (state: RootState) => state.theme.theme;
