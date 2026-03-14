"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export interface PublicSettings {
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_language: string;
}

const defaultSettings: PublicSettings = {
  platform_name: "NextOlymp",
  support_email: "",
  maintenance_mode: false,
  registration_enabled: true,
  default_language: "uz",
};

const SettingsContext = createContext<PublicSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>(defaultSettings);

  useEffect(() => {
    api
      .get("/settings/public")
      .then((r) => {
        const data = r.data?.data ?? r.data;
        if (data && typeof data === "object") {
          setSettings({ ...defaultSettings, ...data });
        }
      })
      .catch(() => {
        // Fallback to defaults silently
      });
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
