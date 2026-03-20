"use client";

import { useEffect, useState } from "react";
import {
  getPromoCodes,
  createPromoCode,
  deletePromoCode,
  togglePromoCode,
  getPromoCodeUsages,
  getPromoCodeStats,
} from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Loader2,
  Tag,
  Search,
  TicketPercent,
  Users,
  TrendingUp,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

interface PromoCode {
  id: number;
  code: string;
  discount_amount: number;
  discount_type: string;
  max_usage: number;
  usage_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface PromoStats {
  total_codes: number;
  active_codes: number;
  total_used: number;
  total_discount_given: number;
}

interface PromoUsage {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  discount_amount: number;
  used_at: string;
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [usagesOpen, setUsagesOpen] = useState(false);
  const [usages, setUsages] = useState<PromoUsage[]>([]);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);

  // Create form
  const [newCode, setNewCode] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState("percent");
  const [newMaxUsage, setNewMaxUsage] = useState("");
  const [newExpires, setNewExpires] = useState("");

  const limit = 20;

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await getPromoCodes({ page, page_size: limit, search: search || undefined });
      const list = normalizeList<PromoCode>(res);
      setCodes(list);
      setTotal(res.pagination?.total || res?.data?.total || list.length);
    } catch {
      setCodes([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await getPromoCodeStats();
      setStats(res.data || res);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [page, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreate = async () => {
    if (!newCode.trim() || !newAmount) {
      toast.error("Kod va chegirma summasi majburiy");
      return;
    }
    setCreating(true);
    try {
      await createPromoCode({
        code: newCode.trim().toUpperCase(),
        discount_amount: Number(newAmount),
        discount_type: newType,
        max_usage: newMaxUsage ? Number(newMaxUsage) : 0,
        expires_at: newExpires || undefined,
      });
      toast.success("Promo kod yaratildi");
      setCreateOpen(false);
      resetForm();
      fetchCodes();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Xatolik");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewCode("");
    setNewAmount("");
    setNewType("percent");
    setNewMaxUsage("");
    setNewExpires("");
  };

  const handleToggle = async (id: number) => {
    try {
      await togglePromoCode(id);
      toast.success("Status o'zgartirildi");
      fetchCodes();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Xatolik");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Promo kodni o'chirishni xohlaysizmi?")) return;
    try {
      await deletePromoCode(id);
      toast.success("O'chirildi");
      fetchCodes();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Xatolik");
    }
  };

  const handleViewUsages = async (code: PromoCode) => {
    setSelectedCode(code);
    setUsagesOpen(true);
    setUsagesLoading(true);
    try {
      const res = await getPromoCodeUsages(code.id);
      const list = normalizeList<PromoUsage>(res);
      setUsages(list);
    } catch {
      setUsages([]);
    }
    setUsagesLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  const formatDiscount = (code: PromoCode) => {
    if (code.discount_type === "percent") return `${code.discount_amount}%`;
    return `${code.discount_amount.toLocaleString()} so'm`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo kodlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Jami: {total}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Yangi promo kod
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Tag className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jami kodlar</p>
                <p className="text-xl font-bold">{stats.total_codes}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TicketPercent className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faol kodlar</p>
                <p className="text-xl font-bold">{stats.active_codes}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jami ishlatilgan</p>
                <p className="text-xl font-bold">{stats.total_used}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jami chegirma</p>
                <p className="text-xl font-bold">{stats.total_discount_given?.toLocaleString()} so&apos;m</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kod bo'yicha qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-muted border-border"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Chegirma</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Ishlatilgan</TableHead>
              <TableHead>Maks. ishlatish</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amal qilish</TableHead>
              <TableHead>Yaratilgan</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Yuklanmoqda...
                </TableCell>
              </TableRow>
            ) : codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Promo kod topilmadi
                </TableCell>
              </TableRow>
            ) : (
              codes.map((c) => (
                <TableRow key={c.id} className="border-border hover:bg-accent">
                  <TableCell>{c.id}</TableCell>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>{formatDiscount(c)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.discount_type === "percent" ? "text-blue-400 border-blue-400/30" : "text-green-400 border-green-400/30"}>
                      {c.discount_type === "percent" ? "Foiz" : "Belgilangan"}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.usage_count}</TableCell>
                  <TableCell>{c.max_usage || "Cheksiz"}</TableCell>
                  <TableCell>
                    <Badge className={c.is_active ? "bg-green-600" : "bg-red-600"}>
                      {c.is_active ? "Faol" : "Nofaol"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Cheksiz"}
                  </TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleViewUsages(c)} title="Ishlatishlarni ko'rish">
                        <Eye className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggle(c.id)} title={c.is_active ? "O'chirish" : "Yoqish"}>
                        {c.is_active ? (
                          <ToggleRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} title="O'chirish">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi promo kod yaratish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Kod *</Label>
              <Input
                placeholder="SALE50"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Chegirma summasi *</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Chegirma turi</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v ?? "percentage")}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Foiz (%)</SelectItem>
                    <SelectItem value="fixed">Belgilangan (so&apos;m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Maks. ishlatish soni</Label>
              <Input
                type="number"
                placeholder="0 = cheksiz"
                value={newMaxUsage}
                onChange={(e) => setNewMaxUsage(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amal qilish muddati</Label>
              <Input
                type="datetime-local"
                value={newExpires}
                onChange={(e) => setNewExpires(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usages Dialog */}
      <Dialog open={usagesOpen} onOpenChange={setUsagesOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              Ishlatishlar — <span className="font-mono text-purple-400">{selectedCode?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {usagesLoading ? (
            <p className="text-muted-foreground text-center py-4">Yuklanmoqda...</p>
          ) : usages.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Hali ishlatilmagan</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Chegirma</TableHead>
                    <TableHead>Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((u) => (
                    <TableRow key={u.id} className="border-border">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{u.full_name || u.username}</p>
                          <p className="text-xs text-muted-foreground">{u.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>{u.discount_amount?.toLocaleString()} so&apos;m</TableCell>
                      <TableCell>{new Date(u.used_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
