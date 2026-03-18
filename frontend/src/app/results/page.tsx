"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { fetchResults } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Medal, Loader2, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const sourceTypes = [
  { key: "", uz: "Barchasi", ru: "Все", en: "All" },
  { key: "olympiad", uz: "Olimpiadalar", ru: "Олимпиады", en: "Olympiads" },
  { key: "mock_test", uz: "Mock testlar", ru: "Мок-тесты", en: "Mock Tests" },
];

function getGradeStyle(grade: string) {
  if (!grade) return null;
  if (grade.startsWith("A")) return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
  if (grade.startsWith("B")) return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
  if (grade.startsWith("C")) return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
  return "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30";
}

const rankStyle = (rank: number) => {
  if (rank === 1) return "text-yellow-500 font-bold text-lg";
  if (rank === 2) return "text-slate-500 font-bold text-lg";
  if (rank === 3) return "text-orange-500 font-bold text-lg";
  return "text-muted-foreground font-medium";
};

export default function ResultsPage() {
  const { lang } = useI18n();
  const [activeType, setActiveType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-results", activeType, search, page],
    queryFn: () => fetchResults({
      source_type: activeType || undefined,
      search: search || undefined,
      page,
      page_size: pageSize,
    }),
  });

  const results = data?.items || [];
  const pagination = data?.pagination;

  const getLabel = (s: typeof sourceTypes[0]) =>
    lang === "ru" ? s.ru : lang === "en" ? s.en : s.uz;

  const title = lang === "ru" ? "Результаты" : lang === "en" ? "Results" : "Natijalar";
  const desc = lang === "ru"
    ? "Таблица результатов олимпиад и тестов — посмотрите результаты участников"
    : lang === "en"
    ? "Olympiad and test results — see participant scores"
    : "Olimpiada va test natijalari — ishtirokchilar natijalarini ko'ring";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Header />
      </div>

      <main>
        {/* Page Header */}
        <section className="py-14 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-600 dark:text-amber-400 mb-4">
              <BarChart3 className="h-4 w-4" />
              {lang === "ru" ? "Результаты" : lang === "en" ? "Results" : "Natijalar"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">{desc}</p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b border-border bg-background sticky top-[calc(4rem+var(--announcement-h,0px))] z-30 backdrop-blur-sm bg-background/80">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search */}
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={lang === "ru" ? "Поиск по имени..." : lang === "en" ? "Search by name..." : "Ism bo'yicha qidirish..."}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 bg-background"
                />
              </div>

              {/* Type filter buttons */}
              <div className="flex flex-wrap gap-2">
                {sourceTypes.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { setActiveType(s.key); setPage(1); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      activeType === s.key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
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
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <AlertCircle className="h-12 w-12 text-destructive/40" />
                <p className="text-muted-foreground">
                  {lang === "ru" ? "Ошибка загрузки" : lang === "en" ? "Failed to load" : "Yuklab bo'lmadi"}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <Medal className="h-16 w-16 text-muted-foreground/20" />
                <p className="text-muted-foreground text-lg">
                  {lang === "ru" ? "Результатов нет" : lang === "en" ? "No results found" : "Natijalar topilmadi"}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="w-16 text-center text-xs uppercase tracking-wider text-muted-foreground">
                          #
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                          {lang === "ru" ? "Участник" : lang === "en" ? "Participant" : "Ishtirokchi"}
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                          {lang === "ru" ? "Тест/Олимпиада" : lang === "en" ? "Test/Olympiad" : "Test/Olimpiada"}
                        </TableHead>
                        <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground">
                          {lang === "ru" ? "Балл" : lang === "en" ? "Score" : "Ball"}
                        </TableHead>
                        <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground">
                          %
                        </TableHead>
                        <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground">
                          {lang === "ru" ? "Оценка" : lang === "en" ? "Grade" : "Baho"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((r, idx) => {
                        const rowNum = (page - 1) * pageSize + idx + 1;
                        return (
                          <TableRow
                            key={`${r.id}-${r.source_type}`}
                            className={`border-b border-border transition-colors hover:bg-muted/50 ${rowNum <= 3 ? "bg-amber-500/[0.02]" : ""}`}
                          >
                            <TableCell className={`text-center ${rankStyle(rowNum)}`}>
                              {rowNum <= 3 ? ["🥇", "🥈", "🥉"][rowNum - 1] : `#${rowNum}`}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {r.participant_display_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm text-foreground">{r.source_title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {r.source_type === "olympiad"
                                    ? (lang === "ru" ? "Олимпиада" : lang === "en" ? "Olympiad" : "Olimpiada")
                                    : (lang === "ru" ? "Мок-тест" : lang === "en" ? "Mock Test" : "Mock test")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-foreground">
                              {r.score}/{r.max_score}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {r.percentage.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-center">
                              {r.grade_label ? (
                                <Badge
                                  variant="outline"
                                  className={`${getGradeStyle(r.grade_label)} text-xs`}
                                >
                                  {r.grade_label}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/30 text-sm">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      {lang === "ru" ? `Всего: ${pagination?.total || 0}` : lang === "en" ? `Total: ${pagination?.total || 0}` : `Jami: ${pagination?.total || 0}`}
                    </span>
                    {pagination && pagination.total_pages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page <= 1}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm">
                          {page} / {pagination.total_pages}
                        </span>
                        <button
                          onClick={() => setPage(Math.min(pagination.total_pages, page + 1))}
                          disabled={page >= pagination.total_pages}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
