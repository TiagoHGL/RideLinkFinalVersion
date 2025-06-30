import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AutoFillData {
  pickup?: {
    address: string;
    coordinates?: { latitude: number; longitude: number };
    placeId?: string;
  };
  destination?: {
    address: string;
    coordinates?: { latitude: number; longitude: number };
    placeId?: string;
  };
  source: 'favorite-place' | 'favorite-route';
  timestamp: number;
}

interface AutoFillContextType {
  autoFillData: AutoFillData | null;
  setAutoFillData: (data: AutoFillData | null) => void;
  clearAutoFillData: () => void;
}

const AutoFillContext = createContext<AutoFillContextType | undefined>(undefined);

interface AutoFillProviderProps {
  children: ReactNode;
}

export function AutoFillProvider({ children }: AutoFillProviderProps) {
  const [autoFillData, setAutoFillData] = useState<AutoFillData | null>(null);

  const clearAutoFillData = () => {
    setAutoFillData(null);
  };

  const value: AutoFillContextType = {
    autoFillData,
    setAutoFillData,
    clearAutoFillData,
  };

  return (
    <AutoFillContext.Provider value={value}>
      {children}
    </AutoFillContext.Provider>
  );
}

export function useAutoFill() {
  const context = useContext(AutoFillContext);
  if (context === undefined) {
    throw new Error('useAutoFill must be used within an AutoFillProvider');
  }
  return context;
}