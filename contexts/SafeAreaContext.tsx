import React, { createContext, useContext, ReactNode } from 'react';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

interface SafeAreaContextType {
  insets: EdgeInsets;
  safeAreaStyle: {
    paddingTop: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;
  };
}

const SafeAreaContext = createContext<SafeAreaContextType | undefined>(undefined);

interface SafeAreaProviderProps {
  children: ReactNode;
}

export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const insets = useSafeAreaInsets();

  const safeAreaStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const value: SafeAreaContextType = {
    insets,
    safeAreaStyle,
  };

  return (
    <SafeAreaContext.Provider value={value}>
      {children}
    </SafeAreaContext.Provider>
  );
}

export function useSafeArea() {
  const context = useContext(SafeAreaContext);
  if (context === undefined) {
    throw new Error('useSafeArea must be used within a SafeAreaProvider');
  }
  return context;
}