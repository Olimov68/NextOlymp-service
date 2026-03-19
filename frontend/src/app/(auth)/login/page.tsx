"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { motion } from "framer-motion";
import { googleAuth } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [sessionEndedMsg, setSessionEndedMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const reason = sessionStorage.getItem("session_ended_reason");
    if (reason === "another_device") {
      setSessionEndedMsg("Akkauntingiz boshqa qurilmadan ochildi. Bu sessiya yakunlandi.");
      sessionStorage.removeItem("session_ended_reason");
    }
  }, []);

  const handleGoogleAuth = async (credential: string) => {
    setError("");
    setLoading(true);
    try {
      const data = await googleAuth(credential);
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
      setError(msg || "Google orqali kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      handleGoogleAuth(credentialResponse.credential);
    } else {
      setError("Google dan token olinmadi. Qaytadan urinib ko'ring.");
    }
  };

  const handleError = () => {
    setError("Google bilan kirishda xatolik. Qaytadan urinib ko'ring.");
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
              NextOlymp platformasiga xush kelibsiz. Google orqali kirib, testlarni boshlang.
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

          {/* Google Login */}
          <div className="flex flex-col items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-3 py-4 text-blue-200/80">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Google orqali kiritilmoqda...</span>
              </div>
            ) : !clientId ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm p-4 text-center w-full">
                Google Client ID sozlanmagan. Administrator bilan bog&apos;laning.
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  theme="filled_black"
                  size="large"
                  width="360"
                  text="signin_with"
                  shape="pill"
                />
              </div>
            )}
          </div>

          {/* Bottom link */}
          <div className="mt-8 text-center text-sm text-blue-200/40">
            <p>
              Akkauntingiz yo&apos;qmi?{" "}
              <Link href="/register" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
