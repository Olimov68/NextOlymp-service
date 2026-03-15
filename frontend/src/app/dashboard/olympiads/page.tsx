"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Search,
  Calendar,
  BookOpen,
  Trophy,
  Zap,
  FlaskConical,
  Leaf,
  Monitor,
  Users,
  Clock,
  ChevronRight,
} from "lucide-react";
import { listOlympiads } from "@/lib/user-api";

interface Olympiad {
  id: number;
  title: string;
  subject: string;
  status: string;
  price?: number;
  is_paid?: boolean;
  duration_minutes: number;
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_questions?: number;
  questions_count?: number;
  participants_count?: number;
  grade?: number;
}

const subjectIcons: Record<string, React.ElementType> = {
  Mathematics: Zap,
  Physics: BookOpen,
  Chemistry: FlaskConical,
  Biology: Leaf,
  Informatics: Monitor,
};

const subjectOptions = ["Barchasi", "Mathematics", "Physics", "Chemistry", "Biology", "Informatics"];
const statusOptions = [
  { value: "", label: "Barchasi" },
  { value: "published", label: "E\u2019lon qilingan" },
  { value: "active", label: "Faol" },
  { value: "upcoming", label: "Kutilmoqda" },
  { value: "completed", label: "Yakunlangan" },
  { value: "ended", label: "Tugagan" },
];
const paidOptions = [
  { value: "", label: "Barchasi" },
  { value: "free", label: "Bepul" },
  { value: "paid", label: "Pullik" },
];

function isFree(o: Olympiad): boolean {
  if (typeof o.is_paid === "boolean") return !o.is_paid;
  return o.price === 0 || o.price == null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    published: "bg-blue-100 text-blue-700",
    upcoming: "bg-amber-100 text-amber-700",
    completed: "bg-muted text-muted-foreground",
    ended: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    active: "Faol",
    published: "E\u2019lon qilingan",
    upcoming: "Kutilmoqda",
    completed: "Yakunlangan",
    ended: "Tugagan",
  };
  return (
    <Badge className={`${colors[status] || colors.upcoming} border-0 font-medium`}>
      {labels[status] || status}
    </Badge>
  );
}

export default function OlympiadsListPage() {
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paidFilter, setPaidFilter] = useState("");

  useEffect(() => {
    listOlympiads({ page: 1, page_size: 100 })
      .then((data) => {
        let list: Olympiad[] = [];
        if (Array.isArray(data)) list = data;
        else if ((data as any)?.data && Array.isArray((data as any).data)) list = (data as any).data;
        else if ((data as any)?.items && Array.isArray((data as any).items)) list = (data as any).items;
        setOlympiads(list);
      })
      .catch((err) => {
        console.error("Olympiads load error:", err);
        setOlympiads([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return olympiads.filter((o) => {
      if (search && !o.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (subjectFilter && subjectFilter !== "Barchasi" && o.subject !== subjectFilter) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (paidFilter === "free" && !isFree(o)) return false;
      if (paidFilter === "paid" && isFree(o)) return false;
      return true;
    });
  }, [olympiads, search, subjectFilter, statusFilter, paidFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olimpiadalar</h1>
        <p className="text-muted-foreground mt-1">
          Barcha fan olimpiadalariga qatnashing va o&apos;z bilimingizni sinab ko&apos;ring
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background border border-border"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {subjectOptions.map((s) => (
            <option key={s} value={s === "Barchasi" ? "" : s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {paidOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Trophy className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-center">Olimpiadalar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => {
            const Icon = subjectIcons[o.subject] || Trophy;
            const free = isFree(o);
            const startDate = o.start_time || o.start_date;
            const endDate = o.end_time || o.end_date;
            const questionCount = o.total_questions ?? o.questions_count;
            return (
              <div
                key={o.id}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{o.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{o.subject}</p>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  {startDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(startDate).toLocaleDateString("uz-UZ")}
                      {endDate && ` - ${new Date(endDate).toLocaleDateString("uz-UZ")}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {o.duration_minutes} daqiqa
                  </div>
                  {(questionCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3" />
                      {questionCount} savol
                    </div>
                  )}
                  {(o.participants_count ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {o.participants_count} ishtirokchi
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
                  {free ? (
                    <Badge className="bg-green-50 text-green-700 border-0">Bepul</Badge>
                  ) : (
                    <Badge className="bg-orange-50 text-orange-700 border-0">
                      {o.price?.toLocaleString()} so&apos;m
                    </Badge>
                  )}
                  <Link href={`/dashboard/olympiads/${o.id}`}>
                    <Button size="sm" className="gap-1.5">
                      Batafsil <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
