"use client";

import { createContext, useContext } from "react";

type Theme = "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark mode only — light mode o'chirilgan
  const theme: Theme = "dark";

  const setTheme = () => {
    // No-op: faqat dark mode
  };

  const toggleTheme = () => {
    // No-op: faqat dark mode
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
