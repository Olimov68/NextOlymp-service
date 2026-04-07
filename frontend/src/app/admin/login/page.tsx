"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { panelLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await panelLogin(username, password);
      // Panel tokenlarni saqlash
      localStorage.setItem("panel_access_token", data.tokens.access_token);
      localStorage.setItem("panel_refresh_token", data.tokens.refresh_token);
      localStorage.setItem("panel_staff", JSON.stringify(data.staff));

      // Hammasi admin panelga
      router.push("/admin");
    } catch {
      setError("Username yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>
      <Card className="relative w-full max-w-md shadow-2xl border border-border bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25">
              <Shield className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Boshqaruv Paneli</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Admin yoki SuperAdmin sifatida kiring</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3">{error}</div>
            )}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs" htmlFor="username">Username</Label>
              <Input
                id="username"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-red-400/50 focus:ring-red-400/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs" htmlFor="password">Parol</Label>
              <div className="relative">
                <Input
                  id="password"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-red-400/50 focus:ring-red-400/20 pr-10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg shadow-red-500/25 border-0" disabled={loading}>
              {loading ? "Kirish..." : "Kirish"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
