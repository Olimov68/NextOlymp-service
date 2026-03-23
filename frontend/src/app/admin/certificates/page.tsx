"use client";

import { useEffect, useState } from "react";
import { getAdminCertificates } from "@/lib/admin-api";
import { PermissionGuard } from "@/components/permission-guard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Certificate {
  id: number;
  user_id: number;
  user_name: string;
  title: string;
  source_type: string;
  certificate_number: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-600",
  expired: "bg-red-600",
  revoked: "bg-yellow-600",
};

export default function AdminCertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminCertificates({ page, limit, search });
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setItems(list);
      setTotal(res.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <PermissionGuard module="certificates" showAccessDenied>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Sertifikatlar</h1>
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
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-accent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Foydalanuvchi</TableHead>
                <TableHead className="text-muted-foreground">Olimpiada/Manba</TableHead>
                <TableHead className="text-muted-foreground">Sertifikat raqami</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Yaratilgan sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border">
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Sertifikat topilmadi
                  </TableCell>
                </TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-accent">
                  <TableCell className="text-foreground">{item.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.user_name || `ID: ${item.user_id}`}</TableCell>
                  <TableCell className="text-foreground max-w-[200px] truncate">{item.title || "\u2014"}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground">{item.certificate_number}</TableCell>
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
