"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, FileText, BarChart3, Calendar } from "lucide-react";
import { getMyResults, type UserResult } from "@/lib/user-api";

const typeOptions = [
  { value: "", label: "Barchasi" },
  { value: "olympiad", label: "Olimpiada" },
  { value: "mock_test", label: "Mock test" },
];

const subjectOptions = [
  "Barchasi",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Informatics",
];

export default function ResultsPage() {
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    getMyResults()
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false;
      if (
        subjectFilter &&
        subjectFilter !== "Barchasi" &&
        r.subject !== subjectFilter
      )
        return false;
      return true;
    });
  }, [results, typeFilter, subjectFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useMemo(() => { setPage(1); }, [typeFilter, subjectFilter]);

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
        <h1 className="text-2xl font-bold text-foreground">Natijalarim</h1>
        <p className="text-muted-foreground mt-1">
          Barcha olimpiada va mock test natijalaringiz
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

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
      </div>

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jami natijalar</p>
                <p className="text-lg font-bold text-foreground">{results.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Olimpiada natijalari</p>
                <p className="text-lg font-bold text-foreground">
                  {results.filter((r) => r.type === "olympiad").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mock test natijalari</p>
                <p className="text-lg font-bold text-foreground">
                  {results.filter((r) => r.type === "mock_test").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Natija topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Fan</TableHead>
                    <TableHead className="text-center">Ball</TableHead>
                    <TableHead className="text-center">Foiz</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {r.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-0 text-xs ${
                            r.type === "olympiad"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {r.type === "olympiad" ? "Olimpiada" : "Mock test"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.subject}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-bold text-foreground">
                          {r.score}/{r.max_score}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-sm font-semibold ${
                            r.percentage >= 80
                              ? "text-green-600"
                              : r.percentage >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {r.percentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-0 text-xs ${
                            r.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : r.status === "in_progress"
                              ? "bg-amber-100 text-amber-700"
                              : r.status === "timed_out"
                              ? "bg-red-100 text-red-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.status === "completed"
                            ? "Yakunlangan"
                            : r.status === "in_progress"
                            ? "Jarayonda"
                            : r.status === "timed_out"
                            ? "Vaqt tugadi"
                            : r.status === "cancelled"
                            ? "Bekor qilingan"
                            : r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {(() => {
                            const dateStr = r.finished_at || r.started_at || r.created_at;
                            if (!dateStr) return "—";
                            const d = new Date(dateStr);
                            if (isNaN(d.getTime())) return "—";
                            return d.toLocaleDateString("uz-UZ", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            });
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} />
    </div>
  );
}
