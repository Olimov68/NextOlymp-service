"use client";

import { useState } from "react";
import { verifyTelegramCode } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";

export default function LinkTelegramPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("6 xonali kod kiriting");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyTelegramCode(code);
      setLinked(true);
      await refreshUser();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Kod noto'g'ri yoki muddati tugagan");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (linked) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Telegram ulandi!</h2>
            <p className="text-muted-foreground mb-6">
              Telegram akkauntingiz muvaffaqiyatli ulandi.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Davom etish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold text-foreground mb-2">Telegram ulash</h1>
      <p className="text-muted-foreground mb-6">3-qadam: Telegram akkauntingizni ulang</p>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Telegram bot orqali tasdiqlash</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p className="text-sm font-medium text-foreground">Botni oching va xabar yuboring</p>
              <p className="text-xs text-muted-foreground mt-1">
                @NextOlympuzBot ga istalgan xabar yuboring — bot sizga 6 xonali kod yuboradi.
              </p>
              <a
                href="https://t.me/nextolympuzbot"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#0088cc] text-white py-2 px-4 text-sm font-medium hover:bg-[#007ab8] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                @NextOlympuzBot ni ochish
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-full">
              <p className="text-sm font-medium text-foreground mb-2">Botdan kelgan kodni kiriting</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setCode(val);
                    setError("");
                  }}
                  className="text-center text-xl font-mono tracking-widest"
                />
                <Button
                  onClick={handleVerify}
                  disabled={loading || code.length !== 6}
                  className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tasdiqlash"}
                </Button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
