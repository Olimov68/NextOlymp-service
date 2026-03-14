"use client";

import { useEffect, useState } from "react";
import { getResults, getResult } from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface Result {
  id: number;
  user_id: number;
  user_name: string;
  source_type: string;
  source_id: number;
  source_title: string;
  score: number;
  max_score: number;
  percentage: number;
  status: string;
  subject: string;
  started_at: string;
  finished_at: string;
  created_at: string;
}

interface ResultDetail extends Result {
  answers: Array<{
    question_id: number;
    selected_option: string;
    is_correct: boolean;
    score: number;
  }>;
  duration_seconds: number;
  violations: number;
}

const sourceTypes = ["olympiad", "mock_test"];
const subjects = ["matematika", "fizika", "kimyo", "biologiya", "informatika", "ingliz_tili", "ona_tili", "tarix", "geografiya"];

const statusColors: Record<string, string> = {
  completed: "bg-green-600", in_progress: "bg-yellow-600", abandoned: "bg-red-600", disqualified: "bg-red-800", pending: "bg-gray-600"
};

export default function ResultsPage() {
  const [items, setItems] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState<ResultDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getResults({ page, limit, search, type: typeFilter || undefined, subject: subjectFilter || undefined });
      setItems(normalizeList(res));
      setTotal(res.pagination?.total || res?.data?.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search, typeFilter, subjectFilter]);

  const handleView = async (item: Result) => {
    setViewLoading(true);
    try {
      const res = await getResult(item.id, item.source_type);
      setViewItem(res.data || res);
    } catch {
      alert("Natijani yuklashda xatolik");
    }
    setViewLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Natijalar</h1>
        <span className="text-sm text-muted-foreground">Jami: {total}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-muted border-border" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-muted border-border"><SelectValue placeholder="Turi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {sourceTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-muted border-border"><SelectValue placeholder="Fan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Sarlavha</TableHead>
              <TableHead>Ball</TableHead>
              <TableHead>Max ball</TableHead>
              <TableHead>Foiz</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Natija topilmadi</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-accent">
                <TableCell>{item.id}</TableCell>
                <TableCell className="font-medium">{item.user_name || `ID: ${item.user_id}`}</TableCell>
                <TableCell><Badge variant="secondary">{item.source_type}</Badge></TableCell>
                <TableCell className="max-w-[180px] truncate">{item.source_title}</TableCell>
                <TableCell className="font-medium">{item.score}</TableCell>
                <TableCell>{item.max_score}</TableCell>
                <TableCell>
                  <span className={item.percentage >= 70 ? "text-green-400" : item.percentage >= 40 ? "text-yellow-400" : "text-red-400"}>
                    {item.percentage?.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell><Badge className={statusColors[item.status] || "bg-gray-600"}>{item.status}</Badge></TableCell>
                <TableCell>{new Date(item.finished_at || item.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => handleView(item)}>
                    <Eye className="w-4 h-4 text-blue-400" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Jami: {total}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem || viewLoading} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Natija tafsilotlari</DialogTitle></DialogHeader>
          {viewLoading ? (
            <p className="text-muted-foreground text-center py-4">Yuklanmoqda...</p>
          ) : viewItem ? (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">ID</Label><p className="text-sm">{viewItem.id}</p></div>
                <div><Label className="text-muted-foreground text-xs">Foydalanuvchi</Label><p className="text-sm">{viewItem.user_name || `ID: ${viewItem.user_id}`}</p></div>
                <div><Label className="text-muted-foreground text-xs">Turi</Label><Badge variant="secondary">{viewItem.source_type}</Badge></div>
                <div><Label className="text-muted-foreground text-xs">Sarlavha</Label><p className="text-sm">{viewItem.source_title}</p></div>
                <div><Label className="text-muted-foreground text-xs">Ball</Label><p className="text-sm font-bold">{viewItem.score} / {viewItem.max_score}</p></div>
                <div><Label className="text-muted-foreground text-xs">Foiz</Label>
                  <p className={`text-sm font-bold ${viewItem.percentage >= 70 ? "text-green-400" : viewItem.percentage >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                    {viewItem.percentage?.toFixed(1)}%
                  </p>
                </div>
                <div><Label className="text-muted-foreground text-xs">Status</Label><Badge className={statusColors[viewItem.status] || "bg-gray-600"}>{viewItem.status}</Badge></div>
                <div><Label className="text-muted-foreground text-xs">Davomiyligi</Label><p className="text-sm">{viewItem.duration_seconds ? `${Math.floor(viewItem.duration_seconds / 60)} min ${viewItem.duration_seconds % 60} sek` : "—"}</p></div>
                {viewItem.violations > 0 && (
                  <div><Label className="text-muted-foreground text-xs">Qoidabuzarliklar</Label><p className="text-sm text-red-400 font-bold">{viewItem.violations}</p></div>
                )}
                <div><Label className="text-muted-foreground text-xs">Boshlangan</Label><p className="text-sm">{viewItem.started_at ? new Date(viewItem.started_at).toLocaleString() : "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Tugatilgan</Label><p className="text-sm">{viewItem.finished_at ? new Date(viewItem.finished_at).toLocaleString() : "—"}</p></div>
              </div>

              {viewItem.answers && viewItem.answers.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs">Javoblar ({viewItem.answers.length})</Label>
                  <div className="mt-2 space-y-1">
                    {viewItem.answers.map((ans, idx) => (
                      <div key={idx} className={`flex items-center justify-between text-xs p-2 rounded ${ans.is_correct ? "bg-green-900/30" : "bg-red-900/30"}`}>
                        <span>Savol #{ans.question_id}</span>
                        <span>Javob: {ans.selected_option}</span>
                        <Badge className={ans.is_correct ? "bg-green-600" : "bg-red-600"} variant="secondary">
                          {ans.is_correct ? "To'g'ri" : "Noto'g'ri"} ({ans.score})
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
