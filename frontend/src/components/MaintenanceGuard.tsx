"use client";

import { useSettings } from "@/lib/settings-context";
import { usePathname } from "next/navigation";
import { MaintenanceBanner } from "./MaintenanceBanner";

/**
 * MaintenanceGuard — agar maintenance_mode yoqilgan bo'lsa,
 * faqat admin/superadmin paneldan boshqa barcha sahifalarda
 * MaintenanceBanner ko'rsatadi.
 */
export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const pathname = usePathname();

  // Admin va superadmin panelni maintenance modeda ham ishlashi kerak
  const isAdminPanel = pathname?.startsWith("/admin") || pathname?.startsWith("/superadmin");

  // Login sahifasi ham ishlashi kerak (adminlar kirishi uchun)
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/admin/login");

  // Yuklanayotgan paytda kutish (flash oldini olish)
  if (settings.loading) {
    return <>{children}</>;
  }

  // Maintenance mode yoqilgan va admin emas sahifada
  if (settings.maintenance_mode && !isAdminPanel && !isAuthPage) {
    return <MaintenanceBanner />;
  }

  return <>{children}</>;
}
