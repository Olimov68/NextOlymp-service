"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchResults } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const subjects = [
  { key: "mathematics", label: "Mathematics" },
  { key: "physics", label: "Physics" },
  { key: "chemistry", label: "Chemistry" },
  { key: "biology", label: "Biology" },
];

const medalColors: Record<string, string> = {
  Gold: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  Silver: "bg-gray-400/20 text-gray-300 border border-gray-400/30",
  Bronze: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
};

export function ResultsSection() {
  const [activeSubject, setActiveSubject] = useState("mathematics");
  const { t } = useI18n();

  const { data: results, isLoading } = useQuery({
    queryKey: ["results", activeSubject],
    queryFn: () => fetchResults(activeSubject),
  });

  return (
    <section id="results" className="py-20 bg-gradient-to-b from-blue-950 to-indigo-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-300 mb-4">
            {t("nav.results")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("results.title")}</h2>
          <p className="text-blue-200/50 max-w-md mx-auto">
            {t("results.desc")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {subjects.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSubject(s.key)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeSubject === s.key
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white/5 text-blue-200/70 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-blue-200/50">{t("common.loading")}</div>
          ) : !results?.length ? (
            <div className="p-8 text-center text-blue-200/50">{t("results.no_results") || "Natijalar topilmadi"}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5 border-b border-white/10">
                  <TableHead className="w-16 text-center text-blue-200/70">{t("results.rank")}</TableHead>
                  <TableHead className="text-blue-200/70">{t("results.name")}</TableHead>
                  <TableHead className="text-blue-200/70">{t("results.country")}</TableHead>
                  <TableHead className="text-center text-blue-200/70">{t("results.score")}</TableHead>
                  <TableHead className="text-center text-blue-200/70">{t("results.medal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.slice(0, 10).map((r) => (
                  <TableRow key={`${r.rank}-${r.name}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="text-center font-bold text-blue-200/50">{r.rank}</TableCell>
                    <TableCell className="font-medium text-white">{r.name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-blue-200/50">{r.country}</span>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-white">{r.score}</TableCell>
                    <TableCell className="text-center">
                      {r.medal ? (
                        <Badge className={`${medalColors[r.medal] || "bg-white/10 text-blue-200/50"} hover:opacity-90`}>
                          {r.medal}
                        </Badge>
                      ) : (
                        <span className="text-blue-200/30">&mdash;</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </section>
  );
}
