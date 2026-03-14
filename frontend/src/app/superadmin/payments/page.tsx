"use client";

import { useEffect, useState } from "react";
import { getPayments, getPaymentStats, approvePayment, refundPayment, updatePaymentStatus } from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, CheckCircle, RotateCcw, DollarSign, Clock, XCircle, TrendingUp, Tag } from "lucide-react";
import Link from "next/link";

interface Payment {
  id: number;
  user_id: number;
  user_name: string;
  source_type: string;
  source_id: number;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string;
  payment_method: string;
  created_at: string;
}

interface PaymentStats {
  total_revenue: number;
  pending_count: number;
  pending_amount: number;
  completed_count: number;
  completed_amount: number;
  failed_count: number;
  failed_amount: number;
  refunded_count: number;
  refunded_amount: number;
}

const paymentStatuses = ["pending", "completed", "failed", "refunded"];
const sourceTypes = ["olympiad", "mock_test"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-600", completed: "bg-green-600", failed: "bg-red-600", refunded: "bg-purple-600"
};

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRefund, setShowRefund] = useState(false);
  const [refundId, setRefundId] = useState<number | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [statusUpdateId, setStatusUpdateId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPayments({
        page, limit, search,
        status: statusFilter || undefined,
        source_type: sourceTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      });
      setItems(normalizeList(res));
      setTotal(res.pagination?.total || res?.data?.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await getPaymentStats();
      setStats(res.data || res);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => { fetchData(); }, [page, search, statusFilter, sourceTypeFilter, dateFrom, dateTo]);
  useEffect(() => { fetchStats(); }, []);

  const handleApprove = async (id: number) => {
    if (!confirm("To'lovni tasdiqlashni xohlaysizmi?")) return;
    try {
      await approvePayment(id);
      fetchData();
      fetchStats();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const handleRefund = async () => {
    if (!refundId) return;
    try {
      await refundPayment(refundId, { reason: refundReason });
      setShowRefund(false);
      setRefundId(null);
      setRefundReason("");
      fetchData();
      fetchStats();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateId || !newStatus) return;
    try {
      await updatePaymentStatus(statusUpdateId, { status: newStatus });
      setShowStatusUpdate(false);
      setStatusUpdateId(null);
      setNewStatus("");
      fetchData();
      fetchStats();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatCurrency = (amount: number) => `${amount?.toLocaleString()} so'm`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">To&apos;lovlar</h1>
        <Link href="/superadmin/payments/promo-codes">
          <Button variant="outline" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Promo kodlar
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="w-4 h-4" /> Jami daromad</div>
            <p className="text-xl font-bold text-green-400">{formatCurrency(stats.total_revenue)}</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-4 h-4" /> Kutilmoqda</div>
            <p className="text-xl font-bold text-yellow-400">{stats.pending_count}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.pending_amount)}</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle className="w-4 h-4" /> Tasdiqlangan</div>
            <p className="text-xl font-bold text-green-400">{stats.completed_count}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.completed_amount)}</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><XCircle className="w-4 h-4" /> Muvaffaqiyatsiz</div>
            <p className="text-xl font-bold text-red-400">{stats.failed_count}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.failed_amount)}</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><RotateCcw className="w-4 h-4" /> Qaytarilgan</div>
            <p className="text-xl font-bold text-purple-400">{stats.refunded_count}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.refunded_amount)}</p>
          </div>
        </div>
      )}

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
            {paymentStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceTypeFilter} onValueChange={(v) => { setSourceTypeFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-muted border-border"><SelectValue placeholder="Manba turi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {sourceTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="w-[150px] bg-muted border-border" placeholder="Dan" />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="w-[150px] bg-muted border-border" placeholder="Gacha" />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Manba turi</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Valyuta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tranzaksiya ID</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">To&apos;lov topilmadi</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-accent">
                <TableCell>{item.id}</TableCell>
                <TableCell className="font-medium">{item.user_name || `ID: ${item.user_id}`}</TableCell>
                <TableCell><Badge variant="secondary">{item.source_type}</Badge></TableCell>
                <TableCell className="font-medium">{item.amount?.toLocaleString()}</TableCell>
                <TableCell>{item.currency || "UZS"}</TableCell>
                <TableCell><Badge className={statusColors[item.status] || "bg-gray-600"}>{item.status}</Badge></TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate">{item.transaction_id || "—"}</TableCell>
                <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {item.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => handleApprove(item.id)} title="Tasdiqlash">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </Button>
                    )}
                    {item.status === "completed" && (
                      <Button size="sm" variant="ghost" onClick={() => { setRefundId(item.id); setShowRefund(true); }} title="Qaytarish">
                        <RotateCcw className="w-4 h-4 text-purple-400" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setStatusUpdateId(item.id); setNewStatus(item.status); setShowStatusUpdate(true); }} title="Status o'zgartirish">
                      <DollarSign className="w-4 h-4 text-blue-400" />
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

      {/* Refund Dialog */}
      <Dialog open={showRefund} onOpenChange={setShowRefund}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>To&apos;lovni qaytarish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sabab</Label>
              <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-muted border border-border rounded-md p-2 text-sm min-h-[80px]"
                placeholder="Qaytarish sababini kiriting..." />
            </div>
            <Button onClick={handleRefund} className="w-full bg-purple-600 hover:bg-purple-700">Qaytarish</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Statusni o&apos;zgartirish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Yangi status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v ?? "")}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{paymentStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleStatusUpdate} className="w-full bg-orange-500 hover:bg-orange-600">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
