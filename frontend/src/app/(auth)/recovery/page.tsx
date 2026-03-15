"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bot, CheckCircle2, AlertCircle, Loader2, Send, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

type RecoveryStep = "identify" | "bot_verify" | "reset_password" | "success";

export default function RecoveryPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<RecoveryStep>("identify");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [botURL, setBotURL] = useState("");
  const [botName, setBotName] = useState("");

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/recovery/identify", { identifier });
      const data = res.data?.data;
      if (data?.bot_url) setBotURL(data.bot_url);
      if (data?.bot_name) setBotName(data.bot_name);
      setStep("bot_verify");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Foydalanuvchi topilmadi yoki Telegram bog'lanmagan");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (verificationCode.length < 6) {
      setError("Kod 6 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/recovery/verify", {
        identifier,
        code: verificationCode,
      });
      setStep("reset_password");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Kod noto'g'ri yoki muddati tugagan");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmaydi");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/recovery/reset", {
        identifier,
        code: verificationCode,
        new_password: newPassword,
      });
      setStep("success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setVerificationCode("");
    setLoading(true);
    try {
      const res = await api.post("/auth/recovery/identify", { identifier });
      const data = res.data?.data;
      if (data?.bot_url) setBotURL(data.bot_url);
      if (data?.bot_name) setBotName(data.bot_name);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Kod qayta yuborishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-mesh px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <Card className="relative w-full max-w-md shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex justify-center mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl shadow-lg shadow-blue-500/25">
              NO
            </div>
          </Link>
          <CardTitle className="text-2xl text-white">{t("auth.account_recovery")}</CardTitle>
          <p className="text-sm text-blue-200/60 mt-1">{t("auth.recovery_desc")}</p>
        </CardHeader>
        <CardContent>
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["identify", "bot_verify", "reset_password", "success"] as RecoveryStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full transition-colors ${
                  step === s ? "bg-blue-400 ring-4 ring-blue-400/20" :
                  (["identify", "bot_verify", "reset_password", "success"].indexOf(step) > i ? "bg-blue-400" : "bg-white/20")
                }`} />
                {i < 3 && <div className={`w-8 h-0.5 ${
                  ["identify", "bot_verify", "reset_password", "success"].indexOf(step) > i ? "bg-blue-400" : "bg-white/10"
                }`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Identify user */}
          {step === "identify" && (
            <form onSubmit={handleIdentify} className="space-y-4">
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-200">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <p>
                    Foydalanuvchi nomingizni kiriting. Telegram botga kirib bir martalik kodni oling.
                    Telegram akkauntingiz bog&apos;langan bo&apos;lishi kerak.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-100/80 text-xs">Foydalanuvchi nomi (username)</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="username"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0 gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {loading ? "Tekshirilmoqda..." : "Botga o'tish"}
              </Button>
            </form>
          )}

          {/* Step 2: Bot verification */}
          {step === "bot_verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-200">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium">Telegram botga kirib, bir martalik kodni oling!</p>
                    <p className="text-green-200/70">
                      Quyidagi tugmani bosib botni oching, &quot;/recovery&quot; buyrug&apos;ini yuboring va kodni oling.
                    </p>
                    {botURL && (
                      <a
                        href={botURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-colors text-xs font-medium"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        @{botName || "NextOlympBot"} — botni ochish
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-100/80 text-xs">Bir martalik kodni kiriting</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20 text-center text-lg tracking-widest"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Tekshirilmoqda..." : "Kodni tasdiqlash"}
              </Button>
              <button type="button" onClick={handleResend} className="w-full text-center text-sm text-blue-300/50 hover:text-blue-300 transition-colors" disabled={loading}>
                Kodni qayta yuborish
              </button>
            </form>
          )}

          {/* Step 3: Reset password */}
          {step === "reset_password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  <p>Kod tasdiqlandi! Yangi parolni kiriting.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-100/80 text-xs">Yangi parol</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kamida 8 ta belgi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-100/80 text-xs">Parolni tasdiqlang</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Parolni qayta kiriting"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Parol muvaffaqiyatli o&apos;zgartirildi!</h3>
                <p className="text-sm text-blue-200/60 mt-1">Yangi parol bilan tizimga kirishingiz mumkin.</p>
              </div>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t("auth.login")}
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-300/50 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              {t("auth.back_to_login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
