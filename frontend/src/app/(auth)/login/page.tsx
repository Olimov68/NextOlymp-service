"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Loader2, Eye, EyeOff, LogIn } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sessionEndedMsg, setSessionEndedMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();
  const settings = useSettings();

  useEffect(() => {
    const reason = sessionStorage.getItem("session_ended_reason");
    if (reason === "another_device") {
      setSessionEndedMsg("Akkauntingiz boshqa qurilmadan ochildi. Bu sessiya yakunlandi.");
      sessionStorage.removeItem("session_ended_reason");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Foydalanuvchi nomini kiriting");
      return;
    }
    if (!password.trim()) {
      setError("Parolni kiriting");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
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
      const apiErr = err as { response?: { data?: { message?: string; errors?: Record<string, string> }; status?: number } };
      const status = apiErr?.response?.status;
      const errors = apiErr?.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors)[0] || "Ma'lumotlar noto'g'ri kiritilgan");
      } else if (status === 401) {
        setError("Foydalanuvchi nomi yoki parol noto'g'ri");
      } else if (status === 429) {
        setError("Juda ko'p urinish. Biroz kutib, qaytadan urinib ko'ring");
      } else {
        const msg = apiErr?.response?.data?.message;
        setError(msg || "Tizimga kirishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4 relative overflow-hidden">
      {/* Floating blur circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl shadow-lg shadow-blue-500/25"
              >
                NO
              </motion.div>
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              NextOlymp
            </h1>
            <h2 className="text-xl font-semibold text-white mt-4">Tizimga kirish</h2>
            <p className="text-sm text-blue-200/60 mt-2 leading-relaxed">
              Platformaga kirib, testlar va olimpiadalarda qatnashing
            </p>
          </div>

          {/* Session ended warning */}
          {sessionEndedMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm p-3 flex items-center gap-2 mb-4"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {sessionEndedMsg}
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 mb-4"
            >
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Foydalanuvchi nomi"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Kiritilmoqda...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Kirish
                </>
              )}
            </motion.button>
          </form>

          {/* Bottom link — faqat registration yoqilgan bo'lsa ko'rsatiladi */}
          {settings.registration_enabled && (
            <div className="mt-8 text-center text-sm text-blue-200/40">
              <p>
                Akkauntingiz yo&apos;qmi?{" "}
                <Link href="/register" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
