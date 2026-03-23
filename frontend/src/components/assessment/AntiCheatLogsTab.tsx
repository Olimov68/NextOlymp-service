"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Monitor,
  ArrowLeftRight,
  Copy,
  Camera,
  Wrench,
  MousePointer,
  AlertTriangle,
  Mic,
  ScanFace,
  Users,
  Smartphone,
  Globe,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Eye,
  Video,
  Wifi,
  WifiOff,
  Search,
  Filter,
} from "lucide-react";
import { getAntiCheatViolations, getAntiCheatStats } from "@/lib/superadmin-api";

// ========== Types ==========

interface Violation {
  id: number;
  user_id: number;
  attempt_id: number;
  attempt_type: string;
  type: string;
  severity: string;
  device_type: string;
  metadata: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface Stats {
  total: number;
  by_type: Record<string, number>;
  top_violators: { user_id: number; username: string; full_name: string; violation_count: number }[];
}

interface Props {
  sourceType: "olympiad" | "mock_test";
  sourceId: number;
}

// ========== Constants ==========

const violationTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  fullscreen_exit: {
    label: "Fullscreen chiqish",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    icon: <Monitor className="h-4 w-4" />,
  },
  tab_switch: {
    label: "Tab almashtirish",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: <ArrowLeftRight className="h-4 w-4" />,
  },
  blur: {
    label: "Tab almashtirish",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: <ArrowLeftRight className="h-4 w-4" />,
  },
  copy_paste: {
    label: "Copy / Paste",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    icon: <Copy className="h-4 w-4" />,
  },
  screenshot: {
    label: "Screenshot",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    icon: <Camera className="h-4 w-4" />,
  },
  devtools: {
    label: "DevTools",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    icon: <Wrench className="h-4 w-4" />,
  },
  right_click: {
    label: "Right-click",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10 border-slate-500/20",
    icon: <MousePointer className="h-4 w-4" />,
  },
  offline: {
    label: "Oflayn",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10 border-slate-500/20",
    icon: <WifiOff className="h-4 w-4" />,
  },
  screen_record: {
    label: "Ekran yozish",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    icon: <Video className="h-4 w-4" />,
  },
  face_not_found: {
    label: "Yuz topilmadi",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    icon: <ScanFace className="h-4 w-4" />,
  },
  face_mismatch: {
    label: "Yuz mos kelmadi",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    icon: <ScanFace className="h-4 w-4" />,
  },
  multiple_faces: {
    label: "Ko&apos;p yuz aniqlandi",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: <Users className="h-4 w-4" />,
  },
  voice_detected: {
    label: "Ovoz aniqlandi",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/20",
    icon: <Mic className="h-4 w-4" />,
  },
};

const deviceTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  web: { label: "Web", icon: <Globe className="h-3.5 w-3.5" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  windows: { label: "Windows", icon: <Monitor className="h-3.5 w-3.5" />, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  android: { label: "Android", icon: <Smartphone className="h-3.5 w-3.5" />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

function getViolationConfig(type: string) {
  return violationTypeConfig[type] || {
    label: type,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10 border-slate-500/20",
    icon: <AlertTriangle className="h-4 w-4" />,
  };
}

function formatDateTime(iso?: string): string {
  if (!iso) return "---";
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "---";
  }
}

function formatTimeAgo(iso?: string): string {
  if (!iso) return "";
  try {
    const now = new Date();
    const date = new Date(iso);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Hozirgina";
    if (diffMin < 60) return `${diffMin} daq oldin`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} soat oldin`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} kun oldin`;
  } catch {
    return "";
  }
}

// ========== Component ==========

export default function AntiCheatLogsTab({ sourceType, sourceId }: Props) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getAntiCheatStats({ source_type: sourceType, source_id: sourceId });
      setStats(data.data || data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [sourceType, sourceId]);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        source_type: sourceType,
        source_id: sourceId,
        page,
        page_size: 20,
      };
      if (filterType !== "all") {
        params.violation_type = filterType;
      }
      const data = await getAntiCheatViolations(params);
      const items = data.data || data;
      setViolations(Array.isArray(items) ? items : []);
      const meta = data.meta || data.pagination;
      if (meta) {
        setTotalPages(meta.total_pages || Math.ceil((meta.total || 0) / 20));
      }
    } catch {
      setViolations([]);
    } finally {
      setLoading(false);
    }
  }, [sourceType, sourceId, filterType, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  // Stat card data with icons
  const statCards = [
    {
      key: "total",
      label: "Jami qoidabuzarliklar",
      value: stats?.total || 0,
      icon: <ShieldAlert className="h-5 w-5" />,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      trend: null,
    },
    {
      key: "fullscreen_exit",
      label: "Fullscreen chiqish",
      value: stats?.by_type?.fullscreen_exit || 0,
      icon: <Monitor className="h-5 w-5" />,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      trend: null,
    },
    {
      key: "tab_switch",
      label: "Tab almashtirish",
      value: (stats?.by_type?.tab_switch || 0) + (stats?.by_type?.blur || 0),
      icon: <ArrowLeftRight className="h-5 w-5" />,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      trend: null,
    },
    {
      key: "copy_paste",
      label: "Copy / Paste",
      value: stats?.by_type?.copy_paste || 0,
      icon: <Copy className="h-5 w-5" />,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      trend: null,
    },
    {
      key: "screenshot",
      label: "Screenshot",
      value: stats?.by_type?.screenshot || 0,
      icon: <Camera className="h-5 w-5" />,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      trend: null,
    },
    {
      key: "ai_proctor",
      label: "AI Proctoring",
      value: (stats?.by_type?.face_not_found || 0) + (stats?.by_type?.face_mismatch || 0) + (stats?.by_type?.multiple_faces || 0) + (stats?.by_type?.voice_detected || 0),
      icon: <ScanFace className="h-5 w-5" />,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      trend: null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Anti-Cheat Monitoring</h2>
            <p className="text-sm text-muted-foreground">Barcha qoidabuzarliklar real-time kuzatilmoqda</p>
          </div>
        </div>
        {stats && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Faol</span>
          </div>
        )}
      </div>

      {/* ===== STATS BENTO GRID ===== */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400/50" />
            <p className="text-sm text-muted-foreground">Statistika yuklanmoqda...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((s) => (
            <div
              key={s.key}
              className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex flex-col gap-3 hover:border-border hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-black/5"
            >
              {/* Icon */}
              <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center ${s.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                {s.icon}
              </div>
              {/* Value */}
              <p className="text-3xl font-bold text-foreground tracking-tight">{s.value}</p>
              {/* Label */}
              <p className="text-xs text-muted-foreground font-medium leading-tight">{s.label}</p>
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* ===== TOP VIOLATORS ===== */}
      {stats && stats.top_violators && stats.top_violators.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Eng ko&apos;p qoidabuzarlik qilganlar</h3>
                <p className="text-xs text-muted-foreground">Top 5 o&apos;quvchi</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {stats.top_violators.slice(0, 5).map((v, idx) => (
                <div
                  key={v.user_id}
                  className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-4 py-3 hover:border-border hover:bg-background/80 transition-all duration-200"
                >
                  {/* Rank */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx === 0
                      ? "bg-rose-500/15 text-rose-400"
                      : idx === 1
                      ? "bg-orange-500/15 text-orange-400"
                      : idx === 2
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-slate-500/10 text-slate-400"
                  }`}>
                    {v.violation_count}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{v.full_name || v.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{v.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== FILTER BAR ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Filter className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {stats?.total || 0} ta qoidabuzarlik
            </p>
            <p className="text-xs text-muted-foreground">Filtrlash va qidirish</p>
          </div>
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-border/50 bg-background/50 h-10">
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="fullscreen_exit">Fullscreen chiqish</SelectItem>
            <SelectItem value="tab_switch">Tab almashtirish</SelectItem>
            <SelectItem value="copy_paste">Copy / Paste</SelectItem>
            <SelectItem value="screenshot">Screenshot</SelectItem>
            <SelectItem value="devtools">DevTools</SelectItem>
            <SelectItem value="right_click">Right-click</SelectItem>
            <SelectItem value="offline">Oflayn</SelectItem>
            <SelectItem value="screen_record">Ekran yozish</SelectItem>
            <SelectItem value="face_not_found">Yuz topilmadi</SelectItem>
            <SelectItem value="face_mismatch">Yuz mos kelmadi</SelectItem>
            <SelectItem value="multiple_faces">Ko&apos;p yuz</SelectItem>
            <SelectItem value="voice_detected">Ovoz aniqlandi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ===== VIOLATIONS TABLE ===== */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400/50" />
            <p className="text-sm text-muted-foreground">Loglar yuklanmoqda...</p>
          </div>
        </div>
      ) : violations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/50 bg-card/30">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-emerald-400/50" />
          </div>
          <p className="text-base font-semibold text-foreground">Qoidabuzarliklar topilmadi</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm text-center">
            Hozircha hech qanday anti-cheat log yo&apos;q. Barcha o&apos;quvchilar qoidalarga rioya qilmoqda.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">O&apos;quvchi</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qoidabuzarlik</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jiddiylik</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qurilma</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP manzil</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {violations.map((v) => {
                  const cfg = getViolationConfig(v.type);
                  const dc = deviceTypeConfig[v.device_type] || deviceTypeConfig.web;
                  return (
                    <tr key={v.id} className="group hover:bg-muted/20 transition-colors duration-150">
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {v.avatar_url ? (
                            <img
                              src={v.avatar_url}
                              alt=""
                              className="h-9 w-9 rounded-xl object-cover border border-border/50 shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0">
                              {(v.full_name || v.username || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {v.full_name || v.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">@{v.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Violation Type */}
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${cfg.bgColor} ${cfg.color}`}>
                          {cfg.icon}
                          <span>{cfg.label}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          v.severity === "critical"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : v.severity === "warning"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            v.severity === "critical" ? "bg-rose-400" : v.severity === "warning" ? "bg-amber-400" : "bg-blue-400"
                          }`} />
                          {v.severity === "critical" ? "Jiddiy" : v.severity === "warning" ? "Ogohlantirish" : "Ma'lumot"}
                        </div>
                      </td>

                      {/* Device */}
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${dc.color}`}>
                          {dc.icon}
                          {dc.label}
                        </div>
                      </td>

                      {/* IP */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-muted-foreground font-mono">
                          {v.ip_address || "---"}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-xs text-foreground/70 whitespace-nowrap">
                            {formatDateTime(v.created_at)}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatTimeAgo(v.created_at)}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Sahifa <span className="font-semibold text-foreground">{page}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border/50 bg-background/50 hover:bg-background hover:border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Oldingi
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border/50 bg-background/50 hover:bg-background hover:border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Keyingi
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
