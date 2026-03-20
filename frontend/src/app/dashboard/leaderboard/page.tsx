"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  User,
  MapPin,
  Target,
  Flame,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  getLeaderboard,
  getMyRank,
  type LeaderboardEntry,
  type MyRankInfo,
} from "@/lib/user-api";
import { regions as allRegions } from "@/lib/regions";

// ─── Constants ──────────────────────────────────────────────────────────────

const PERIODS = [
  { value: "weekly", label: "Haftalik" },
  { value: "monthly", label: "Oylik" },
  { value: "all", label: "Umumiy" },
];

const SUBJECTS = [
  { value: "all", label: "Barcha fanlar" },
  { value: "matematika", label: "Matematika" },
  { value: "fizika", label: "Fizika" },
  { value: "kimyo", label: "Kimyo" },
  { value: "biologiya", label: "Biologiya" },
  { value: "informatika", label: "Informatika" },
  { value: "ingliz_tili", label: "Ingliz tili" },
  { value: "ona_tili", label: "Ona tili" },
  { value: "tarix", label: "Tarix" },
];

const REGIONS = [
  { value: "all", label: "Barcha viloyatlar" },
  ...allRegions.map((r) => ({ value: r, label: r })),
];

const LIMIT = 20;

// ─── Helper ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getMedalIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
  return null;
}

// ─── MyRankCard ─────────────────────────────────────────────────────────────

