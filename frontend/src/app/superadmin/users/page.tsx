"use client";

import { useEffect, useState } from "react";
import { getUsers, getUser, createUser, blockUser, unblockUser, verifyUser, deleteUser, approveUserByID, rejectUserByID } from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, ShieldOff, Shield, Eye, Plus, CheckCircle, UserX, Loader2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { regions } from "@/lib/regions";
import { getErrorMessage } from "@/lib/api-error";

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
  updated_at: string;
  profile?: {
    photo_url?: string;
    first_name?: string;
    last_name?: string;
  };
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
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
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
      toast.error("Foydalanuvchi ma'lumotlarini yuklashda xatolik");
    }
    setViewLoading(false);
  };

  const handleBlock = async (id: number, blocked: boolean) => {
    try {
      if (blocked) await unblockUser(id);
      else await blockUser(id);
      toast.success(blocked ? "Blok olib tashlandi" : "Bloklandi");
      fetchUsers();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Xatolik"));
    }
  };

  const handleApproveUser = async (userId: number, note?: string) => {
    try {
      await approveUserByID(userId, note);
      toast.success("Foydalanuvchi tasdiqlandi");
      fetchUsers();
      setViewUser(null);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Xatolik"));
    }
  };

  const handleVerify = async (id: number) => {
    await handleApproveUser(id);
  };

  const handleRejectUser = async (userId: number) => {
    if (!rejectReason.trim()) {
      toast.error("Rad etish sababini kiriting");
      return;
    }
    try {
      await rejectUserByID(userId, rejectReason.trim());
      toast.success("Foydalanuvchi rad etildi");
      fetchUsers();
      setViewUser(null);
      setRejectDialog(null);
      setRejectReason("");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Xatolik"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Foydalanuvchini o'chirishni xohlaysizmi?")) return;
    try {
      await deleteUser(id);
      toast.success("O'chirildi");
      fetchUsers();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Xatolik"));
    }
  };

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error("Username va parol majburiy");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Parol kamida 8 ta belgi bo'lishi kerak");
      return;
    }
    setCreating(true);
    try {
      await createUser({ username: newUsername.trim(), password: newPassword });
      toast.success("Foydalanuvchi yaratildi");
      setCreateOpen(false);
      setNewUsername("");
      setNewPassword("");
      fetchUsers();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Xatolik"));
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
          <p className="text-sm text-muted-foreground mt-1">Jami: {total}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Yangi foydalanuvchi
        </Button>
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
              <TableHead>Rasm</TableHead>
              <TableHead>Ism / Username</TableHead>
              <TableHead>Viloyat</TableHead>
              <TableHead>Sinf</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Yaratilgan</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Foydalanuvchi topilmadi</TableCell></TableRow>
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
                    <p className="font-medium">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </TableCell>
                <TableCell>{u.region || "—"}</TableCell>
                <TableCell>{u.grade || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge className={u.status === "active" ? "bg-green-600" : "bg-red-600"}>{u.status}</Badge>
                    {u.is_profile_completed && !u.is_telegram_linked && (
                      <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Tasdiqlanmagan</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleViewUser(u.id)} title="Ko'rish">
                      <Eye className="w-4 h-4 text-blue-400" />
                    </Button>
                    {u.is_profile_completed && !u.is_telegram_linked && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleVerify(u.id)} title="Tasdiqlash">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejectDialog(u.id)} title="Rad etish">
                          <UserX className="w-4 h-4 text-red-400" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleBlock(u.id, u.status === "blocked")} title={u.status === "blocked" ? "Blokdan chiqarish" : "Bloklash"}>
                      {u.status === "blocked" ? <Shield className="w-4 h-4 text-green-400" /> : <ShieldOff className="w-4 h-4 text-yellow-400" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)} title="O'chirish">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Yangi foydalanuvchi qo&apos;shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Username *</Label>
              <Input placeholder="Foydalanuvchi nomi" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Parol *</Label>
              <Input type="password" placeholder="Kamida 8 ta belgi" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewUser || viewLoading} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Foydalanuvchi ma&apos;lumotlari</DialogTitle></DialogHeader>
          {viewLoading ? (
            <p className="text-muted-foreground text-center py-4">Yuklanmoqda...</p>
          ) : viewUser ? (
            <div className="space-y-4">
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
                  <p className="text-lg font-semibold">{viewUser.full_name || viewUser.username}</p>
                  <p className="text-sm text-muted-foreground">@{viewUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">ID</Label><p className="text-sm">{viewUser.id}</p></div>
                <div><Label className="text-muted-foreground text-xs">Email</Label><p className="text-sm">{viewUser.email || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Telefon</Label><p className="text-sm">{viewUser.phone || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Viloyat</Label><p className="text-sm">{viewUser.region || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Tuman</Label><p className="text-sm">{viewUser.district || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Maktab</Label><p className="text-sm">{viewUser.school || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Sinf</Label><p className="text-sm">{viewUser.grade || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Tug&apos;ilgan sana</Label><p className="text-sm">{viewUser.birth_date ? new Date(viewUser.birth_date).toLocaleDateString() : "—"}</p></div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge className={viewUser.status === "active" ? "bg-green-600" : "bg-red-600"}>{viewUser.status}</Badge>
                    {viewUser.is_profile_completed ? (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Tasdiqlangan</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Tasdiqlanmagan</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Telegram</Label>
                  <p className="text-sm">{viewUser.is_telegram_linked ? "✅ Ulangan" : "❌ Ulanmagan"}</p>
                </div>
                <div><Label className="text-muted-foreground text-xs">Yaratilgan</Label><p className="text-sm">{new Date(viewUser.created_at).toLocaleString()}</p></div>
              </div>

              {/* Verify/Reject buttons in detail view */}
              {viewUser.is_profile_completed && !viewUser.is_telegram_linked && (
                <div className="pt-2 border-t border-border flex gap-2">
                  <Button onClick={() => handleVerify(viewUser.id)} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="h-4 w-4" />
                    Tasdiqlash
                  </Button>
                  <Button onClick={() => { setRejectDialog(viewUser.id); setViewUser(null); }} variant="destructive" className="flex-1 gap-2">
                    <UserX className="h-4 w-4" />
                    Rad etish
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog !== null} onOpenChange={() => { setRejectDialog(null); setRejectReason(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Foydalanuvchini rad etish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rad etish sababi *</Label>
              <Input
                placeholder="Sababni kiriting..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>Bekor qilish</Button>
            <Button variant="destructive" onClick={() => rejectDialog && handleRejectUser(rejectDialog)} className="gap-2">
              <UserX className="h-4 w-4" />
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
