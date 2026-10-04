import { createContext, useContext, useEffect, useState } from 'react';

/* eslint-disable react-refresh/only-export-components */

const THEME_STORAGE_KEY = 'alzpoint-theme';
const ACCENT_STORAGE_KEY = 'alzpoint-theme-accents';
const RADIUS_STORAGE_KEY = 'alzpoint-card-radius';
const THEMES = ['default', 'light', 'dark'];
export const THEME_RADII = [
  { id: 'square', label: 'Kotak', value: '0px' },
  { id: 'compact', label: 'Tipis', value: '8px' },
  { id: 'rounded', label: 'Sedang', value: '16px' },
  { id: 'soft', label: 'Lembut', value: '24px' },
];
export const THEME_ACCENTS = {
  default: [
    { id: 'indigo', label: 'Indigo', color: '#4f46e5' },
    { id: 'blue', label: 'Biru', color: '#2563eb' },
    { id: 'emerald', label: 'Emerald', color: '#059669' },
    { id: 'amber', label: 'Amber', color: '#d97706' },
    { id: 'rose', label: 'Rose', color: '#e11d48' },
  ],
  light: [
    { id: 'emerald', label: 'Emerald', color: '#059669' },
    { id: 'blue', label: 'Biru', color: '#2563eb' },
    { id: 'violet', label: 'Violet', color: '#7c3aed' },
    { id: 'amber', label: 'Amber', color: '#d97706' },
    { id: 'rose', label: 'Rose', color: '#e11d48' },
  ],
  dark: [
    { id: 'purple', label: 'Purple', color: '#a855f7' },
    { id: 'cyan', label: 'Cyan', color: '#06b6d4' },
    { id: 'emerald', label: 'Emerald', color: '#10b981' },
    { id: 'amber', label: 'Amber', color: '#f59e0b' },
    { id: 'pink', label: 'Pink', color: '#ec4899' },
  ],
};

const DEFAULT_ACCENTS = {
  default: 'indigo',
  light: 'emerald',
  dark: 'purple',
};

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return THEMES.includes(savedTheme) ? savedTheme : 'default';
    } catch {
      return 'default';
    }
  });
  const [accents, setAccents] = useState(() => {
    try {
      const savedAccents = JSON.parse(window.localStorage.getItem(ACCENT_STORAGE_KEY));
      return { ...DEFAULT_ACCENTS, ...savedAccents };
    } catch {
      return DEFAULT_ACCENTS;
    }
  });
  const [radius, setRadius] = useState(() => {
    try {
      const savedRadius = window.localStorage.getItem(RADIUS_STORAGE_KEY);
      return THEME_RADII.some((option) => option.id === savedRadius) ? savedRadius : 'rounded';
    } catch {
      return 'rounded';
    }
  });
  const availableAccents = THEME_ACCENTS[theme];
  const accent = availableAccents.find((option) => option.id === accents[theme]) || availableAccents[0];
  const selectedRadius = THEME_RADII.find((option) => option.id === radius) || THEME_RADII[2];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty('--theme-accent', accent.color);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      window.localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify(accents));
    } catch {
      // Theme remains available for this session when storage is disabled.
    }
  }, [theme, accents, accent.color]);

  useEffect(() => {
    document.documentElement.dataset.radius = radius;
    document.documentElement.style.setProperty('--card-radius', selectedRadius.value);

    try {
      window.localStorage.setItem(RADIUS_STORAGE_KEY, radius);
    } catch {
      // Radius remains available for this session when storage is disabled.
    }
  }, [radius, selectedRadius.value]);

  const setAccent = (accentId) => {
    if (!availableAccents.some((option) => option.id === accentId)) return;
    setAccents((currentAccents) => ({ ...currentAccents, [theme]: accentId }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent, radius, setRadius }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}