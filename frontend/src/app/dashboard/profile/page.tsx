"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { completeProfile, updateProfile, uploadPhoto, getMe } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save, UserCircle, Camera, Loader2, Lock, Eye, EyeOff,
  Smartphone, Monitor, Tablet, LogOut, Shield, Wifi, WifiOff,
  MapPin, Clock,
} from "lucide-react";
import {
  changePassword,
  listDevices,
  logoutDevice,
  logoutAllOtherDevices,
  type DeviceSession,
} from "@/lib/user-api";
import { regions, getDistricts } from "@/lib/regions";

const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

// ─── Devices helpers ──────────────────────────────────────────────────────────

const deviceTypeIcons: Record<string, React.ElementType> = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Hozir faol";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  return date.toLocaleDateString("uz-UZ");
}

// ─── DeviceCard component ─────────────────────────────────────────────────────

function DeviceCard({
  device,
  isCurrent,
  inactive,
  onLogout,
  isLoggingOut,
}: {
  device: DeviceSession;
  isCurrent?: boolean;
  inactive?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}) {
  const Icon = deviceTypeIcons[device.device_type] || Monitor;

  return (
    <Card
      className={`border-0 shadow-sm transition-colors ${
        isCurrent
          ? "bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500"
          : inactive
          ? "opacity-60"
          : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isCurrent
                ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                : inactive
                ? "bg-muted text-muted-foreground"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground">
                {device.device_name}
              </h3>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium dark:bg-green-900/50 dark:text-green-300">
                  <Wifi className="h-3 w-3" />
                  Joriy
                </span>
              )}
              {device.is_active && !isCurrent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium dark:bg-blue-900/50 dark:text-blue-300">
                  <Wifi className="h-3 w-3" />
                  Faol
                </span>
              )}
              {!device.is_active && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  <WifiOff className="h-3 w-3" />
                  Nofaol
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {device.browser} &middot; {device.os}
              </span>
              {device.ip_address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {device.ip_address}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(device.last_active_at)}
              </span>
            </div>
          </div>

          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="text-destructive hover:bg-destructive/10 flex-shrink-0"
            >
              <LogOut className="h-4 w-4 mr-1" />
              {isLoggingOut ? "..." : "Chiqarish"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Password Tab ─────────────────────────────────────────────────────────────

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => changePassword({ current_password: currentPassword, new_password: newPassword }),
    onSuccess: () => {
      setSuccess("Parol muvaffaqiyatli o'zgartirildi!");
      setError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Parolni o'zgartirishda xatolik yuz berdi");
      setSuccess("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Yangi parollar mos kelmaydi");
      return;
    }
    mutation.mutate();
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Parolni o&apos;zgartirish
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 text-center">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm p-3 text-center">{success}</div>
          )}

          <div className="space-y-2">
            <Label>Joriy parol</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Joriy parolingizni kiriting"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Yangi parol</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Yangi parolni kiriting"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Yangi parolni tasdiqlang</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Yangi parolni qayta kiriting"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Parollar mos kelmaydi</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mutation.isPending ? "Saqlanmoqda..." : "Parolni saqlash"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Devices Tab ──────────────────────────────────────────────────────────────

function DevicesTab() {
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState<number | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const fetchDevices = () => {
    setLoading(true);
    listDevices()
      .then((data) => {
        setDevices(Array.isArray(data?.devices) ? data.devices : []);
      })
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleLogoutDevice = async (id: number) => {
    setLoggingOut(id);
    try {
      await logoutDevice(id);
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: false } : d))
      );
    } catch {
      // silently handle
    } finally {
      setLoggingOut(null);
    }
  };

  const handleLogoutAllOthers = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllOtherDevices();
      setDevices((prev) =>
        prev.map((d) => (d.is_current ? d : { ...d, is_active: false }))
      );
    } catch {
      // silently handle
    } finally {
      setLoggingOutAll(false);
    }
  };

  const activeDevices = devices.filter((d) => d.is_active);
  const inactiveDevices = devices.filter((d) => !d.is_active);
  const currentDevice = devices.find((d) => d.is_current);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-muted-foreground">
            Akkauntingizga ulangan qurilmalarni boshqaring
          </p>
        </div>
        {activeDevices.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogoutAllOthers}
            disabled={loggingOutAll}
            className="flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            {loggingOutAll ? "Chiqarilmoqda..." : "Boshqalarini chiqarish"}
          </Button>
        )}
      </div>

      {/* Security info */}
      <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Xavfsizlik haqida
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                Bir vaqtda faqat bitta qurilmadan foydalanish mumkin. Yangi qurilmadan
                kirganingizda, oldingi qurilma avtomatik chiqariladi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current device */}
      {currentDevice && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Joriy qurilma
          </h2>
          <DeviceCard device={currentDevice} isCurrent />
        </div>
      )}

      {/* Active devices (excluding current) */}
      {activeDevices.filter((d) => !d.is_current).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Faol sessiyalar
          </h2>
          <div className="space-y-2">
            {activeDevices
              .filter((d) => !d.is_current)
              .map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onLogout={() => handleLogoutDevice(device.id)}
                  isLoggingOut={loggingOut === device.id}
                />
              ))}
          </div>
        </div>
      )}

      {/* Inactive devices */}
      {inactiveDevices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Oldingi sessiyalar
          </h2>
          <div className="space-y-2">
            {inactiveDevices.map((device) => (
              <DeviceCard key={device.id} device={device} inactive />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {devices.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Smartphone className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Hozircha qurilma ma&apos;lumotlari yo&apos;q
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm({
  isNewProfile,
  onProfileCompleted,
}: {
  isNewProfile: boolean;
  onProfileCompleted: () => void;
}) {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_date: "",
    gender: "",
    region: "",
    district: "",
    school_name: "",
    grade: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getMe()
        .then((data) => {
          if (data.profile) {
            setPhotoUrl(data.profile.photo_url || "");
            setForm({
              first_name: data.profile.first_name || "",
              last_name: data.profile.last_name || "",
              birth_date: data.profile.birth_date || "",
              gender: data.profile.gender || "",
              region: data.profile.region || "",
              district: data.profile.district || "",
              school_name: data.profile.school_name || "",
              grade: data.profile.grade ? String(data.profile.grade) : "",
            });
          }
          setFormLoading(false);
        })
        .catch(() => setFormLoading(false));
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      if (isNewProfile) {
        const fd = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key === "grade") {
            fd.append(key, String(Number(value)));
          } else {
            fd.append(key, value);
          }
        });
        if (selectedPhoto) {
          fd.append("photo", selectedPhoto);
        }
        return completeProfile(fd);
      } else {
        return updateProfile({
          ...formData,
          grade: Number(formData.grade),
        });
      }
    },
    onSuccess: async () => {
      await refreshUser();
      onProfileCompleted();
      setSuccess(true);
      setError("");
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Xatolik yuz berdi");
    },
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadPhoto(file),
    onSuccess: (data) => {
      setPhotoUrl(data.photo_url);
      setError("");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Rasm yuklashda xatolik");
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isNewProfile) {
      setSelectedPhoto(file);
      setPhotoUrl(URL.createObjectURL(file));
      setError("");
    } else {
      photoMutation.mutate(file);
    }
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSuccess(false);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewProfile && !selectedPhoto) {
      setError("Iltimos, avval rasmingizni yuklang");
      return;
    }
    mutation.mutate(form);
  };

  if (!user) return null;
  if (formLoading) return <div className="text-muted-foreground p-8 text-center">Yuklanmoqda...</div>;

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8080";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          {/* Photo */}
          <div className="relative group">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl.startsWith("blob:") ? photoUrl : `${apiBase}${photoUrl}`}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-8 w-8" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${
                isNewProfile && !selectedPhoto ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              disabled={photoMutation.isPending}
            >
              {photoMutation.isPending ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div>
            <CardTitle className="text-lg">@{user.username}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isNewProfile ? "2-qadam: Profilni to'ldiring" : "Shaxsiy ma'lumotlar"}
            </p>
            {isNewProfile && !selectedPhoto && (
              <p className="text-xs text-red-500 mt-1">Rasmingizni yuklang *</p>
            )}
            {isNewProfile && selectedPhoto && (
              <p className="text-xs text-green-500 mt-1">Rasm tanlandi</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 text-center">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ism *</Label>
              <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Familiya *</Label>
              <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={user.username} disabled className="bg-muted" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tug&apos;ilgan sana *</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Jinsi *</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkak</SelectItem>
                  <SelectItem value="female">Ayol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Viloyat *</Label>
              <Select value={form.region} onValueChange={(v) => { update("region", v ?? ""); update("district", ""); }}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tuman *</Label>
              <Select value={form.district} onValueChange={(v) => update("district", v ?? "")} disabled={!form.region}>
                <SelectTrigger><SelectValue placeholder={form.region ? "Tanlang" : "Avval viloyat tanlang"} /></SelectTrigger>
                <SelectContent>
                  {getDistricts(form.region).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maktab nomi *</Label>
              <Input value={form.school_name} onChange={(e) => update("school_name", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sinf *</Label>
            <Select value={form.grade} onValueChange={(v) => update("grade", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>{g}-sinf</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mutation.isPending ? "Saqlanmoqda..." : (isNewProfile ? "Profilni yaratish" : "Saqlash")}
          </Button>

          {success && (
            <div className="rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm p-3 text-center">
              Saqlandi!
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getMe()
        .then((data) => {
          setProfileCompleted(data.user.is_profile_completed);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="text-muted-foreground p-8 text-center">{t("common.loading")}</div>;

  const isNewProfile = !profileCompleted;

  // When profile is not yet completed, show only the profile form (no tabs)
  if (isNewProfile) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t("profile.title")}</h1>
        <ProfileForm isNewProfile onProfileCompleted={() => setProfileCompleted(true)} />
      </div>
    );
  }

  // Profile completed: show tabbed view
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("profile.title")}</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile">Shaxsiy ma&apos;lumotlar</TabsTrigger>
          <TabsTrigger value="password">Parol</TabsTrigger>
          <TabsTrigger value="devices">Qurilmalar</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm isNewProfile={false} onProfileCompleted={() => setProfileCompleted(true)} />
        </TabsContent>

        <TabsContent value="password">
          <PasswordTab />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
