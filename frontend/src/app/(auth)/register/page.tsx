"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle2, XCircle, Ban } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useI18n();
  const settings = useSettings();

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (username.length < 4) {
      errors.username = t("auth.username_min") || "Kamida 4 ta belgi bo'lishi kerak";
    } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      errors.username = t("auth.username_chars") || "Faqat harf, raqam, _ va . ishlatiladi";
    }
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasDigit) {
      errors.password = t("auth.password_weak") || "Parol talablarga mos emas";
    }
    if (password !== confirmPassword) {
      errors.confirm_password = t("auth.password_mismatch") || "Parollar bir xil emas";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const data = await register({ username, password, confirm_password: confirmPassword });
      setAuth(data.tokens, data.user, data.next_step);
      if (data.next_step === "complete_profile") {
        router.push("/dashboard/profile");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string> } } })?.response?.data;
      if (resp?.errors) {
        setFieldErrors(resp.errors);
      } else {
        setError(resp?.message || "Ro'yxatdan o'tishda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordCheck = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className="flex items-center gap-1.5 text-xs">
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-white/20" />}
      <span className={ok ? "text-emerald-400" : "text-white/30"}>{text}</span>
    </div>
  );

  // Ro'yxatdan o'tish o'chirilgan bo'lsa
  if (settings.registration_enabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background hero-mesh px-4 py-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <Card className="relative w-full max-w-md shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                <Ban className="h-8 w-8 text-amber-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white">Ro&apos;yxatdan o&apos;tish vaqtincha to&apos;xtatilgan</h2>
            <p className="text-blue-200/60 text-sm">
              Hozirda yangi foydalanuvchilarni ro&apos;yxatdan o&apos;tkazish to&apos;xtatilgan. Iltimos, keyinroq urinib ko&apos;ring.
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/5">
                {t("auth.login")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-mesh px-4 py-8">
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
          <CardTitle className="text-2xl text-white">{t("auth.register")}</CardTitle>
          <p className="text-sm text-blue-200/60 mt-1">{t("auth.register_step1") || "1-qadam: Akkaunt yaratish"}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3">{error}</div>
            )}

            <div className="space-y-2">
              <Label className="text-blue-100/80 text-xs" htmlFor="username">{t("auth.username")} *</Label>
              <Input
                id="username"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="john_doe"
                required
              />
              {fieldErrors.username && (
                <p className="text-red-400 text-xs">{fieldErrors.username}</p>
              )}
              <p className="text-white/30 text-xs">{t("auth.username_hint") || "Harf, raqam, _ va . ishlatish mumkin (min 4 belgi)"}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-blue-100/80 text-xs" htmlFor="password">{t("auth.password")} *</Label>
              <div className="relative">
                <Input
                  id="password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20 pr-10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs">{fieldErrors.password}</p>
              )}
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <PasswordCheck ok={hasMinLength} text={t("auth.pw_min8") || "8+ belgi"} />
                  <PasswordCheck ok={hasUppercase} text={t("auth.pw_upper") || "Katta harf"} />
                  <PasswordCheck ok={hasLowercase} text={t("auth.pw_lower") || "Kichik harf"} />
                  <PasswordCheck ok={hasDigit} text={t("auth.pw_digit") || "Raqam"} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-blue-100/80 text-xs" htmlFor="confirm_password">{t("auth.confirm_password") || "Parolni tasdiqlang"} *</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20 pr-10"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirm_password && (
                <p className="text-red-400 text-xs">{fieldErrors.confirm_password}</p>
              )}
              {confirmPassword.length > 0 && (
                <PasswordCheck ok={passwordsMatch} text={passwordsMatch ? (t("auth.pw_match") || "Parollar mos") : (t("auth.pw_no_match") || "Parollar mos emas")} />
              )}
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0 mt-2" disabled={loading}>
              {loading ? t("common.loading") : t("auth.register")}
            </Button>
          </form>
          <div className="mt-5 text-center text-sm text-blue-200/50">
            {t("auth.have_account")}{" "}
            <Link href="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
              {t("auth.login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
