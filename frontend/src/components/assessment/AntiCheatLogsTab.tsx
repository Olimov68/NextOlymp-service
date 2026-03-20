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
  Monitor,
  ArrowLeftRight,
  Copy,
  Camera,
  Wrench,
  MousePointer,
  AlertTriangle,
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

const violationTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  fullscreen_exit: {
    label: "Fullscreen chiqish",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: <Monitor className="h-3.5 w-3.5" />,
  },
  tab_switch: {
    label: "Tab almashtirish",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
  },
  blur: {
    label: "Tab almashtirish",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
  },
  copy_paste: {
    label: "Copy/Paste",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: <Copy className="h-3.5 w-3.5" />,
  },
  screenshot: {
    label: "Screenshot",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: <Camera className="h-3.5 w-3.5" />,
  },
  devtools: {
    label: "DevTools",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  right_click: {
    label: "Right-click",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: <MousePointer className="h-3.5 w-3.5" />,
  },
  offline: {
    label: "Oflayn",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

function getViolationConfig(type: string) {
  return violationTypeConfig[type] || {
    label: type,
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
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

  const statCards = [
    { key: "total", label: "Jami", value: stats?.total || 0, color: "text-blue-500" },
    { key: "fullscreen_exit", label: "Fullscreen chiqish", value: (stats?.by_type?.fullscreen_exit || 0), color: "text-yellow-500" },
    { key: "tab_switch", label: "Tab almashtirish", value: (stats?.by_type?.tab_switch || 0) + (stats?.by_type?.blur || 0), color: "text-orange-500" },
    { key: "copy_paste", label: "Copy/Paste", value: (stats?.by_type?.copy_paste || 0), color: "text-red-500" },
    { key: "screenshot", label: "Screenshot", value: (stats?.by_type?.screenshot || 0), color: "text-red-400" },
    { key: "devtools", label: "DevTools", value: (stats?.by_type?.devtools || 0), color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s) => (
            <div
              key={s.key}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-1"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground text-center">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top Violators */}
      {stats && stats.top_violators && stats.top_violators.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
            Eng ko&apos;p qoidabuzarlik qilganlar
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_violators.slice(0, 5).map((v) => (
              <div
                key={v.user_id}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                  {v.violation_count}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{v.full_name || v.username}</p>
                  <p className="text-xs text-muted-foreground">@{v.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {stats?.total || 0} ta qoidabuzarlik
        </p>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="fullscreen_exit">Fullscreen chiqish</SelectItem>
            <SelectItem value="tab_switch">Tab almashtirish</SelectItem>
            <SelectItem value="copy_paste">Copy/Paste</SelectItem>
            <SelectItem value="screenshot">Screenshot</SelectItem>
            <SelectItem value="devtools">DevTools</SelectItem>
            <SelectItem value="right_click">Right-click</SelectItem>
            <SelectItem value="offline">Oflayn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : violations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-medium">Qoidabuzarliklar topilmadi</p>
          <p className="text-sm mt-1">Hozircha hech qanday anti-cheat log yo&apos;q</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">O&apos;quvchi</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qoidabuzarlik turi</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jiddiylik</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tafsilotlar</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => {
                  const cfg = getViolationConfig(v.type);
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">#{v.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {v.avatar_url ? (
                            <img
                              src={v.avatar_url}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {(v.full_name || v.username || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {v.full_name || v.username}
                            </p>
                            <p className="text-xs text-muted-foreground">@{v.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs gap-1 ${cfg.color}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            v.severity === "critical"
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : v.severity === "warning"
                              ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}
                        >
                          {v.severity === "critical" ? "Jiddiy" : v.severity === "warning" ? "Ogohlantirish" : "Ma'lumot"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {v.ip_address || "---"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(v.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Oldingi
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}
