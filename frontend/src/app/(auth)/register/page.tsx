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
import { Eye, EyeOff } from "lucide-react";

const regionsData: Record<string, string[]> = {
  "Qoraqalpog'iston Respublikasi": ["Amudaryo","Beruniy","Chimboy","Ellikqal'a","Kegeyli","Mo'ynoq","Nukus","Qanliko'l","Qo'ng'irot","Qorao'zak","Shumanay","Taxtako'pir","To'rtko'l","Xo'jayli"],
  "Andijon viloyati": ["Andijon","Asaka","Baliqchi","Bo'z","Buloqboshi","Izboskan","Jalaquduq","Marhamat","Oltinko'l","Paxtaobod","Qo'rg'ontepa","Shahrixon","Ulug'nor","Xo'jaobod"],
  "Buxoro viloyati": ["Olot","Buxoro","G'ijduvon","Jondor","Kogon","Qorako'l","Qorovulbozor","Peshku","Romitan","Shofirkon","Vobkent"],
  "Jizzax viloyati": ["Arnasoy","Baxmal","Do'stlik","Forish","G'allaorol","Mirzacho'l","Paxtakor","Yangiobod","Zafarobod","Zarbdor","Zomin","Sharof Rashidov"],
  "Qashqadaryo viloyati": ["Chiroqchi","Dehqonobod","G'uzor","Qamashi","Qarshi","Kasbi","Kitob","Koson","Mirishkor","Muborak","Nishon","Shahrisabz","Yakkabog'","Ko'kdala"],
  "Navoiy viloyati": ["Konimex","Karmana","Qiziltepa","Navbahor","Nurota","Tomdi","Uchquduq","Xatirchi"],
  "Namangan viloyati": ["Chortoq","Chust","Kosonsoy","Mingbuloq","Namangan","Norin","Pop","To'raqo'rg'on","Uchqo'rg'on","Uychi","Yangiqo'rg'on"],
  "Samarqand viloyati": ["Bulung'ur","Ishtixon","Jomboy","Kattaqo'rg'on","Qo'shrabot","Narpay","Nurobod","Oqdaryo","Payariq","Pastdarg'om","Paxtachi","Samarqand","Tayloq","Urgut"],
  "Sirdaryo viloyati": ["Boyovut","Guliston","Mirzaobod","Oqoltin","Sayxunobod","Sardoba","Sirdaryo","Xovos"],
  "Surxondaryo viloyati": ["Angor","Bandixon","Boysun","Denov","Jarqo'rg'on","Muzrabot","Oltinsoy","Qiziriq","Qumqo'rg'on","Sariosiyo","Sherobod","Sho'rchi","Termiz","Uzun"],
  "Toshkent viloyati": ["Bekobod","Bo'ka","Bo'stonliq","Chinoz","Qibray","Ohangaron","Oqqo'rg'on","Parkent","Piskent","Quyi Chirchiq","Yangiyo'l","Yuqori Chirchiq","Zangiota","O'rta Chirchiq"],
  "Toshkent shahri": ["Bektemir","Chilonzor","Yakkasaroy","Mirobod","Mirzo Ulug'bek","Olmazor","Sergeli","Shayxontohur","Uchtepa","Yashnobod","Yunusobod","Yangihayot"],
  "Farg'ona viloyati": ["Oltiariq","Bag'dod","Beshariq","Buvayda","Dang'ara","Farg'ona","Furqat","Qo'shtepa","Quva","Rishton","So'x","Toshloq","Uchko'prik","Yozyovon"],
  "Xorazm viloyati": ["Bog'ot","Gurlan","Hazorasp","Xiva","Qo'shko'pir","Shovot","Urganch","Yangiariq","Yangibozor"],
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useI18n();

  const update = (field: string, value: string) => {
    if (field === "region") {
      setForm((f) => ({ ...f, region: value, district: "", city: "" }));
    } else if (field === "district") {
      setForm((f) => ({ ...f, district: value, city: value }));
    } else {
      setForm((f) => ({ ...f, [field]: value }));
    }
  };

  const districts = form.region ? regionsData[form.region] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.lastName || !form.username || !form.email || !form.password || !form.region || !form.district || !form.grade) {
      setError(t("auth.fill_all") || "Barcha maydonlarni to'ldiring");
      return;
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <Card className="relative w-full max-w-lg shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex justify-center mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl shadow-lg shadow-blue-500/25">
              NO
            </div>
          </Link>
          <CardTitle className="text-2xl text-white">{t("auth.register")}</CardTitle>
          <p className="text-sm text-blue-200/60 mt-1">{t("auth.join_platform") || "NextOly platformasiga qo'shiling"}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-blue-100/80 text-xs">{t("auth.firstName")} *</Label>
                <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-blue-100/80 text-xs">{t("auth.lastName")} *</Label>
                <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-blue-100/80 text-xs">{t("auth.region")} *</Label>
              <Select value={form.region} onValueChange={(v) => update("region", v ?? "")}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder={t("auth.select_region") || "Viloyatni tanlang"} /></SelectTrigger>
                <SelectContent>
                  {Object.keys(regionsData).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-blue-100/80 text-xs">{t("auth.district")} *</Label>
              <Select value={form.district} onValueChange={(v) => update("district", v ?? "")} disabled={!form.region}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder={t("auth.select_district") || "Tumanni tanlang"} /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-blue-100/80 text-xs">{t("auth.grade")} *</Label>
              <Select value={form.grade} onValueChange={(v) => update("grade", v ?? "")}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder={t("auth.select_grade") || "Sinfni tanlang"} /></SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{g}-{t("auth.grade_suffix") || "sinf"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-blue-100/80 text-xs">{t("auth.email")} *</Label>
              <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-blue-100/80 text-xs">{t("auth.username")} *</Label>
              <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20" value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="username" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-blue-100/80 text-xs">{t("auth.password")} *</Label>
              <div className="relative">
                <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50 focus:ring-blue-400/20 pr-10" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
