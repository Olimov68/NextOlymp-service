"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sessionEndedMsg, setSessionEndedMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    const reason = sessionStorage.getItem("session_ended_reason");
    if (reason === "another_device") {
      setSessionEndedMsg("Akkauntingiz boshqa qurilmadan ochildi. Bu sessiya yakunlandi.");
      sessionStorage.removeItem("session_ended_reason");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      setAuth(data.tokens, data.user, data.next_step);
      switch (data.next_step) {
        case "complete_profile":
          router.push("/dashboard/profile");
          break;
        case "link_telegram":
          router.push("/dashboard/link-telegram");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Username yoki parol noto'g'ri");
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
          <CardTitle className="text-2xl text-white">{t("auth.login")}</CardTitle>
          <p className="text-sm text-blue-200/60 mt-1">{t("auth.student_login")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {sessionEndedMsg && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {sessionEndedMsg}
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3">{error}</div>
            )}
            <div className="space-y-2">
              <Label className="text-blue-100/80 text-xs" htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="student1"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-blue-100/80 text-xs" htmlFor="password">{t("auth.password")}</Label>
                <Link href="/recovery" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  {t("auth.forgot_password")}
                </Link>
              </div>
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
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0" disabled={loading}>
              {loading ? t("common.loading") : t("auth.login")}
            </Button>
          </form>

          {/* Recovery Link */}
          <div className="mt-4">
            <Link href="/recovery" className="block">
              <Button variant="outline" className="w-full gap-2 border-white/10 bg-white/5 text-blue-200 hover:bg-white/10 hover:text-white">
                <KeyRound className="h-4 w-4" />
                {t("auth.account_recovery")}
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center text-sm text-blue-200/50">
            <p>
              {t("auth.no_account")}{" "}
              <Link href="/register" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                {t("auth.register")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
