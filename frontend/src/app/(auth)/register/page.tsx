"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const regions = [
  "Toshkent shahri", "Toshkent viloyati", "Samarqand", "Buxoro",
  "Farg'ona", "Andijon", "Namangan", "Xorazm", "Qashqadaryo",
  "Surxondaryo", "Navoiy", "Jizzax", "Sirdaryo", "Qoraqalpog'iston",
];

const grades = ["5", "6", "7", "8", "9", "10", "11"];

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    region: "",
    district: "",
    city: "",
    grade: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useI18n();

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form);
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex justify-center mb-4">
            <div className="text-5xl">🏆</div>
          </Link>
          <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
          <p className="text-sm text-gray-500 mt-1">NextOly platformasiga qo&apos;shiling</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 text-red-600 text-sm p-3">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("auth.firstName")} *</Label>
                <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.lastName")} *</Label>
                <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auth.region")} *</Label>
              <Select value={form.region} onValueChange={(v) => update("region", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Viloyatni tanlang" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("auth.district")} *</Label>
                <Input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Tuman nomi" required />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.city")} *</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Shahar nomi" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auth.grade")} *</Label>
              <Select value={form.grade} onValueChange={(v) => update("grade", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Sinfni tanlang" /></SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{g}-sinf</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("auth.email")} *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" required />
            </div>

            <div className="space-y-2">
              <Label>{t("auth.username")} *</Label>
              <Input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="username" required />
            </div>

            <div className="space-y-2">
              <Label>{t("auth.password")} *</Label>
              <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} minLength={6} required />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? t("common.loading") : t("auth.register")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            {t("auth.have_account")}{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              {t("auth.login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
