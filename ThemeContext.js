// ThemeContext.js
import React, { createContext, useState, useMemo } from 'react';

export const ThemeContext = createContext();

const themes = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    card: '#F5F5F5',
    primary: '#4F46E5',
    textSecondary: '#555',
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    card: '#1E1E1E',
    primary: '#A1C4FC',
    textSecondary: '#AAA',
  },
  sepia: {
    background: '#F5ECD8',
    text: '#3E2C00',
    card: '#FFF4E0',
    primary: '#A98246',
    textSecondary: '#7B5E2B',
  },
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  const toggleTheme = () => {
    setMode((prev) =>
      prev === 'light' ? 'dark' : prev === 'dark' ? 'sepia' : 'light'
    );
  };

  const value = useMemo(
    () => ({
      theme: themes[mode],
      mode,
      isDark: mode === 'dark',
      toggleTheme,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};