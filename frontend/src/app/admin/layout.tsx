"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { PanelAuthProvider, usePanelAuth } from "@/lib/panel-auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  MessageCircle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  module: string | null;
}

const allNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, module: null },
  { href: "/admin/olympiads", label: "Olimpiadalar", icon: Trophy, module: "olympiads" },
  { href: "/admin/mock-tests", label: "Mock testlar", icon: ClipboardCheck, module: "mock_tests" },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users, module: "users" },
  { href: "/admin/chat", label: "Chat moderatsiya", icon: MessageCircle, module: "chat" },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { staff, loading, hasModuleAccess, logout } = usePanelAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Redirect if not authenticated or if superadmin
  useEffect(() => {
    if (isLoginPage || loading) return;
    if (!staff) {
      router.push("/admin/login");
      return;
    }
    if (staff.role === "superadmin") {
      router.push("/superadmin");
      return;
    }
  }, [staff, loading, router, isLoginPage]);

  // Login page bypasses auth check
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!staff) return null;

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  // Filter nav items based on permissions
  const navItems = allNavItems.filter(
    (item) => item.module === null || hasModuleAccess(item.module)
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-foreground">Admin Panel</h2>
                <p className="text-[10px] text-muted-foreground">{staff.full_name}</p>
              </div>
            </div>
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-950 dark:text-blue-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs text-muted-foreground">Mavzu</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 h-14 flex items-center">
          <button
            className="lg:hidden mr-3 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-medium text-blue-700 uppercase tracking-wider dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400">
              Admin
            </span>
          </div>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </PanelAuthProvider>
  );
}
