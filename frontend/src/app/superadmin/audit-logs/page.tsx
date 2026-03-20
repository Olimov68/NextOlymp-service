"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface AuditLog {
  id: number;
  actor_type: string;
  actor_id: number;
  action: string;
  resource: string;
  resource_id: number;
  ip_address: string;
  user_agent: string;
  details: string;
  created_at: string;
}

const actorTypes = ["admin", "superadmin", "user", "system"];
const actions = ["create", "update", "delete", "block", "unblock", "login", "logout", "approve", "refund", "reply"];
const resources = ["admin", "user", "olympiad", "mock_test", "question", "result", "news", "certificate", "chat", "payment", "settings", "security"];

const actionColors: Record<string, string> = {
  create: "bg-green-600", update: "bg-blue-600", delete: "bg-red-600",
  block: "bg-yellow-600", unblock: "bg-green-600", login: "bg-blue-500",
  logout: "bg-gray-600", approve: "bg-green-500", refund: "bg-purple-600", reply: "bg-blue-400"
};

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actorTypeFilter, setActorTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        page, page_size: limit, search,
        actor_type: actorTypeFilter || undefined,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined
      });
      const list = normalizeList(res);
      setItems(list);
      setTotal(res.pagination?.total || res?.data?.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search, actorTypeFilter, actionFilter, resourceFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Audit loglar</h1>
        <span className="text-sm text-muted-foreground ml-auto">Jami: {total}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-muted border-border" />
        </div>
        <Select value={actorTypeFilter} onValueChange={(v) => { setActorTypeFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-muted border-border"><SelectValue placeholder="Aktor turi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {actorTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-muted border-border"><SelectValue placeholder="Amal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-muted border-border"><SelectValue placeholder="Resurs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {resources.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Aktor turi</TableHead>
              <TableHead>Aktor ID</TableHead>
              <TableHead>Amal</TableHead>
              <TableHead>Resurs</TableHead>
              <TableHead>Resurs ID</TableHead>
              <TableHead>IP manzil</TableHead>
              <TableHead>Yaratilgan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Log topilmadi</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-accent">
                <TableCell>{item.id}</TableCell>
                <TableCell><Badge variant="secondary">{item.actor_type}</Badge></TableCell>
                <TableCell>{item.actor_id}</TableCell>
                <TableCell><Badge className={actionColors[item.action] || "bg-gray-600"}>{item.action}</Badge></TableCell>
                <TableCell>{item.resource}</TableCell>
                <TableCell>{item.resource_id}</TableCell>
                <TableCell className="font-mono text-xs">{item.ip_address || "—"}</TableCell>
                <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />
    </div>
  );
}
