'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore, useTransition } from 'react';
import { storage } from './storage';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function subscribeToStorage(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [, startTransition] = useTransition();
  const [userTheme, setUserTheme] = useState<Theme | null>(null);

  // useSyncExternalStore ensures SSR and initial client hydration match,
  // transitioning mounted to true only on the client without setState in useEffect.
  const mounted = useSyncExternalStore(
    subscribeToStorage,
    () => true,
    () => false
  );

  // In SSR and first client hydration, default to 'dark'.
  // Once mounted, restore saved theme from localStorage unless explicitly changed by user.
  const theme: Theme = userTheme ?? (mounted ? storage.getTheme() : 'dark');

  useEffect(() => {
    if (!mounted) return;
    // Apply theme class to <html> element
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    storage.saveTheme(theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    storage.saveTheme(newTheme);
    startTransition(() => {
      setUserTheme(newTheme);
    });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: mounted ? theme === 'dark' : true,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
