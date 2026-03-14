"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { PanelStaff } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Trophy,
  FileText,
  Award,
  MessageSquare,
  CreditCard,
  Settings,
  ScrollText,
  Lock,
  Newspaper,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Tag,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/admins", label: "Adminlar", icon: ShieldCheck },
  { href: "/superadmin/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/superadmin/olympiads", label: "Olimpiadalar", icon: Trophy },
  { href: "/superadmin/mock-tests", label: "Mock testlar", icon: GraduationCap },
  { href: "/superadmin/news", label: "Yangiliklar", icon: Newspaper },
  { href: "/superadmin/certificates", label: "Sertifikatlar", icon: Award },
  { href: "/superadmin/feedback", label: "Fikrlar", icon: MessageSquare },
  { href: "/superadmin/results", label: "Natijalar", icon: FileText },
  { href: "/superadmin/payments", label: "To'lovlar", icon: CreditCard },
  { href: "/superadmin/payments/promo-codes", label: "Promo kodlar", icon: Tag },
  { href: "/superadmin/security", label: "Xavfsizlik", icon: Lock },
  { href: "/superadmin/audit-logs", label: "Audit loglar", icon: ScrollText },
  { href: "/superadmin/settings", label: "Sozlamalar", icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [staff, setStaff] = useState<PanelStaff | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("panel_access_token");
    const staffStr = localStorage.getItem("panel_staff");
    if (!token || !staffStr) {
      router.push("/admin/login");
      return;
    }
    try {
      const parsed = JSON.parse(staffStr) as PanelStaff;
      if (parsed.role !== "superadmin") {
        router.push("/admin");
        return;
      }
      setStaff(parsed);
    } catch {
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("panel_access_token");
    localStorage.removeItem("panel_refresh_token");
    localStorage.removeItem("panel_staff");
    router.push("/admin/login");
  };

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm">SuperAdmin</h2>
                <p className="text-[10px] text-muted-foreground">{staff.full_name}</p>
              </div>
            </div>
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href) && !navItems.some((other) => other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-purple-500/15 text-purple-300 font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-300 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 h-14 flex items-center">
          <button className="lg:hidden mr-3 text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-400/20 px-2.5 py-0.5 text-[10px] font-medium text-purple-300 uppercase tracking-wider">
              SuperAdmin
            </span>
          </div>
        </header>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
