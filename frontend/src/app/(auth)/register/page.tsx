"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Loader2, Eye, EyeOff, UserPlus, ShieldOff } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();
  const settings = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Foydalanuvchi nomini kiriting");
      return;
    }
    if (username.trim().length < 4) {
      setError("Foydalanuvchi nomi kamida 4 ta belgi bo'lishi kerak");
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
      setError("Foydalanuvchi nomida faqat lotin harflari, raqamlar, _ va . ishlatish mumkin");
      return;
    }
    if (!password) {
      setError("Parolni kiriting");
      return;
    }
    if (password.length < 8) {
      setError("Parol kamida 8 ta belgi bo'lishi kerak");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Parolda kamida 1 ta katta harf bo'lishi kerak (masalan: A, B, C)");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Parolda kamida 1 ta kichik harf bo'lishi kerak (masalan: a, b, c)");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Parolda kamida 1 ta raqam bo'lishi kerak (masalan: 1, 2, 3)");
      return;
    }
    if (!confirmPassword) {
      setError("Parolni tasdiqlash uchun qayta kiriting");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parollar bir-biriga mos kelmayapti");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await register({
        username: username.trim(),
        password,
        confirm_password: confirmPassword,
      });
      setAuth(data.tokens, data.user, data.next_step);
      switch (data.next_step) {
        case "complete_profile":
          router.push("/dashboard/profile");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      const errors = apiErr?.response?.data?.errors;
      if (errors) {
        // Backend validation errors — birinchi xatoni ko'rsatamiz
        const firstError = Object.values(errors)[0];
        setError(firstError || "Ma'lumotlar noto'g'ri kiritilgan");
      } else {
        const msg = apiErr?.response?.data?.message;
        setError(msg || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4 relative overflow-hidden">
      {/* Floating blur circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
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
            <h2 className="text-xl font-semibold text-white mt-4">Ro&apos;yxatdan o&apos;tish</h2>
            <p className="text-sm text-blue-200/60 mt-2 leading-relaxed">
              Hisob yarating va testlarni boshlang
            </p>
          </div>

          {/* Ro'yxatdan o'tish o'chirilgan */}
          {!settings.loading && !settings.registration_enabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                  <ShieldOff className="h-8 w-8 text-amber-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Ro&apos;yxatdan o&apos;tish vaqtincha to&apos;xtatilgan
              </h3>
              <p className="text-sm text-blue-200/60 mb-6">
                Hozirda yangi foydalanuvchilar ro&apos;yxatdan o&apos;ta olmaydi. Iltimos, keyinroq qayta urinib ko&apos;ring.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                Kirish sahifasiga qaytish
              </Link>
            </motion.div>
          )}

          {/* Ro'yxatdan o'tish yoqilgan bo'lsa form ko'rsatiladi */}
          {(settings.loading || settings.registration_enabled) && (<>

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

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">
                Foydalanuvchi nomi
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan: ali_2010"
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
                  placeholder="Kamida 8 ta belgi"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">
                Parolni tasdiqlang
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Parolni qayta kiriting"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                autoComplete="new-password"
                disabled={loading}
              />
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
                  Yaratilmoqda...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Ro&apos;yxatdan o&apos;tish
                </>
              )}
            </motion.button>
          </form>

          {/* Bottom link */}
          <div className="mt-8 text-center text-sm text-blue-200/40">
            <p>
              Akkauntingiz bormi?{" "}
              <Link href="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                Kirish
              </Link>
            </p>
          </div>

          </>)}
        </div>
      </motion.div>
    </div>
  );
}
