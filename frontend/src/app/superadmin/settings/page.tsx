"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/superadmin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, Loader2 } from "lucide-react";

interface GlobalSettings {
  platform_name: string;
  default_language: string;
  support_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  telegram_verification_enabled?: boolean;
}

const defaultSettings: GlobalSettings = {
  platform_name: "",
  default_language: "uz",
  support_email: "",
  maintenance_mode: false,
  registration_enabled: true,
  telegram_verification_enabled: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      setSettings(res.data || res);
    } catch {
      setError("Sozlamalarni yuklashda xatolik");
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateSettings(settings as unknown as Record<string, unknown>);
      setSuccess("Sozlamalar saqlandi");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Umumiy sozlamalar</h1>
      </div>

      {error && <div className="bg-red-900/50 border border-red-800 text-red-300 rounded-lg p-3 text-sm">{error}</div>}
      {success && <div className="bg-green-900/50 border border-green-800 text-green-300 rounded-lg p-3 text-sm">{success}</div>}

      <div className="bg-muted border border-border rounded-lg p-6 space-y-6">
        {/* Platform Name */}
        <div>
          <Label className="text-sm font-medium">Platforma nomi</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Platformaning ko&apos;rsatiladigan nomi</p>
          <Input value={settings.platform_name} onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
            className="bg-card border-border" placeholder="NextOlymp" />
        </div>

        {/* Default Language */}
        <div>
          <Label className="text-sm font-medium">Standart til</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Platformaning standart tili</p>
          <Select value={settings.default_language} onValueChange={(v) => setSettings({ ...settings, default_language: v ?? "" })}>
            <SelectTrigger className="bg-card border-border w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uz">O&apos;zbekcha</SelectItem>
              <SelectItem value="ru">Ruscha</SelectItem>
              <SelectItem value="en">Inglizcha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Support Email */}
        <div>
          <Label className="text-sm font-medium">Qo&apos;llab-quvvatlash emaili</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Foydalanuvchilar uchun yordam emaili</p>
          <Input type="email" value={settings.support_email} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
            className="bg-card border-border" placeholder="support@example.com" />
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Texnik xizmat rejimi</Label>
            <p className="text-xs text-muted-foreground mt-1">Platformani texnik xizmat rejimiga o&apos;tkazish</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
              className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>

        {/* Registration Enabled */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Ro&apos;yxatdan o&apos;tish</Label>
            <p className="text-xs text-muted-foreground mt-1">Yangi foydalanuvchilar ro&apos;yxatdan o&apos;ta oladi</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.registration_enabled} onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
              className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {/* Telegram Verification */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Telegram tasdiqlash</Label>
            <p className="text-xs text-muted-foreground mt-1">Ro&apos;yxatdan o&apos;tishda Telegram bot orqali tasdiqlash talab qilinadi</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.telegram_verification_enabled || false} onChange={(e) => setSettings({ ...settings, telegram_verification_enabled: e.target.checked })}
              className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      </div>

      {settings.maintenance_mode && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
          <p className="text-red-300 text-sm font-medium">Diqqat: Texnik xizmat rejimi yoqilgan!</p>
          <p className="text-red-400 text-xs mt-1">Bu rejim yoqilganda foydalanuvchilar platformaga kira olmaydi.</p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Saqlash
      </Button>
    </div>
  );
}
