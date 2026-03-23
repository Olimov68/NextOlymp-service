"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertCircle,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  getBalance,
  getTransactions,
  topUp,
  applyPromoCode,
  type BalanceInfo,
  type Transaction,
  type PromoApplyResponse,
  type TopUpResponse,
} from "@/lib/user-api";
import { getErrorMessage } from "@/lib/api-error";

export default function BalancePage() {
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTxns, setTotalTxns] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMessage, setTopUpMessage] = useState("");
  const [topUpError, setTopUpError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoApplyResponse | null>(null);
  const [promoError, setPromoError] = useState("");
  const perPage = 10;

  const loadData = async (p: number) => {
    try {
      const [bal, txns] = await Promise.all([
        getBalance(),
        getTransactions({ page: p, per_page: perPage }),
      ]);
      setBalance(bal);
      setTransactions(Array.isArray(txns.data) ? txns.data : []);
      setTotalTxns(txns.total || 0);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user returned from Payme
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setTopUpMessage("To'lov muvaffaqiyatli amalga oshirildi! Balans yangilanmoqda...");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    loadData(page);
  }, [page]);

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10);
    if (!amount || amount < 1000) {
      setTopUpError("Minimum summa 1,000 so'm");
      return;
    }
    setTopUpLoading(true);
    setTopUpError("");
    setTopUpMessage("");
    try {
      const result: TopUpResponse = await topUp(amount);

      if (result.payme && result.payme.merchant_id) {
        // Redirect to Payme checkout via form POST
        const form = document.createElement("form");
        form.method = "POST";
        form.action = result.payme.checkout_url;

        const fields: Record<string, string> = {
          merchant: result.payme.merchant_id,
          amount: String(result.payme.amount),
          "account[order_id]": String(result.payme.order_id),
          lang: "uz",
          callback: window.location.origin + "/dashboard/balance?payment=success",
        };

        for (const [key, value] of Object.entries(fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Fallback if Payme not configured
      setTopUpMessage("So'rov muvaffaqiyatli yuborildi!");
      setTopUpAmount("");
      await loadData(page);
    } catch (err: unknown) {
      setTopUpError(getErrorMessage(err, "Xatolik yuz berdi"));
    } finally {
      setTopUpLoading(false);
    }
  };

  const handlePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Promo kodni kiriting");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const result = await applyPromoCode({ code: promoCode.trim(), amount: parseInt(topUpAmount) || 0 });
      setPromoResult(result);
    } catch (err: unknown) {
      setPromoError(getErrorMessage(err, "Promo kod xato yoki muddati tugagan"));
    } finally {
      setPromoLoading(false);
    }
  };

  const totalPages = Math.ceil(totalTxns / perPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Balans</h1>
        <p className="text-muted-foreground mt-1">Hisobingizni boshqaring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 shadow-lg lg:col-span-2">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">Joriy balans</p>
                <p className="text-4xl font-bold text-white">
                  {(balance?.balance ?? 0).toLocaleString()} so&apos;m
                </p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Up Form */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-600" />
              Hisobni to&apos;ldirish
            </h3>
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Summani kiriting"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="bg-background"
                min={0}
              />
              <div className="flex gap-2 flex-wrap">
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(String(amt))}
                    className="px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleTopUp}
                disabled={topUpLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {topUpLoading ? "Yuklanmoqda..." : "To'ldirish"}
              </Button>
              {topUpMessage && (
                <div className="p-2 bg-green-50 rounded-lg flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {topUpMessage}
                </div>
              )}
              {topUpError && (
                <div className="p-2 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {topUpError}
                </div>
              )}

              {/* Promo Code Section */}
              <div className="border-t pt-3 mt-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Promo kod
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo kod kiriting"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="bg-background"
                  />
                  <Button
                    onClick={handlePromoCode}
                    disabled={promoLoading}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {promoLoading ? "..." : "Tekshirish"}
                  </Button>
                </div>
                {promoResult && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 space-y-1">
                    <p className="text-sm font-medium text-green-700">
                      Chegirma: -{promoResult.discount_amount.toLocaleString()} so&apos;m
                    </p>
                    <p className="text-sm text-green-600">
                      Yakuniy summa: {promoResult.final_amount.toLocaleString()} so&apos;m
                    </p>
                  </div>
                )}
                {promoError && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {promoError}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Tranzaksiyalar tarixi</h2>

          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Hozircha tranzaksiya yo&apos;q
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turi</TableHead>
                      <TableHead>Tavsif</TableHead>
                      <TableHead className="text-right">Summa</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {t.type === "topup" || t.type === "credit" ? (
                              <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                                <ArrowDownLeft className="h-4 w-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center">
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-foreground capitalize">
                              {t.type === "topup"
                                ? "To'ldirish"
                                : t.type === "credit"
                                ? "Kirim"
                                : t.type === "debit"
                                ? "Chiqim"
                                : t.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.description || "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-semibold ${
                            t.type === "topup" || t.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {t.type === "topup" || t.type === "credit" ? "+" : "-"}
                          {Math.abs(t.amount).toLocaleString()} so&apos;m
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-0 ${
                              t.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : t.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {t.status === "completed"
                              ? "Bajarildi"
                              : t.status === "pending"
                              ? "Kutilmoqda"
                              : t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(t.created_at).toLocaleString("uz-UZ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={totalTxns} className="mt-4 pt-4 border-t" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
