"use client";

import { useEffect, useState } from "react";
import {
  getAdminUsers, getAdminUser, blockAdminUser, unblockAdminUser,
  verifyAdminUser, rejectAdminUser, getPendingVerificationUsers,
} from "@/lib/admin-api";
import { PermissionGuard } from "@/components/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, ShieldOff, Shield, ChevronLeft, ChevronRight, Eye,
  CheckCircle, XCircle, Clock, UserCheck, Loader2,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  full_name: string;
  region: string;
  grade: number;
  status: string;
  verification_status: string;
  is_telegram_linked: boolean;
  created_at: string;
}

interface UserDetail extends User {
  email: string;
  phone: string;
  school: string;
  district: string;
  birth_date: string;
  verification_note: string;
  verified_at: string;
}

const verificationBadge = (status: string) => {
  switch (status) {
    case "telegram_verified":
      return <Badge className="bg-blue-600 text-white text-[10px]">Telegram</Badge>;
    case "admin_verified":
      return <Badge className="bg-green-600 text-white text-[10px]">Admin</Badge>;
    case "rejected":
      return <Badge className="bg-red-600 text-white text-[10px]">Rad etilgan</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">Kutilmoqda</Badge>;
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState<UserDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifyDialog, setVerifyDialog] = useState<{ id: number; action: "verify" | "reject" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        page, limit, search,
        status: statusFilter || undefined,
        verification_status: verificationFilter || undefined,
      });
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setUsers(list);
      setTotal(res.total || 0);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  const fetchPending = async () => {
    setPendingLoading(true);
    try {
      const res = await getPendingVerificationUsers();
      setPendingUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPendingUsers([]);
    }
    setPendingLoading(false);
  };

  useEffect(() => {
    if (tab === "all") fetchUsers();
    else fetchPending();
  }, [page, search, statusFilter, verificationFilter, tab]);

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

  const handleVerifyAction = async () => {
    if (!verifyDialog) return;
    setActionLoading(true);
    try {
      if (verifyDialog.action === "verify") {
        await verifyAdminUser(verifyDialog.id, { note: verifyNote });
      } else {
        await rejectAdminUser(verifyDialog.id, { note: verifyNote });
      }
      setVerifyDialog(null);
      setVerifyNote("");
      if (tab === "all") fetchUsers();
      else fetchPending();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
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

        {/* Tabs */}
        <div className="flex gap-2">
          <Button variant={tab === "all" ? "default" : "outline"} size="sm" onClick={() => setTab("all")}>
            Hammasi
          </Button>
          <Button variant={tab === "pending" ? "default" : "outline"} size="sm" onClick={() => setTab("pending")}>
            <Clock className="h-4 w-4 mr-1" />
            Tasdiqlash kutilmoqda
            {pendingUsers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </Button>
        </div>

        {tab === "all" && (
          <>
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
              <Select value={verificationFilter} onValueChange={(v) => { setVerificationFilter(!v || v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-[180px] bg-background border-border">
                  <SelectValue placeholder="Tasdiqlash" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hammasi</SelectItem>
                  <SelectItem value="pending">Kutilmoqda</SelectItem>
                  <SelectItem value="telegram_verified">Telegram</SelectItem>
                  <SelectItem value="admin_verified">Admin</SelectItem>
                  <SelectItem value="rejected">Rad etilgan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-accent">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Username</TableHead>
                    <TableHead className="text-muted-foreground">Ism</TableHead>
                    <TableHead className="text-muted-foreground">Viloyat</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Tasdiqlash</TableHead>
                    <TableHead className="text-muted-foreground">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i} className="border-border">
                        {[...Array(7)].map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Foydalanuvchi topilmadi
                      </TableCell>
                    </TableRow>
                  ) : users.map((u) => (
                    <TableRow key={u.id} className="border-border hover:bg-accent">
                      <TableCell className="text-foreground">{u.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{u.username}</TableCell>
                      <TableCell className="text-foreground">{u.full_name || "\u2014"}</TableCell>
                      <TableCell className="text-foreground">{u.region || "\u2014"}</TableCell>
                      <TableCell>
                        <Badge className={`${u.status === "active" ? "bg-green-600" : "bg-red-600"} text-white text-[10px]`}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{verificationBadge(u.verification_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewUser(u.id)} title="Ko'rish">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          {u.verification_status === "pending" && (
                            <PermissionGuard permission="users.block">
                              <Button size="sm" variant="ghost" onClick={() => setVerifyDialog({ id: u.id, action: "verify" })} title="Tasdiqlash">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setVerifyDialog({ id: u.id, action: "reject" })} title="Rad etish">
                                <XCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            </PermissionGuard>
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jami: {total}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm text-foreground">{page} / {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pending Verification Tab */}
        {tab === "pending" && (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Username</TableHead>
                  <TableHead className="text-muted-foreground">Ism</TableHead>
                  <TableHead className="text-muted-foreground">Viloyat</TableHead>
                  <TableHead className="text-muted-foreground">Telegram</TableHead>
                  <TableHead className="text-muted-foreground">Sana</TableHead>
                  <TableHead className="text-muted-foreground">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell></TableRow>
                  ))
                ) : pendingUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <UserCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      Tasdiqlash kutayotgan foydalanuvchilar yo'q
                    </TableCell>
                  </TableRow>
                ) : pendingUsers.map((u) => (
                  <TableRow key={u.id} className="border-border hover:bg-accent">
                    <TableCell>{u.id}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.full_name || "\u2014"}</TableCell>
                    <TableCell>{u.region || "\u2014"}</TableCell>
                    <TableCell>
                      <Badge variant={u.is_telegram_linked ? "default" : "secondary"} className="text-[10px]">
                        {u.is_telegram_linked ? "Ulangan" : "Yo'q"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                          onClick={() => setVerifyDialog({ id: u.id, action: "verify" })}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Tasdiqlash
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs"
                          onClick={() => setVerifyDialog({ id: u.id, action: "reject" })}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Rad etish
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-muted-foreground text-xs">ID</Label><p className="text-sm text-foreground">{viewUser.id}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Username</Label><p className="text-sm text-foreground">{viewUser.username}</p></div>
                  <div><Label className="text-muted-foreground text-xs">To&apos;liq ism</Label><p className="text-sm text-foreground">{viewUser.full_name}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Viloyat</Label><p className="text-sm text-foreground">{viewUser.region || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Tuman</Label><p className="text-sm text-foreground">{viewUser.district || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Maktab</Label><p className="text-sm text-foreground">{viewUser.school || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Sinf</Label><p className="text-sm text-foreground">{viewUser.grade || "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Tug&apos;ilgan sana</Label><p className="text-sm text-foreground">{viewUser.birth_date ? new Date(viewUser.birth_date).toLocaleDateString() : "\u2014"}</p></div>
                  <div><Label className="text-muted-foreground text-xs">Status</Label><Badge className={`${viewUser.status === "active" ? "bg-green-600" : "bg-red-600"} text-white`}>{viewUser.status}</Badge></div>
                  <div><Label className="text-muted-foreground text-xs">Tasdiqlash</Label>{verificationBadge(viewUser.verification_status)}</div>
                  {viewUser.verification_note && (
                    <div className="col-span-2"><Label className="text-muted-foreground text-xs">Izoh</Label><p className="text-sm text-foreground">{viewUser.verification_note}</p></div>
                  )}
                  {viewUser.verified_at && (
                    <div><Label className="text-muted-foreground text-xs">Tasdiqlangan sana</Label><p className="text-sm text-foreground">{new Date(viewUser.verified_at).toLocaleString()}</p></div>
                  )}
                  <div><Label className="text-muted-foreground text-xs">Yaratilgan</Label><p className="text-sm text-foreground">{new Date(viewUser.created_at).toLocaleString()}</p></div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Verify/Reject Dialog */}
        <Dialog open={!!verifyDialog} onOpenChange={() => { setVerifyDialog(null); setVerifyNote(""); }}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {verifyDialog?.action === "verify" ? "Foydalanuvchini tasdiqlash" : "Foydalanuvchini rad etish"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Izoh (ixtiyoriy)</Label>
                <Textarea
                  placeholder="Izoh yozing..."
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setVerifyDialog(null); setVerifyNote(""); }}>
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleVerifyAction}
                  disabled={actionLoading}
                  className={verifyDialog?.action === "verify" ? "bg-green-600 hover:bg-green-700" : ""}
                  variant={verifyDialog?.action === "reject" ? "destructive" : "default"}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {verifyDialog?.action === "verify" ? "Tasdiqlash" : "Rad etish"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
