"use client";

import { useEffect, useState } from "react";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCode,
  getPromoCodeStats,
} from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Tag,
  Percent,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Backend PromoCodeResponse DTO — exact field names
interface PromoCode {
  id: number;
  code: string;
  description: string;
  discount_type: string;
  discount_percent: number;
  discount_fixed: number;
  max_usage_count: number;
  used_count: number;
  per_user_limit: number;
  min_amount: number;
  max_discount?: number | null;
  source_type: string;
  valid_from: string | null;
  valid_until: string | null;
  status: string; // "active" | "inactive" | "expired"
  created_by_id?: number | null;
  created_at: string;
  updated_at: string;
}

// Backend PromoCodeStatsResponse DTO
interface PromoStats {
  total_codes: number;
  active_codes: number;
  total_usages: number;
  total_discounted: number;
}

export default function PromoCodesPage() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PromoCode | null>(null);
  const limit = 20;

  const [formError, setFormError] = useState("");

  // Form state — matches backend CreatePromoCodeRequest DTO exactly
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent",
    discount_percent: 0,
    discount_fixed: 0,
    max_usage_count: 0,
    per_user_limit: 1,
    min_amount: 0,
    max_discount: 0, // backend: max chegirma summasi (faqat percent uchun)
    source_type: "all",
    valid_from: "",
    valid_until: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPromoCodes({ page, limit, search: search || undefined });
      // SuccessWithPagination returns { success, message, data: [...], pagination: {...} }
      const data = res.data || res;
      setItems(normalizeList<PromoCode>(data));
      setTotal(res.pagination?.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await getPromoCodeStats();
      // Success returns { success, message, data: {...} }
      setStats(res.data || res);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);
  useEffect(() => {
    fetchStats();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setFormError("");
    setForm({
      code: "",
      description: "",
      discount_type: "percent",
      discount_percent: 0,
      discount_fixed: 0,
      max_usage_count: 0,
      per_user_limit: 1,
      min_amount: 0,
      max_discount: 0,
      source_type: "all",
      valid_from: "",
      valid_until: "",
    });
    setShowForm(true);
  };

  const openEdit = (item: PromoCode) => {
    setEditItem(item);
    setFormError("");
    setForm({
      code: item.code,
      description: item.description || "",
      discount_type: item.discount_type || "percent",
      discount_percent: item.discount_percent,
      discount_fixed: item.discount_fixed,
      max_usage_count: item.max_usage_count,
      per_user_limit: item.per_user_limit,
      min_amount: item.min_amount,
      max_discount: item.max_discount ?? 0,
      source_type: item.source_type || "all",
      valid_from: item.valid_from ? item.valid_from.split("T")[0] : "",
      valid_until: item.valid_until ? item.valid_until.split("T")[0] : "",
    });
    setShowForm(true);
  };

  // Extract error message from backend response
  const extractError = (e: unknown): string => {
    const err = e as { response?: { data?: { message?: string; errors?: unknown } } };
    const data = err?.response?.data;
    if (data?.message) {
      // If validation errors exist, append them
      if (data.errors) {
        const errStr = typeof data.errors === "string"
          ? data.errors
          : JSON.stringify(data.errors);
        return `${data.message}: ${errStr}`;
      }
      return data.message;
    }
    return "Xatolik yuz berdi";
  };

  const handleSave = async () => {
    setFormError("");

    // Frontend validation
    if (!form.code.trim()) {
      setFormError("Promo kodni kiriting (min 3 belgi)");
      return;
    }
    if (form.code.trim().length < 3) {
      setFormError("Promo kod kamida 3 belgidan iborat bo'lishi kerak");
      return;
    }
    if (form.discount_type === "percent" && (form.discount_percent <= 0 || form.discount_percent > 100)) {
      setFormError("Chegirma foizi 1-100 orasida bo'lishi kerak");
      return;
    }
    if (form.discount_type === "fixed" && form.discount_fixed <= 0) {
      setFormError("Summali chegirma 0 dan katta bo'lishi kerak");
      return;
    }

    try {
      // Build payload matching backend CreatePromoCodeRequest DTO exactly
      const payload: Record<string, unknown> = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        discount_type: form.discount_type,
        discount_percent: form.discount_type === "percent" ? form.discount_percent : 0,
        discount_fixed: form.discount_type === "fixed" ? form.discount_fixed : 0,
        max_usage_count: form.max_usage_count,
        per_user_limit: form.per_user_limit,
        min_amount: form.min_amount,
        source_type: form.source_type,
      };

      // max_discount — only for percent type, only if > 0
      if (form.discount_type === "percent" && form.max_discount > 0) {
        payload.max_discount = form.max_discount;
      }

      // Dates — send as RFC3339 string or omit entirely
      if (form.valid_from) {
        payload.valid_from = form.valid_from + "T00:00:00Z";
      }
      if (form.valid_until) {
        payload.valid_until = form.valid_until + "T23:59:59Z";
      }

      if (editItem) {
        await updatePromoCode(editItem.id, payload);
        toast.success("Promo kod yangilandi");
      } else {
        await createPromoCode(payload);
        toast.success("Promo kod yaratildi");
      }
      setShowForm(false);
      setSearch("");
      await fetchData();
      await fetchStats();
    } catch (e: unknown) {
      const msg = extractError(e);
      setFormError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Promo kodni o'chirmoqchimisiz?")) return;
    try {
      await deletePromoCode(id);
      toast.success("Promo kod o'chirildi");
      fetchData();
      fetchStats();
    } catch (e: unknown) {
      const msg = extractError(e);
      toast.error(msg);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await togglePromoCode(id);
      toast.success("Status yangilandi");
      fetchData();
    } catch (e: unknown) {
      toast.error(extractError(e));
    }
  };

  const isActive = (item: PromoCode) => item.status === "active";
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/superadmin/payments"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Promo kodlar</h1>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yangi promo kod
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Tag className="w-4 h-4" /> Jami
            </div>
            <p className="text-xl font-bold">{stats.total_codes}</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <ToggleRight className="w-4 h-4" /> Faol
            </div>
            <p className="text-xl font-bold text-green-400">{stats.active_codes}</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Percent className="w-4 h-4" /> Ishlatilgan
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.total_usages}</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-4 h-4" /> Chegirma summasi
            </div>
            <p className="text-xl font-bold text-amber-400">
              {(stats.total_discounted || 0).toLocaleString()} UZS
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
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

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>Kod</TableHead>
              <TableHead>Chegirma</TableHead>
              <TableHead>Ishlatilgan</TableHead>
              <TableHead>Manba turi</TableHead>
              <TableHead>Amal qilish</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Yuklanmoqda...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Promo kod topilmadi
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-accent">
                  <TableCell className="font-mono font-bold">{item.code}</TableCell>
                  <TableCell>
                    {item.discount_type === "fixed" ? (
                      <span>{item.discount_fixed?.toLocaleString()} UZS</span>
                    ) : (
                      <span>{item.discount_percent}%</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.used_count} / {item.max_usage_count || "\u221E"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.source_type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.valid_from
                      ? new Date(item.valid_from).toLocaleDateString()
                      : "—"}{" "}
                    ~{" "}
                    {item.valid_until
                      ? new Date(item.valid_until).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        isActive(item) ? "bg-green-600" : "bg-gray-600"
                      }
                    >
                      {isActive(item) ? "Faol" : "Nofaol"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(item.id)}
                        title={isActive(item) ? "O'chirish" : "Yoqish"}
                      >
                        {isActive(item) ? (
                          <ToggleRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="O'chirish"
                      >
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Jami: {total}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-sm">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Promo kodni tahrirlash" : "Yangi promo kod"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Inline validation error */}
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
                {formError}
              </div>
            )}
            <div>
              <Label>Kod</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="SALE2024"
                className="bg-muted border-border font-mono"
              />
            </div>
            <div>
              <Label>Tavsif (ixtiyoriy)</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Promo kod tavsifi..."
                className="bg-muted border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chegirma turi</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) => setForm({ ...form, discount_type: v ?? "percent" })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Foiz (%)</SelectItem>
                    <SelectItem value="fixed">Qat&apos;iy summa (UZS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {form.discount_type === "percent" ? (
                  <>
                    <Label>Foiz (%)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={form.discount_percent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discount_percent: Number(e.target.value),
                        })
                      }
                      className="bg-muted border-border"
                    />
                  </>
                ) : (
                  <>
                    <Label>Summa (UZS)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.discount_fixed}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discount_fixed: Number(e.target.value),
                        })
                      }
                      className="bg-muted border-border"
                    />
                  </>
                )}
              </div>
            </div>
            {/* Max discount — only for percent type */}
            {form.discount_type === "percent" && (
              <div>
                <Label>Maks chegirma summasi (UZS, 0 = cheksiz)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_discount}
                  onChange={(e) =>
                    setForm({ ...form, max_discount: Number(e.target.value) })
                  }
                  placeholder="Masalan: 50000"
                  className="bg-muted border-border"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Maks ishlatish soni (0 = cheksiz)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_usage_count}
                  onChange={(e) =>
                    setForm({ ...form, max_usage_count: Number(e.target.value) })
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label>Har bir user uchun limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.per_user_limit}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      per_user_limit: Number(e.target.value),
                    })
                  }
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimal summa (UZS)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_amount}
                  onChange={(e) =>
                    setForm({ ...form, min_amount: Number(e.target.value) })
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label>Manba turi</Label>
                <Select
                  value={form.source_type}
                  onValueChange={(v) => setForm({ ...form, source_type: v ?? "" })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Hammasi</SelectItem>
                    <SelectItem value="olympiad">Olimpiada</SelectItem>
                    <SelectItem value="mock_test">Mock test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Boshlanish sanasi</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) =>
                    setForm({ ...form, valid_from: e.target.value })
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label>Tugash sanasi</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) =>
                    setForm({ ...form, valid_until: e.target.value })
                  }
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editItem ? "Saqlash" : "Yaratish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
