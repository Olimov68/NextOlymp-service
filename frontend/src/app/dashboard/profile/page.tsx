"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, UserCircle } from "lucide-react";

const regions = [
  "Toshkent shahri", "Toshkent viloyati", "Samarqand", "Buxoro",
  "Farg'ona", "Andijon", "Namangan", "Xorazm", "Qashqadaryo",
  "Surxondaryo", "Navoiy", "Jizzax", "Sirdaryo", "Qoraqalpog'iston",
];

const grades = ["5", "6", "7", "8", "9", "10", "11"];

export default function ProfilePage() {
  const { user, setAuth } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    region: "",
    district: "",
    city: "",
    grade: "",
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        region: user.region,
        district: user.district,
        city: user.city,
        grade: user.grade,
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      const token = localStorage.getItem("token") || "";
      setAuth(token, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("profile.title")}</h1>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <UserCircle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{user.firstName} {user.lastName}</CardTitle>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("auth.firstName")}</Label>
                <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.lastName")}</Label>
                <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auth.username")}</Label>
              <Input value={user.username} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t("auth.region")}</Label>
              <Select value={form.region} onValueChange={(v) => update("region", v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("auth.district")}</Label>
                <Input value={form.district} onChange={(e) => update("district", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.city")}</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auth.grade")}</Label>
              <Select value={form.grade} onValueChange={(v) => update("grade", v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{g}-sinf</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2" disabled={mutation.isPending}>
              <Save className="h-4 w-4" />
              {mutation.isPending ? t("common.loading") : t("profile.save")}
            </Button>

            {success && (
              <div className="rounded-lg bg-green-50 text-green-600 text-sm p-3 text-center">
                {t("profile.saved")}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
