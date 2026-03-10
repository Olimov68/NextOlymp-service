"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchResults } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const subjects = ["mathematics", "physics", "chemistry", "biology", "informatics"];

const medalColors: Record<string, string> = {
  Gold: "bg-yellow-100 text-yellow-800",
  Silver: "bg-gray-100 text-gray-700",
  Bronze: "bg-amber-100 text-amber-800",
};

export default function DashboardResultsPage() {
  const { t } = useI18n();
  const [subject, setSubject] = useState("mathematics");
  const { data: results, isLoading } = useQuery({
    queryKey: ["results", subject],
    queryFn: () => fetchResults(subject),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("dashboard.results")}</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              subject === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">{t("common.loading")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t("results.rank")}</TableHead>
                  <TableHead>{t("results.name")}</TableHead>
                  <TableHead>{t("results.country")}</TableHead>
                  <TableHead className="text-center">{t("results.score")}</TableHead>
                  <TableHead className="text-center">{t("results.medal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.map((r) => (
                  <TableRow key={r.rank}>
                    <TableCell className="font-medium">{r.rank}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell className="text-center font-semibold">{r.score}</TableCell>
                    <TableCell className="text-center">
                      {r.medal ? (
                        <Badge className={`${medalColors[r.medal] || "bg-gray-100"} border-0`}>{r.medal}</Badge>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
