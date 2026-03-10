"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchResults } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const subjects = [
  { key: "mathematics", label: "Mathematics" },
  { key: "physics", label: "Physics" },
  { key: "chemistry", label: "Chemistry" },
  { key: "biology", label: "Biology" },
];

const medalColors: Record<string, string> = {
  Gold: "bg-yellow-100 text-yellow-700",
  Silver: "bg-gray-100 text-gray-700",
  Bronze: "bg-orange-100 text-orange-700",
};

export function ResultsSection() {
  const [activeSubject, setActiveSubject] = useState("mathematics");

  const { data: results, isLoading } = useQuery({
    queryKey: ["results", activeSubject],
    queryFn: () => fetchResults(activeSubject),
  });

  return (
    <section id="results" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm text-amber-700 mb-4">
            🏅 Results
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Natijalar</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {"Olimpiada natijalari va g'oliblar"}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {subjects.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSubject(s.key)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeSubject === s.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
          ) : !results?.length ? (
            <div className="p-8 text-center text-gray-400">Natijalar topilmadi</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Ism</TableHead>
                  <TableHead>Mamlakat</TableHead>
                  <TableHead className="text-center">Ball</TableHead>
                  <TableHead className="text-center">Medal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.slice(0, 10).map((r) => (
                  <TableRow key={`${r.rank}-${r.name}`}>
                    <TableCell className="text-center font-bold text-gray-500">{r.rank}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{r.country}</span>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{r.score}</TableCell>
                    <TableCell className="text-center">
                      {r.medal ? (
                        <Badge className={`${medalColors[r.medal] || "bg-gray-100 text-gray-600"} hover:opacity-90`}>
                          {r.medal}
                        </Badge>
                      ) : (
                        <span className="text-gray-300">—</span>
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
