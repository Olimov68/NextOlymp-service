"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, getAdminUser, blockAdminUser, unblockAdminUser, approveUserVerification, rejectUserVerification } from "@/lib/admin-api";
import { PermissionGuard } from "@/components/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, ShieldOff, Shield, Eye, UserCheck, UserX } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface User {
  id: number;
  username: string;
  full_name: string;
  photo_url: string;
  region: string;
  grade: number;
  status: string;
  is_profile_completed: boolean;
  is_telegram_linked: boolean;
  created_at: string;
}

interface UserDetail extends User {
  email: string;
  phone: string;
  school: string;
  district: string;
  birth_date: string;
  profile?: {
    photo_url?: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState<UserDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [approveDialog, setApproveDialog] = useState<User | UserDetail | null>(null);
  const [rejectDialog, setRejectDialog] = useState<User | UserDetail | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page, limit, search, status: statusFilter || undefined });
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setUsers(list);
      setTotal(res.total || 0);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search, statusFilter]);

  const handleViewUser = async (id: number) => {
    setViewLoading(true);
    try {
      const res = await getAdminUser(id);
      setViewUser(res.data || res);
    } catch {
      alert("Foydalanuvchi ma'lumotlarini yuklashda xatolik");
    }
    setViewLoading(false);
  };

  const handleBlock = async (id: number, isBlocked: boolean) => {
    try {
      if (isBlocked) await unblockAdminUser(id);
      else await blockAdminUser(id);
      fetchUsers();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const handleApprove = async () => {
    if (!approveDialog) return;
    setActionLoading(true);
    try {
      await approveUserVerification(approveDialog.id, approveNote || undefined);
      setApproveDialog(null);
      setApproveNote("");
      fetchUsers();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (e as Error)?.message || "Xatolik");
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await rejectUserVerification(rejectDialog.id, rejectReason);
      setRejectDialog(null);
      setRejectReason("");
      fetchUsers();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (e as Error)?.message || "Xatolik");
    }
    setActionLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <PermissionGuard module="users" showAccessDenied>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Foydalanuvchilar</h1>
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
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(!v || v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[150px] bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hammasi</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="blocked">Bloklangan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-accent">
                <TableHead className="text-muted-foreground">Rasm</TableHead>
                <TableHead className="text-muted-foreground">Ism / Username</TableHead>
                <TableHead className="text-muted-foreground">Viloyat</TableHead>
                <TableHead className="text-muted-foreground">Sinf</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Yaratilgan</TableHead>
                <TableHead className="text-muted-foreground">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border">
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Foydalanuvchi topilmadi
                  </TableCell>
                </TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id} className="border-border hover:bg-accent">
                  <TableCell>
                    {u.photo_url ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${u.photo_url}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {u.full_name?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{u.full_name || "\u2014"}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{u.region || "\u2014"}</TableCell>
                  <TableCell className="text-foreground">{u.grade || "\u2014"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge className={`${u.status === "active" ? "bg-green-600" : "bg-red-600"} text-white`}>
                        {u.status}
                      </Badge>
                      {u.is_profile_completed && !u.is_telegram_linked && (
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Kutilmoqda</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleViewUser(u.id)}>
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      {u.is_profile_completed && !u.is_telegram_linked && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setApproveDialog(u)} title="Tasdiqlash">
                            <UserCheck className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectDialog(u)} title="Rad etish">
                            <UserX className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <PermissionGuard permission="users.block">
                        <Button size="sm" variant="ghost" onClick={() => handleBlock(u.id, u.status === "blocked")}>
                          {u.status === "blocked"
                            ? <Shield className="w-4 h-4 text-green-600" />
                            : <ShieldOff className="w-4 h-4 text-yellow-600" />
                          }
                        </Button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />

        {/* View Detail Dialog */}
        <Dialog open={!!viewUser || viewLoading} onOpenChange={() => setViewUser(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Foydalanuvchi ma&apos;lumotlari</DialogTitle>
            </DialogHeader>
            {viewLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : viewUser ? (
              <div className="space-y-3">
                {/* Profil rasmi */}
                <div className="flex items-center gap-4 pb-3 border-b border-border">
                  {(viewUser.photo_url || viewUser.profile?.photo_url) ? (
                    <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${viewUser.photo_url || viewUser.profile?.photo_url}`} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {viewUser.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-foreground">{viewUser.full_name || viewUser.username}</p>
                    <p className="text-sm text-muted-foreground">@{viewUser.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-muted-foreground text-xs">ID</Label><p className="text-sm text-foreground">{viewUser.id}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Email</Label><p className="text-sm text-foreground">{viewUser.email || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Telefon</Label><p className="text-sm text-foreground">{viewUser.phone || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Viloyat</Label><p className="text-sm text-foreground">{viewUser.region || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Tuman</Label><p className="text-sm text-foreground">{viewUser.district || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Maktab</Label><p className="text-sm text-foreground">{viewUser.school || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Sinf</Label><p className="text-sm text-foreground">{viewUser.grade || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Tug&apos;ilgan sana</Label><p className="text-sm text-foreground">{viewUser.birth_date ? new Date(viewUser.birth_date).toLocaleDateString() : "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Status</Label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge className={`${viewUser.status === "active" ? "bg-green-600" : "bg-red-600"} text-white`}>{viewUser.status}</Badge>
                      {viewUser.is_profile_completed && !viewUser.is_telegram_linked && (
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Kutilmoqda</Badge>
                      )}
                    </div>
                  </div>
                  <div><Label className="text-muted-foreground text-xs">Yaratilgan</Label><p className="text-sm text-foreground">{new Date(viewUser.created_at).toLocaleString()}</p></div>
                </div>
                {viewUser.is_profile_completed && !viewUser.is_telegram_linked && (
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setViewUser(null); setApproveDialog(viewUser); }}>
                      <UserCheck className="w-4 h-4 mr-1" /> Tasdiqlash
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setViewUser(null); setRejectDialog(viewUser); }}>
                      <UserX className="w-4 h-4 mr-1" /> Rad etish
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={!!approveDialog} onOpenChange={() => { setApproveDialog(null); setApproveNote(""); }}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Foydalanuvchini tasdiqlash</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{approveDialog?.full_name}</strong> ({approveDialog?.username}) ni tasdiqlashni xohlaysizmi?
              </p>
              <div>
                <Label className="text-muted-foreground text-xs">Izoh (ixtiyoriy)</Label>
                <Textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Izoh qo'shing..."
                  className="mt-1 bg-background border-border"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setApproveDialog(null); setApproveNote(""); }}>
                  Bekor qilish
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading ? "Yuklanmoqda..." : "Tasdiqlash"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason(""); }}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Foydalanuvchini rad etish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{rejectDialog?.full_name}</strong> ({rejectDialog?.username}) ni rad etishni xohlaysizmi?
              </p>
              <div>
                <Label className="text-muted-foreground text-xs">Sabab (majburiy)</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rad etish sababini kiriting..."
                  className="mt-1 bg-background border-border"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>
                  Bekor qilish
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>
                  {actionLoading ? "Yuklanmoqda..." : "Rad etish"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
