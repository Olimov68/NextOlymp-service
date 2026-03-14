"use client";

import { useEffect, useState } from "react";
import { getUsers, getUser, blockUser, unblockUser, deleteUser } from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, ShieldOff, Shield, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { regions } from "@/lib/regions";

interface User {
  id: number;
  username: string;
  full_name: string;
  region: string;
  grade: number;
  status: string;
  created_at: string;
}

interface UserDetail extends User {
  email: string;
  phone: string;
  school: string;
  district: string;
  birth_date: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState<UserDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, page_size: limit, search, status: statusFilter || undefined, region: regionFilter || undefined });
      const list = normalizeList(res);
      setUsers(list);
      setTotal(res.pagination?.total || res?.data?.total || 0);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search, statusFilter, regionFilter]);

  const handleViewUser = async (id: number) => {
    setViewLoading(true);
    try {
      const res = await getUser(id);
      setViewUser(res.data || res);
    } catch {
      alert("Foydalanuvchi ma'lumotlarini yuklashda xatolik");
    }
    setViewLoading(false);
  };

  const handleBlock = async (id: number, blocked: boolean) => {
    try {
      if (blocked) await unblockUser(id);
      else await blockUser(id);
      fetchUsers();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Foydalanuvchini o'chirishni xohlaysizmi?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const totalPages = Math.ceil(total / limit);

  // regions imported from @/lib/regions

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
        <span className="text-sm text-muted-foreground">Jami: {total}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-muted border-border" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-muted border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="blocked">Bloklangan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px] bg-muted border-border"><SelectValue placeholder="Viloyat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>Viloyat</TableHead>
              <TableHead>Sinf</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Yaratilgan</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Foydalanuvchi topilmadi</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id} className="border-border hover:bg-accent">
                <TableCell>{u.id}</TableCell>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell>{u.full_name}</TableCell>
                <TableCell>{u.region || "—"}</TableCell>
                <TableCell>{u.grade || "—"}</TableCell>
                <TableCell>
                  <Badge className={u.status === "active" ? "bg-green-600" : "bg-red-600"}>{u.status}</Badge>
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleViewUser(u.id)}>
                      <Eye className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleBlock(u.id, u.status === "blocked")}>
                      {u.status === "blocked" ? <Shield className="w-4 h-4 text-green-400" /> : <ShieldOff className="w-4 h-4 text-yellow-400" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
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
      <Dialog open={!!viewUser || viewLoading} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Foydalanuvchi ma&apos;lumotlari</DialogTitle></DialogHeader>
          {viewLoading ? (
            <p className="text-muted-foreground text-center py-4">Yuklanmoqda...</p>
          ) : viewUser ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">ID</Label><p className="text-sm">{viewUser.id}</p></div>
                <div><Label className="text-muted-foreground text-xs">Username</Label><p className="text-sm">{viewUser.username}</p></div>
                <div><Label className="text-muted-foreground text-xs">To&apos;liq ism</Label><p className="text-sm">{viewUser.full_name}</p></div>
                <div><Label className="text-muted-foreground text-xs">Email</Label><p className="text-sm">{viewUser.email || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Telefon</Label><p className="text-sm">{viewUser.phone || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Viloyat</Label><p className="text-sm">{viewUser.region || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Tuman</Label><p className="text-sm">{viewUser.district || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Maktab</Label><p className="text-sm">{viewUser.school || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Sinf</Label><p className="text-sm">{viewUser.grade || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Tug&apos;ilgan sana</Label><p className="text-sm">{viewUser.birth_date ? new Date(viewUser.birth_date).toLocaleDateString() : "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Status</Label><Badge className={viewUser.status === "active" ? "bg-green-600" : "bg-red-600"}>{viewUser.status}</Badge></div>
                <div><Label className="text-muted-foreground text-xs">Yaratilgan</Label><p className="text-sm">{new Date(viewUser.created_at).toLocaleString()}</p></div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
