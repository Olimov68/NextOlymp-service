"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: "dark";
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Faqat dark mode
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
