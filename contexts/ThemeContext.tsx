import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ActiveTheme = 'light' | 'dark';

interface Colors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // UI colors
  primary: string;
  secondary: string;
  accent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Interactive colors
  buttonPrimary: string;
  buttonSecondary: string;
  buttonText: string;
  
  // Overlay colors
  overlay: string;
  modal: string;
  
  // Gradient colors
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
}

interface Theme {
  mode: ActiveTheme;
  colors: Colors;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  activeTheme: ActiveTheme;
}

const lightColors: Colors = {
  // Background colors
  background: '#ffffff',
  surface: '#f8fafc',
  card: 'rgba(255, 255, 255, 0.95)',
  
  // Text colors
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  
  // UI colors
  primary: '#3b82f6',
  secondary: '#667eea',
  accent: '#10b981',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border and divider colors
  border: '#e5e7eb',
  divider: '#f3f4f6',
  
  // Interactive colors
  buttonPrimary: '#3b82f6',
  buttonSecondary: '#f3f4f6',
  buttonText: '#ffffff',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  modal: '#ffffff',
  
  // Gradient colors
  gradientStart: '#667eea',
  gradientMiddle: '#764ba2',
  gradientEnd: '#f093fb',
};

const darkColors: Colors = {
  // Background colors
  background: '#111827',
  surface: '#1f2937',
  card: 'rgba(31, 41, 55, 0.95)',
  
  // Text colors
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  
  // UI colors
  primary: '#60a5fa',
  secondary: '#818cf8',
  accent: '#34d399',
  
  // Status colors
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  
  // Border and divider colors
  border: '#374151',
  divider: '#2d3748',
  
  // Interactive colors
  buttonPrimary: '#60a5fa',
  buttonSecondary: '#374151',
  buttonText: '#ffffff',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  modal: '#1f2937',
  
  // Gradient colors
  gradientStart: '#4c1d95',
  gradientMiddle: '#581c87',
  gradientEnd: '#7c2d12',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setCurrentThemeMode] = useState<ThemeMode>('auto');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Load saved theme mode on app start
  useEffect(() => {
    loadSavedThemeMode().catch((error) => {
      console.error('❌ Failed to load saved theme mode:', error);
    });
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadSavedThemeMode = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeMode && ['light', 'dark', 'auto'].includes(savedThemeMode)) {
        setCurrentThemeMode(savedThemeMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading saved theme mode:', error);
      // Don't throw, just use default
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setCurrentThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
      // Still update the current theme mode even if saving fails
      setCurrentThemeMode(mode);
      throw error; // Re-throw so UI can handle the error
    }
  };

  // Determine the active theme based on mode and system preference
  const activeTheme: ActiveTheme = React.useMemo(() => {
    if (themeMode === 'auto') {
      return systemTheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemTheme]);

  // Create theme object
  const theme: Theme = React.useMemo(() => {
    const colors = activeTheme === 'dark' ? darkColors : lightColors;
    return {
      mode: activeTheme,
      colors,
      isDark: activeTheme === 'dark',
    };
  }, [activeTheme]);

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    activeTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper hook for creating themed styles
export function useThemedStyles<T>(
  styleCreator: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return React.useMemo(() => styleCreator(theme), [theme, styleCreator]);
}