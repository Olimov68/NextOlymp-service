"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { useI18n } from "@/lib/i18n";
import {
  Trophy, Search, Clock, Users, BookOpen, Calendar, ChevronRight,
} from "lucide-react";
import { listOlympiads } from "@/lib/user-api";
import { normalizeList } from "@/lib/normalizeList";
import { useAuth } from "@/lib/auth-context";

interface Olympiad {
  id: number;
  title: string;
  slug: string;
  description: string;
  subject: string;
  grade: number;
  language: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_questions: number;
  status: string;
  is_paid: boolean;
  price?: number;
}

const statusColors: Record<string, string> = {
  published: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  ended: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const statusLabels: Record<string, string> = {
  published: "Ro'yxatdan o'tish",
  active: "Faol",
  ended: "Tugagan",
};

export default function OlympiadsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  useEffect(() => {
    listOlympiads({ page: 1, page_size: 50 })
      .then((data: unknown) => setItems(normalizeList<Olympiad>(data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const subjects = Array.from(new Set(items.map(i => i.subject).filter(Boolean)));

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.subject.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === "all" || i.subject === subjectFilter;
    const matchPrice = priceFilter === "all" || (priceFilter === "free" ? !i.is_paid : i.is_paid);
    return matchSearch && matchSubject && matchPrice;
  });

  const handleJoin = (id: number) => {
    if (!user) { router.push("/login"); return; }
    router.push(`/dashboard/olympiads/${id}`);
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-14 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-sm text-amber-300 mb-5">
            <Trophy className="h-4 w-4" />
            {t("olympiads.title")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("olympiads.title")}</h1>
          <p className="text-gray-400 max-w-lg mx-auto">{t("olympiads.desc")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                placeholder={`${t("common.search")}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50"
            >
              <option value="all" className="bg-gray-900">{t("olympiads.subjects")}</option>
              {subjects.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
            </select>
            <select
              value={priceFilter}
              onChange={e => setPriceFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50"
            >
              <option value="all" className="bg-gray-900">Barchasi</option>
              <option value="free" className="bg-gray-900">{t("olympiads.free")}</option>
              <option value="paid" className="bg-gray-900">{t("olympiads.paid")}</option>
            </select>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-gray-500">
              <Trophy className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-lg font-medium">{t("results.no_results")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <div key={item.id} className="group rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                      <Trophy className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {item.status in statusColors && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${item.is_paid ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`}>
                        {item.is_paid ? `${item.price?.toLocaleString()} UZS` : t("olympiads.free")}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors flex-1">{item.title}</h3>

                  {item.description && <p className="text-sm text-gray-400 line-clamp-2 mb-4">{item.description}</p>}

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{item.subject}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{item.duration_minutes} min</span>
                    {item.grade > 0 && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{item.grade}-{t("auth.grade_suffix")}</span>}
                    {item.total_questions > 0 && <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />{item.total_questions} Q</span>}
                  </div>

                  {item.end_time && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.end_time).toLocaleDateString("uz-UZ")}
                    </p>
                  )}

                  <button
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all mt-auto flex items-center justify-center gap-2 ${
                      item.status === "ended"
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
                    }`}
                    onClick={() => handleJoin(item.id)}
                    disabled={item.status === "ended"}
                  >
                    {item.status === "ended" ? "Tugagan" : t("olympiads.details")}
                    {item.status !== "ended" && <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