function MyRankCard({ myRank }: { myRank: MyRankInfo | null }) {
  if (!myRank) {
    return (
      <Card className="border-0 shadow-sm bg-muted/50">
        <CardContent className="p-6 text-center">
          <User className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            Siz hali imtihonlarda qatnashmagansiz. Reytingda ko&apos;rinish uchun biror testni yechib ko&apos;ring.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isTop10 = myRank.rank <= 10;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                #{myRank.rank}
              </div>
              {isTop10 && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                  <Crown className="h-3.5 w-3.5 text-amber-900" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Sizning o&apos;rningiz</h3>
              <p className="text-blue-100 text-sm">
                {myRank.total_participants} ta ishtirokchidan
              </p>
            </div>
          </div>
          {isTop10 && (
            <Badge className="bg-amber-400/20 text-amber-100 border-amber-400/30 px-3 py-1">
              Top 10
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Flame className="h-5 w-5 text-amber-300 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{myRank.score}</p>
            <p className="text-blue-200 text-xs">Umumiy ball</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Target className="h-5 w-5 text-green-300 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{(myRank.percentage ?? 0).toFixed(1)}%</p>
            <p className="text-blue-200 text-xs">Aniqlik</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Trophy className="h-5 w-5 text-purple-300 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{myRank.correct}/{myRank.total}</p>
            <p className="text-blue-200 text-xs">To'g'ri/Jami</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── TopPodium ──────────────────────────────────────────────────────────────

function TopPodium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  const podiumConfig = [
    {
      entry: top3[1],
      rank: 2,
      height: "h-24",
      avatarSize: "h-16 w-16",
      textSize: "text-lg",
      bg: "bg-slate-100 dark:bg-slate-800",
      avatarBg: "bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-600",
      borderColor: "border-slate-300 dark:border-slate-600",
      medalEmoji: "🥈",
      medalBg: "bg-slate-200 dark:bg-slate-700",
      scoreColor: "text-slate-700 dark:text-slate-300",
    },
    {
      entry: top3[0],
      rank: 1,
      height: "h-32",
      avatarSize: "h-20 w-20",
      textSize: "text-xl",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      avatarBg: "bg-gradient-to-br from-amber-400 to-amber-600",
      borderColor: "border-amber-400 dark:border-amber-500",
      medalEmoji: "🥇",
      medalBg: "bg-amber-100 dark:bg-amber-900/50",
      scoreColor: "text-amber-700 dark:text-amber-400",
    },
    {
      entry: top3[2],
      rank: 3,
      height: "h-20",
      avatarSize: "h-14 w-14",
      textSize: "text-base",
      bg: "bg-orange-50 dark:bg-orange-950/20",
      avatarBg: "bg-gradient-to-br from-orange-400 to-orange-600",
      borderColor: "border-orange-300 dark:border-orange-600",
      medalEmoji: "🥉",
      medalBg: "bg-orange-100 dark:bg-orange-900/40",
      scoreColor: "text-orange-700 dark:text-orange-400",
    },
  ];

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-6 pb-0">
        <div className="flex items-end justify-center gap-4 md:gap-8">
          {podiumConfig.map((cfg) => (
            <div key={cfg.rank} className="flex flex-col items-center" style={{ minWidth: 100 }}>
              {/* Avatar */}
              <div className="relative mb-2">
                <div
                  className={`${cfg.avatarSize} rounded-full ${cfg.avatarBg} flex items-center justify-center text-white font-bold ${cfg.textSize} border-3 ${cfg.borderColor} shadow-lg`}
                >
                  {getInitials(cfg.entry.full_name || cfg.entry.username)}
                </div>
                <div className="absolute -bottom-1 -right-1 text-xl">{cfg.medalEmoji}</div>
              </div>

              {/* Name */}
              <p className="text-sm font-semibold text-foreground text-center truncate max-w-[120px]">
                {cfg.entry.full_name || cfg.entry.username}
              </p>

              {/* Score */}
              <p className={`text-sm font-bold ${cfg.scoreColor}`}>
                {cfg.entry.score} ball
              </p>

              {/* Podium block */}
              <div
                className={`w-full ${cfg.height} ${cfg.bg} rounded-t-xl mt-2 flex items-center justify-center border-t-2 ${cfg.borderColor}`}
              >
                <span className={`font-bold ${cfg.scoreColor} ${cfg.textSize}`}>
                  #{cfg.rank}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── LeaderboardTable ───────────────────────────────────────────────────────

function LeaderboardTable({
  entries,
  page,
  myRank,
}: {
  entries: LeaderboardEntry[];
  page: number;
  myRank: MyRankInfo | null;
}) {
  const startIdx = page === 1 ? 3 : 0;
  const visibleEntries = page === 1 ? entries.slice(3) : entries;

  if (visibleEntries.length === 0 && page === 1 && entries.length <= 3) {
    return null;
  }

  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-16">
                #
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Ism
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                Viloyat
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Ball
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                Aniqlik
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                To'g'ri/Jami
              </th>
              <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-16">
                Medal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleEntries.map((entry) => {
              const isCurrentUser = myRank && entry.rank === myRank.rank;
              const medalBadge = entry.medal
                ? entry.medal === "gold"
                  ? { label: "Oltin", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400" }
                  : entry.medal === "silver"
                  ? { label: "Kumush", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" }
                  : entry.medal === "bronze"
                  ? { label: "Bronza", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400" }
                  : null
                : null;

              return (
                <tr
                  key={entry.user_id}
                  className={`transition-colors hover:bg-muted/30 ${
                    isCurrentUser
                      ? "bg-blue-50/70 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {getMedalIcon(entry.rank)}
                      <span
                        className={`text-sm font-semibold ${
                          entry.rank <= 3 ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {getInitials(entry.full_name || entry.username)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.full_name || entry.username}
                        </p>
                        {entry.full_name && (
                          <p className="text-xs text-muted-foreground">@{entry.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm">{entry.region || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {entry.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {(entry.percentage ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {entry.correct}/{entry.total}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {medalBadge ? (
                      <Badge variant="secondary" className={medalBadge.className}>
                        {medalBadge.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-40 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-60 bg-muted rounded-lg animate-pulse mt-2" />
      </div>

      {/* MyRank skeleton */}
      <div className="h-44 bg-muted rounded-2xl animate-pulse" />

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-40 bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-44 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [myRank, setMyRank] = useState<MyRankInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState("all");
  const [subject, setSubject] = useState("all");
  const [region, setRegion] = useState("all");

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      const params: Record<string, any> = { page, limit: LIMIT };
      if (period !== "all") params.period = period;
      if (subject !== "all") params.subject = subject;
      if (region !== "all") params.region = region;

      const rankParams: Record<string, any> = {};
      if (period !== "all") rankParams.period = period;
      if (subject !== "all") rankParams.subject = subject;
      if (region !== "all") rankParams.region = region;

      try {
        const [leaderboardRes, rankRes] = await Promise.allSettled([
          getLeaderboard(params),
          getMyRank(rankParams),
        ]);

        if (cancelled) return;

        if (leaderboardRes.status === "fulfilled") {
          setEntries(Array.isArray(leaderboardRes.value.data) ? leaderboardRes.value.data : []);
          setTotal(leaderboardRes.value.total ?? 0);
        } else {
          setEntries([]);
          setTotal(0);
        }

        if (rankRes.status === "fulfilled") {
          setMyRank(rankRes.value);
        } else {
          setMyRank(null);
        }
      } catch {
        if (!cancelled) {
          setEntries([]);
          setTotal(0);
          setMyRank(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [page, period, subject, region]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [period, subject, region]);

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reyting</h1>
        <p className="text-muted-foreground mt-1">
          Eng yaxshi natijalarni ko&apos;rsatgan ishtirokchilar reytingi
        </p>
      </div>

      {/* My Rank Card */}
      <MyRankCard myRank={myRank} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v ?? "all")}>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subject} onValueChange={(v) => setSubject(v ?? "")}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={region} onValueChange={(v) => setRegion(v ?? "")}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Ma&apos;lumot topilmadi</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Tanlangan filtrlar bo&apos;yicha natijalar mavjud emas
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top Podium (first page only) */}
          {page === 1 && entries.length >= 3 && <TopPodium entries={entries} />}

          {/* Leaderboard Table */}
          <LeaderboardTable entries={entries} page={page} myRank={myRank} />

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />
        </>
      )}
    </div>
  );
}
