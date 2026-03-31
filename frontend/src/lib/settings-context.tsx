"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { api } from "./api";

export interface PublicSettings {
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_language: string;
  loading: boolean;
}

const defaultSettings: PublicSettings = {
  platform_name: "NextOlymp",
  support_email: "",
  maintenance_mode: false,
  registration_enabled: true,
  default_language: "uz",
  loading: true,
};

interface SettingsContextType {
  settings: PublicSettings;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refetch: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>(defaultSettings);

  const fetchSettings = useCallback(() => {
    api
      .get("/settings/public")
      .then((r) => {
        const data = r.data?.data ?? r.data;
        if (data && typeof data === "object") {
          setSettings({ ...defaultSettings, ...data, loading: false });
        } else {
          setSettings((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch(() => {
        setSettings((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  useEffect(() => {
    fetchSettings();
    // Har 60 sekundda qayta tekshirish (maintenance mode real-time ishlashi uchun)
    const interval = setInterval(fetchSettings, 60000);
    return () => clearInterval(interval);
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  return ctx.settings;
}

export function useSettingsActions() {
  const ctx = useContext(SettingsContext);
  return { refetch: ctx.refetch };
}
