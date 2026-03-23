"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/superadmin-api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  ShieldCheck,
  Trophy,
  GraduationCap,
  MessageCircle,
  Award,
  CreditCard,
  AlertCircle,
  Tag,
  DollarSign,
  TrendingUp,
  UserCheck,
} from "lucide-react";

interface DashboardStats {
  total_users: number;
  blocked_users: number;
  total_admins: number;
  total_olympiads: number;
  total_mock_tests: number;
  total_chat_messages: number;
  active_chat_bans: number;
  total_payments: number;
  total_certificates: number;
  active_promo_codes: number;
  total_revenue: number;
  weekly_new_users: number;
  pending_verifications: number;
}

interface LatestUser {
  id: number;
  username: string;
  status: string;
  created_at: string;
}

interface LatestPayment {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestUsers, setLatestUsers] = useState<LatestUser[]>([]);
  const [latestPayments, setLatestPayments] = useState<LatestPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((res) => {
        const d = res.data || res;
        setStats(d.stats);
        setLatestUsers(Array.isArray(d.latest_users) ? d.latest_users : []);
        setLatestPayments(Array.isArray(d.latest_payments) ? d.latest_payments : []);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || "Serverga ulanib bo'lmadi";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Yuklanmoqda...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400 gap-2">
        <AlertCircle className="h-5 w-5" />
        <span>Ma&apos;lumot yuklanmadi</span>
        {error && <span className="text-xs text-red-400/60">{error}</span>}
      </div>
    );
  }

  const statCards = [
    { label: "Foydalanuvchilar", value: stats.total_users, icon: Users, color: "blue" },
    { label: "Adminlar", value: stats.total_admins, icon: ShieldCheck, color: "purple" },
    { label: "Olimpiadalar", value: stats.total_olympiads, icon: Trophy, color: "amber" },
    { label: "Mock testlar", value: stats.total_mock_tests, icon: GraduationCap, color: "green" },
    { label: "Chat xabarlar", value: stats.total_chat_messages, icon: MessageCircle, color: "rose" },
    { label: "Sertifikatlar", value: stats.total_certificates, icon: Award, color: "cyan" },
    { label: "To'lovlar", value: stats.total_payments, icon: CreditCard, color: "emerald" },
    { label: "Bloklangan", value: stats.blocked_users, icon: AlertCircle, color: "red" },
    { label: "Aktiv promo kodlar", value: stats.active_promo_codes, icon: Tag, color: "orange" },
    { label: "Umumiy daromad", value: (stats.total_revenue || 0).toLocaleString() + " so'm", icon: DollarSign, color: "emerald" },
    { label: "Haftalik yangi", value: stats.weekly_new_users, icon: TrendingUp, color: "teal" },
    { label: "Kutilayotgan tasdiq", value: stats.pending_verifications, icon: UserCheck, color: "yellow" },
  ];

  const colorMap: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-400/20 text-blue-400",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-400/20 text-purple-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-400/20 text-amber-400",
    green: "from-green-500/20 to-green-600/5 border-green-400/20 text-green-400",
    rose: "from-rose-500/20 to-rose-600/5 border-rose-400/20 text-rose-400",
    cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-400/20 text-cyan-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-400/20 text-emerald-400",
    red: "from-red-500/20 to-red-600/5 border-red-400/20 text-red-400",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-400/20 text-orange-400",
    teal: "from-teal-500/20 to-teal-600/5 border-teal-400/20 text-teal-400",
    yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-400/20 text-yellow-400",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className={`border bg-gradient-to-br ${colorMap[s.color]} shadow-none`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-5 w-5 opacity-70" />
                <span className="text-2xl font-bold text-foreground">{s.value}</span>
              </div>
              <p className="text-xs opacity-60">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest data */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Latest Users */}
        <Card className="border border-border bg-accent/50 shadow-none">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Oxirgi foydalanuvchilar</h3>
            <div className="space-y-2">
              {latestUsers.length === 0 && <p className="text-xs text-muted-foreground">Hali yo'q</p>}
              {latestUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm text-foreground">{u.username}</span>
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${u.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {u.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Latest Payments */}
      <Card className="border border-border bg-accent/50 shadow-none">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Oxirgi to&apos;lovlar</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Foydalanuvchi</th>
                  <th className="pb-2 font-medium text-right">Summa</th>
                  <th className="pb-2 font-medium">Holat</th>
                  <th className="pb-2 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody>
                {latestPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">Hali yo&apos;q</td>
                  </tr>
                )}
                {latestPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-foreground">{p.id}</td>
                    <td className="py-2 text-foreground">{p.username}</td>
                    <td className="py-2 text-right text-foreground font-medium">{p.amount.toLocaleString()} so&apos;m</td>
                    <td className="py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        p.status === "completed" ? "bg-green-500/10 text-green-400" :
                        p.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
