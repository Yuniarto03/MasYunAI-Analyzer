import React, { createContext, useState, ReactNode } from 'react';
import { Theme } from '../types';

export interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
}

const defaultTheme: Theme = {
  accent1: 'blue-400',
  accent2: 'purple-500', 
  accent3: 'green-400',
  accent4: 'yellow-400',
  darkBg: 'gray-900'
};

export const AppContext = createContext<AppContextType>({
  theme: defaultTheme,
  setTheme: () => {},
  reduceMotion: false,
  setReduceMotion: () => {}
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      reduceMotion,
      setReduceMotion
    }}>
      {children}
    </AppContext.Provider>
  );
};