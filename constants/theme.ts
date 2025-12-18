
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  card: string;
  error: string;
}

export const AccentColors = [
  { name: 'Purple', color: '#BB86FC' },
  { name: 'Blue', color: '#2196F3' },
  { name: 'Green', color: '#03DAC6' },
  { name: 'Red', color: '#CF6679' },
  { name: 'Orange', color: '#FF9800' },
  { name: 'Pink', color: '#E91E63' },
];

export const getThemeColors = (mode: 'light' | 'dark', accent: string): ThemeColors => {
  if (mode === 'dark') {
    return {
      background: '#000000',
      surface: '#1A1A1A',
      card: '#2C2C2E',
      text: '#FFFFFF',
      textSecondary: '#EBEBF5',
      accent: accent,
      border: '#38383A',
      error: '#FF453A',
    };
  }
  return {
    background: '#FFFFFF',
    surface: '#F2F2F7',
    card: '#F2F2F7',
    text: '#000000',
    textSecondary: '#6C6C70',
    accent: accent,
    border: '#D1D1D6',
    error: '#FF3B30',
  };
};
