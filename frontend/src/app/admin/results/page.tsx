"use client";

import { useEffect, useState } from "react";
import { getAdminResults } from "@/lib/admin-api";
import { PermissionGuard } from "@/components/permission-guard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Result {
  id: number;
  user_id: number;
  user_name: string;
  subject: string;
  source_type: string;
  source_title: string;
  score: number;
  max_score: number;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  passed: "bg-green-600",
  completed: "bg-green-600",
  failed: "bg-red-600",
  pending: "bg-yellow-600",
  in_progress: "bg-yellow-600",
};

export default function AdminResultsPage() {
  const [items, setItems] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminResults({ page, limit, search, type: typeFilter || undefined });
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setItems(list);
      setTotal(res.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search, typeFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <PermissionGuard module="results" showAccessDenied>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Natijalar</h1>
          <span className="text-sm text-muted-foreground">Jami: {total}</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 bg-background border-border"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(!v || v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-background border-border">
              <SelectValue placeholder="Turi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hammasi</SelectItem>
              <SelectItem value="olympiad">Olimpiada</SelectItem>
              <SelectItem value="mock_test">Mock test</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-accent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Foydalanuvchi</TableHead>
                <TableHead className="text-muted-foreground">Fan</TableHead>
                <TableHead className="text-muted-foreground">Turi</TableHead>
                <TableHead className="text-muted-foreground">Ball</TableHead>
                <TableHead className="text-muted-foreground">Max ball</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border">
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Natija topilmadi
                  </TableCell>
                </TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-accent">
                  <TableCell className="text-foreground">{item.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.user_name || `ID: ${item.user_id}`}</TableCell>
                  <TableCell className="text-foreground">{item.subject || "\u2014"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-muted text-foreground">
                      {item.source_type === "olympiad" ? "Olimpiada" : item.source_type === "mock_test" ? "Mock test" : item.source_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{item.score}</TableCell>
                  <TableCell className="text-foreground">{item.max_score}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[item.status] || "bg-gray-500"} text-white`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : "\u2014"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />
      </div>
    </PermissionGuard>
  );
}
