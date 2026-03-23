"use client";

import { useEffect, useState } from "react";
import { getPayments, getPaymentStats } from "@/lib/superadmin-api";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Search,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Payment {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  amount: number;
  payment_type: string;
  source: string;
  source_id: number;
  source_title: string;
  status: string;
  created_at: string;
}

interface PaymentStats {
  total_revenue: number;
  today_revenue: number;
  month_revenue: number;
  total_transactions: number;
}

export default function RevenuePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: limit,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await getPayments(params);
      const list = normalizeList<Payment>(res);
      setPayments(list);
      setTotal(res.pagination?.total || res?.data?.total || list.length);
    } catch {
      setPayments([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await getPaymentStats();
      setStats(res.data || res);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, search, statusFilter, sourceFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
  }, []);

  const totalPages = Math.ceil(total / limit);

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
      case "success":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "failed":
      case "cancelled":
        return "bg-red-600";
      case "refunded":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case "olympiad":
        return "Olimpiada";
      case "mock_test":
        return "Mock test";
      default:
        return source || "—";
    }
  };

  const formatAmount = (amount: number) => {
    return amount?.toLocaleString() + " so'm";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tushumlar</h1>
        <p className="text-sm text-muted-foreground mt-1">To&apos;lovlar va daromad statistikasi</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jami daromad</p>
                <p className="text-xl font-bold">{stats.total_revenue?.toLocaleString()} so&apos;m</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bugungi daromad</p>
                <p className="text-xl font-bold">{stats.today_revenue?.toLocaleString()} so&apos;m</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bu oylik daromad</p>
                <p className="text-xl font-bold">{stats.month_revenue?.toLocaleString()} so&apos;m</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jami tranzaktsiyalar</p>
                <p className="text-xl font-bold">{stats.total_transactions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Foydalanuvchi qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px] bg-muted border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="completed">Yakunlangan</SelectItem>
            <SelectItem value="pending">Kutilmoqda</SelectItem>
            <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
            <SelectItem value="refunded">Qaytarilgan</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(v) => {
            setSourceFilter(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px] bg-muted border-border">
            <SelectValue placeholder="Manba" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="olympiad">Olimpiada</SelectItem>
            <SelectItem value="mock_test">Mock test</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="w-[160px] bg-muted border-border"
          placeholder="Dan"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="w-[160px] bg-muted border-border"
          placeholder="Gacha"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Manba</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Yuklanmoqda...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  To&apos;lov topilmadi
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id} className="border-border hover:bg-accent">
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{p.full_name || p.username || "—"}</p>
                      {p.username && p.full_name && (
                        <p className="text-xs text-muted-foreground">{p.username}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatAmount(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {p.payment_type || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge
                        variant="outline"
                        className={
                          p.source === "olympiad"
                            ? "text-purple-400 border-purple-400/30"
                            : "text-blue-400 border-blue-400/30"
                        }
                      >
                        {sourceLabel(p.source)}
                      </Badge>
                      {p.source_title && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.source_title}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor(p.status)}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />
    </div>
  );
}
