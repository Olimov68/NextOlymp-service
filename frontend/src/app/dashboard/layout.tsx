"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, UserCircle, LogOut, Home,
  ClipboardCheck, MessageCircle,
  Menu, BarChart3, Bell, Newspaper, Wallet, X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getUnreadCount } from "@/lib/user-api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, nextStep, loading, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const mustCompleteProfile = nextStep === "complete_profile";
  const mustCompleteStep = mustCompleteProfile;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && mustCompleteProfile && pathname !== "/dashboard/profile") {
      router.push("/dashboard/profile");
    }
  }, [loading, user, mustCompleteProfile, pathname, router]);

  // Fetch unread notification count
  useEffect(() => {
    if (!user || mustCompleteStep) return;
    getUnreadCount().then(setUnreadCount).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount).catch(() => {});
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [user, mustCompleteStep]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20" />
          <div className="text-muted-foreground text-sm">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { href: "/dashboard", label: "Bosh sahifa", icon: Home, module: "dashboard", badge: 0 },
    { href: "/dashboard/olympiads", label: t("dashboard.olympiads"), icon: Trophy, module: "olympiads", badge: 0 },
    { href: "/dashboard/mock-tests", label: "Mock testlar", icon: ClipboardCheck, module: "mock-tests", badge: 0 },
    { href: "/dashboard/results", label: "Natijalar", icon: BarChart3, module: "results", badge: 0 },
    { href: "/dashboard/leaderboard", label: "Reyting", icon: BarChart3, module: "leaderboard", badge: 0 },
    { href: "/dashboard/news", label: "Yangiliklar", icon: Newspaper, module: "news", badge: 0 },
    { href: "/dashboard/notifications", label: "Bildirishnomalar", icon: Bell, module: "notifications", badge: unreadCount },
    { href: "/dashboard/balance", label: "Balans", icon: Wallet, module: "balance", badge: 0 },
    { href: "/dashboard/chat", label: "Chat", icon: MessageCircle, module: "chat", badge: 0 },
    { href: "/dashboard/profile", label: t("dashboard.profile"), icon: UserCircle, module: "profile", badge: 0 },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <span className="text-sm font-bold text-primary">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">@{user.username}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.title")}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          const disabled = mustCompleteStep && item.module !== "profile";
          return (
            <Link
              key={item.href}
              href={disabled ? "#" : item.href}
              onClick={(e) => {
                if (disabled) e.preventDefault();
                else setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : disabled
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1.5">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <ThemeToggle variant="sidebar" />
        <Link
          href={mustCompleteStep ? "#" : "/"}
          onClick={mustCompleteStep ? (e: React.MouseEvent) => e.preventDefault() : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
            mustCompleteStep ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Home className="h-4 w-4" />
          Asosiy sahifa
        </Link>
        <button
          onClick={mustCompleteStep ? undefined : () => { logout(); router.push("/"); }}
          disabled={mustCompleteStep}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
            mustCompleteStep ? "text-muted-foreground/40 cursor-not-allowed" : "text-destructive hover:bg-destructive/10"
          }`}
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border min-h-screen flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-foreground">@{user.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="p-4 md:p-6 overflow-auto">{children}</main>
      </div>

    </div>
  );
}
