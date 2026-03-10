"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Trophy, Newspaper, Medal, UserCircle, LogOut, Home } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">{t("common.loading")}</div>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { href: "/dashboard", label: t("dashboard.olympiads"), icon: Trophy },
    { href: "/dashboard/news", label: t("dashboard.news"), icon: Newspaper },
    { href: "/dashboard/results", label: t("dashboard.results"), icon: Medal },
    { href: "/dashboard/profile", label: t("dashboard.profile"), icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🏆</div>
            <span className="text-lg font-bold text-gray-900">NextOly</span>
          </Link>
          <p className="text-xs text-gray-400 mt-2">
            {user.firstName} {user.lastName}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isDashboardExact = item.href === "/dashboard" && (pathname === "/dashboard" || pathname.startsWith("/dashboard/olympiads"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive || isDashboardExact
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            {t("nav.home")}
          </Link>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
