"use client";

import { useEffect, useState } from "react";
import { getSuperAdminLeaderboard, type SuperAdminLeaderboardEntry } from "@/lib/superadmin-api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Crown, Medal, Award, Flame, Sparkles, Zap, Trophy } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { regions as allRegions } from "@/lib/regions";

const LIMIT = 20;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace("/api/v1", "");

function rankBadge(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" />;
  if (rank === 3) return <Award className="h-4 w-4 text-orange-400" />;
  return null;
}

function initials(name: string, fallback: string) {
  const trimmed = (name || "").trim();
  if (!trimmed) return (fallback || "?").slice(0, 2).toUpperCase();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

export default function SuperAdminLeaderboardPage() {
  const [items, setItems] = useState<SuperAdminLeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: LIMIT };
        if (search.trim()) params.search = search.trim();
        if (region) params.region = region;
        const res = await getSuperAdminLeaderboard(params);
        if (cancelled) return;
        const inner = (res?.data ?? res) as { data?: SuperAdminLeaderboardEntry[]; total?: number };
        setItems(Array.isArray(inner?.data) ? inner.data : []);
        setTotal(inner?.total ?? 0);
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [page, search, region]);

  useEffect(() => {
    setPage(1);
  }, [search, region]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Reyting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            O&apos;quvchilar XP / Level bo&apos;yicha tartiblangan
          </p>
        </div>
        <span className="text-sm text-muted-foreground">Jami: {total}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ism yoki username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <Select value={region || "all"} onValueChange={(v) => setRegion(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px] bg-muted border-border">
            <SelectValue placeholder="Viloyat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha viloyatlar</SelectItem>
            {allRegions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead className="w-16">#</TableHead>
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Viloyat</TableHead>
              <TableHead className="text-right">Jami XP</TableHead>
              <TableHead className="text-center">Level</TableHead>
              <TableHead className="text-right">Testlar</TableHead>
              <TableHead className="text-center">Streak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i} className="border-border">
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Hech kim hali test yechmagan. O&apos;quvchilar test yechgani sari ro&apos;yxat to&apos;ladi.
                </TableCell>
              </TableRow>
            ) : (
              items.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const photoSrc = entry.photo_url ? `${API_BASE}${entry.photo_url}` : "";
                return (
                  <TableRow
                    key={entry.user_id}
                    className={`border-border hover:bg-accent ${isTop3 ? "bg-amber-500/5" : ""}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {rankBadge(entry.rank)}
                        <span className="text-sm font-semibold">{entry.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
                            {initials(entry.full_name, entry.username)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.full_name?.trim() || entry.username}
                          </p>
                          <p className="text-xs text-muted-foreground">@{entry.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.region || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        {entry.total_xp}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-purple-500/15 text-purple-300 border border-purple-400/20"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Lvl {entry.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{entry.tests_completed}</TableCell>
                    <TableCell className="text-center">
                      {entry.current_streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-orange-400 text-sm font-medium">
                          <Flame className="h-3.5 w-3.5" />
                          {entry.current_streak}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />
    </div>
  );
}
