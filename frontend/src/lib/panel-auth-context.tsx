"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { PanelStaff } from "@/lib/api";

interface PanelAuthContextType {
  staff: PanelStaff | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasModuleAccess: (module: string) => boolean;
  logout: () => void;
}

const PanelAuthContext = createContext<PanelAuthContextType>({
  staff: null,
  permissions: [],
  loading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasModuleAccess: () => false,
  logout: () => {},
});

export function PanelAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<PanelStaff | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("panel_access_token");
    const staffStr = localStorage.getItem("panel_staff");
    if (!token || !staffStr) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(staffStr) as PanelStaff;
      setStaff(parsed);

      // Load permissions from /panel/auth/me
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1"}/panel/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setPermissions(data.data.permissions || []);
            // Update staff info from server
            if (data.data.staff) {
              const freshStaff = data.data.staff;
              setStaff((prev) => ({ ...prev, ...freshStaff }));
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } catch {
      setLoading(false);
    }
  }, []);

  const hasPermission = useCallback(
    (code: string) => {
      if (!staff) return false;
      if (staff.role === "superadmin") return true;
      // Check exact code or module.manage
      const module = code.split(".")[0];
      return permissions.includes(code) || permissions.includes(`${module}.manage`);
    },
    [staff, permissions]
  );

  const hasAnyPermission = useCallback(
    (codes: string[]) => {
      return codes.some((code) => hasPermission(code));
    },
    [hasPermission]
  );

  const hasModuleAccess = useCallback(
    (module: string) => {
      if (!staff) return false;
      if (staff.role === "superadmin") return true;
      return permissions.some((p) => p.startsWith(module + "."));
    },
    [staff, permissions]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("panel_access_token");
    localStorage.removeItem("panel_refresh_token");
    localStorage.removeItem("panel_staff");
    setStaff(null);
    setPermissions([]);
  }, []);

  return (
    <PanelAuthContext.Provider
      value={{ staff, permissions, loading, hasPermission, hasAnyPermission, hasModuleAccess, logout }}
    >
      {children}
    </PanelAuthContext.Provider>
  );
}

export const usePanelAuth = () => useContext(PanelAuthContext);
