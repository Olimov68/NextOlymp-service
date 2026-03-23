"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { fetchResults } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { BarChart3, Medal, Loader2, AlertCircle, Search } from "lucide-react";

const subjects = [
  { key: "mathematics", uz: "Matematika", ru: "Математика", en: "Mathematics" },
  { key: "physics", uz: "Fizika", ru: "Физика", en: "Physics" },
  { key: "chemistry", uz: "Kimyo", ru: "Химия", en: "Chemistry" },
  { key: "biology", uz: "Biologiya", ru: "Биология", en: "Biology" },
  { key: "informatics", uz: "Informatika", ru: "Информатика", en: "Informatics" },
];

const medalConfig: Record<string, { cls: string; icon: string }> = {
  Gold:   { cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: "🥇" },
  Silver: { cls: "bg-gray-500/20 text-gray-300 border-gray-500/30", icon: "🥈" },
  Bronze: { cls: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: "🥉" },
};

const rankStyle = (rank: number) => {
  if (rank === 1) return "text-yellow-400 font-bold text-lg";
  if (rank === 2) return "text-gray-300 font-bold text-lg";
  if (rank === 3) return "text-orange-400 font-bold text-lg";
  return "text-gray-500 font-medium";
};

export default function ResultsPage() {
  const { lang, t } = useI18n();
  const [activeSubject, setActiveSubject] = useState("mathematics");
  const [search, setSearch] = useState("");

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ["results", activeSubject],
    queryFn: () => fetchResults(activeSubject),
  });

  const getLabel = (s: typeof subjects[0]) =>
    lang === "ru" ? s.ru : lang === "en" ? s.en : s.uz;

  const filtered = results.filter(
    (r) => !search || r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="py-14 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-sm text-amber-300 mb-4">
            <BarChart3 className="h-4 w-4" />
            {t("results.title")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("results.title")}</h1>
          <p className="text-gray-400 max-w-md mx-auto">{t("results.desc")}</p>
        </div>
      </section>

      {/* Subject tabs */}
      <section className="py-6 border-b border-white/5 sticky top-20 z-30 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                placeholder={`${t("common.search")}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSubject(s.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeSubject === s.key
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {getLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results table */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <AlertCircle className="h-12 w-12 text-red-400/40" />
              <p className="text-gray-500">{t("common.error")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Medal className="h-16 w-16 text-gray-700" />
              <p className="text-gray-500 text-lg">{t("results.no_results")}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="w-16 text-center text-xs uppercase tracking-wider text-gray-500 py-4">{t("results.rank")}</th>
                    <th className="text-left text-xs uppercase tracking-wider text-gray-500 py-4">{t("results.name")}</th>
                    <th className="text-left text-xs uppercase tracking-wider text-gray-500 py-4">{t("results.country")}</th>
                    <th className="text-center text-xs uppercase tracking-wider text-gray-500 py-4">{t("results.score")}</th>
                    <th className="text-center text-xs uppercase tracking-wider text-gray-500 py-4">{t("results.medal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr
                      key={`${r.rank}-${r.name}-${idx}`}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${r.rank <= 3 ? "bg-amber-500/[0.03]" : ""}`}
                    >
                      <td className={`text-center py-3 ${rankStyle(r.rank)}`}>
                        {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : `#${r.rank}`}
                      </td>
                      <td className="font-medium py-3">{r.name}</td>
                      <td className="text-sm text-gray-400 py-3">{r.country}</td>
                      <td className="text-center font-semibold py-3">{r.score}</td>
                      <td className="text-center py-3">
                        {r.medal ? (
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${medalConfig[r.medal]?.cls || "bg-white/5 text-gray-400"}`}>
                            {medalConfig[r.medal]?.icon} {r.medal}
                          </span>
                        ) : (
                          <span className="text-gray-700 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-3 border-t border-white/5 text-xs text-gray-500">
                {t("stats.students")}: {filtered.length}
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
