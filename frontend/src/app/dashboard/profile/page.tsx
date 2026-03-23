"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { completeProfile, updateProfile, uploadPhoto, getMe } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save, UserCircle, Camera, Loader2, Lock, Eye, EyeOff,
  Smartphone, Monitor, Tablet, LogOut, Shield, Wifi, WifiOff,
  MapPin, Clock, ChevronRight,
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

// ─── Shared input styles ────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm";

// ─── Devices helpers ────────────────────────────────────────────────────────

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

// ─── DeviceCard component ───────────────────────────────────────────────────

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
    <div
      className={`rounded-xl border transition-colors p-4 ${
        isCurrent
          ? "bg-emerald-500/5 border-emerald-500/20"
          : inactive
          ? "bg-white/[0.02] border-white/5 opacity-50"
          : "bg-white/[0.03] border-white/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCurrent
              ? "bg-emerald-500/10 text-emerald-400"
              : inactive
              ? "bg-white/5 text-white/30"
              : "bg-blue-500/10 text-blue-400"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {device.device_name}
            </span>
            {isCurrent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                <Wifi className="h-2.5 w-2.5" />
                Joriy
              </span>
            )}
            {device.is_active && !isCurrent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                <Wifi className="h-2.5 w-2.5" />
                Faol
              </span>
            )}
            {!device.is_active && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[10px] font-medium">
                <WifiOff className="h-2.5 w-2.5" />
                Nofaol
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/40 mt-1">
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              {device.browser} · {device.os}
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
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isLoggingOut ? "..." : "Chiqarish"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Password Tab ───────────────────────────────────────────────────────────

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

  const PasswordInput = ({
    value,
    onChange,
    show,
    toggleShow,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    toggleShow: () => void;
    placeholder: string;
  }) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className={inputClass + " pr-10"}
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Lock className="h-4 w-4 text-blue-400" />
        </div>
        <h3 className="text-base font-semibold text-white">Parolni o&apos;zgartirish</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3">{error}</div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm p-3">{success}</div>
        )}

        <PasswordInput
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          toggleShow={() => setShowCurrent(!showCurrent)}
          placeholder="Joriy parol"
        />
        <PasswordInput
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          toggleShow={() => setShowNew(!showNew)}
          placeholder="Yangi parol"
        />
        <div>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            toggleShow={() => setShowConfirm(!showConfirm)}
            placeholder="Yangi parolni tasdiqlang"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-400 mt-1.5 ml-1">Parollar mos kelmaydi</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mutation.isPending ? "Saqlanmoqda..." : "Parolni saqlash"}
        </button>
      </form>
    </div>
  );
}

// ─── Balance Tab ────────────────────────────────────────────────────────────

function BalanceTab() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Array<{
    id: number; amount: number; type: string; description: string; created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadData = () => {
    Promise.all([
      import("@/lib/user-api").then((m) => m.getBalance()),
      import("@/lib/user-api").then((m) => m.getTransactions()),
    ])
      .then(([bal, txs]) => {
        setBalance(bal?.balance ?? bal ?? 0);
        setTransactions(Array.isArray(txs) ? txs : txs?.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handlePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      const { applyPromoCode } = await import("@/lib/user-api");
      const res = await applyPromoCode({ code: promoCode.trim() });
      setPromoMsg({ type: "ok", text: res?.message || `Promo kod muvaffaqiyatli qo'llanildi!` });
      setPromoCode("");
      loadData(); // balansni yangilash
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPromoMsg({ type: "err", text: msg || "Promo kod noto'g'ri yoki muddati o'tgan" });
    } finally {
      setPromoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg shadow-blue-500/20">
        <p className="text-blue-100 text-sm mb-1">Joriy balans</p>
        <p className="text-white text-3xl font-bold">
          {Number(balance).toLocaleString()} so&apos;m
        </p>
      </div>

      {/* Promo code */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Promo kod</h3>
        <form onSubmit={handlePromo} className="flex gap-2">
          <input
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoMsg(null); }}
            placeholder="Kodni kiriting"
            className={inputClass + " flex-1 uppercase tracking-widest"}
            disabled={promoLoading}
          />
          <button
            type="submit"
            disabled={promoLoading || !promoCode.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Qo&apos;llash
          </button>
        </form>
        {promoMsg && (
          <p className={`text-xs mt-2 ${promoMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
            {promoMsg.text}
          </p>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Tranzaksiyalar</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-6">
            Hozircha tranzaksiyalar yo&apos;q
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 20).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div>
                  <p className="text-sm text-white">{tx.description || tx.type}</p>
                  <p className="text-[11px] text-white/30">
                    {new Date(tx.created_at).toLocaleDateString("uz-UZ")}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.amount >= 0 ? "+" : ""}{Number(tx.amount).toLocaleString()} so&apos;m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Devices Tab ────────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">Ulangan qurilmalar</p>
        {activeDevices.length > 1 && (
          <button
            onClick={handleLogoutAllOthers}
            disabled={loggingOutAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOutAll ? "..." : "Boshqalarini chiqarish"}
          </button>
        )}
      </div>

      {/* Security note */}
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3 flex items-start gap-2.5">
        <Shield className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300/70 leading-relaxed">
          Bir vaqtda faqat bitta qurilmadan foydalanish mumkin. Yangi qurilmadan kirganingizda, oldingi sessiya yakunlanadi.
        </p>
      </div>

      {/* Current device */}
      {currentDevice && (
        <div>
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">Joriy qurilma</p>
          <DeviceCard device={currentDevice} isCurrent />
        </div>
      )}

      {/* Active devices */}
      {activeDevices.filter((d) => !d.is_current).length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">Faol sessiyalar</p>
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
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">Oldingi sessiyalar</p>
          <div className="space-y-2">
            {inactiveDevices.map((device) => (
              <DeviceCard key={device.id} device={device} inactive />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {devices.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-10 text-center">
          <Smartphone className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/30">Qurilma ma&apos;lumotlari yo&apos;q</p>
        </div>
      )}
    </div>
  );
}

// ─── Profile Form ───────────────────────────────────────────────────────────

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
  if (formLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "https://nextolymp.uz";

  // ── Styled select wrapper matching dark theme ──
  const StyledSelect = ({
    value,
    onValueChange,
    placeholder,
    disabled,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    placeholder: string;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? "")} disabled={disabled}>
      <SelectTrigger className="w-full px-4 py-2.5 h-auto rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 text-sm [&>span]:text-white/30 [&[data-state=closed]>span]:text-white/30 disabled:opacity-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-gray-900 border-white/10 rounded-xl">
        {children}
      </SelectContent>
    </Select>
  );

  // ── New profile: full-screen onboarding layout ──
  if (isNewProfile) {
    return (
      <form onSubmit={handleSubmit}>
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl.startsWith("blob:") ? photoUrl : `${apiBase}${photoUrl}`}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-12 w-12 text-white/20" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity ${
                !selectedPhoto ? "opacity-100" : "opacity-0 group-hover:opacity-100"
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
            {/* Status indicator */}
            {selectedPhoto && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-gray-950 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {!selectedPhoto && (
          <p className="text-center text-xs text-amber-400/80 mb-4">Rasmingizni yuklang</p>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 mb-4">{error}</div>
        )}

        {/* Form grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
            required
            placeholder="Ism"
            className={inputClass}
          />
          <input
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
            required
            placeholder="Familiya"
            className={inputClass}
          />
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
            required
            placeholder="Tug'ilgan sana"
            className={inputClass + " [color-scheme:dark]"}
          />
          <StyledSelect value={form.gender} onValueChange={(v) => update("gender", v)} placeholder="Jinsi">
            <SelectItem value="male">Erkak</SelectItem>
            <SelectItem value="female">Ayol</SelectItem>
          </StyledSelect>
          <StyledSelect
            value={form.region}
            onValueChange={(v) => { update("region", v); update("district", ""); }}
            placeholder="Viloyat"
          >
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </StyledSelect>
          <StyledSelect
            value={form.district}
            onValueChange={(v) => update("district", v)}
            placeholder={form.region ? "Tuman" : "Avval viloyat"}
            disabled={!form.region}
          >
            {getDistricts(form.region).map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </StyledSelect>
          <input
            value={form.school_name}
            onChange={(e) => update("school_name", e.target.value)}
            required
            placeholder="Maktab nomi"
            className={inputClass}
          />
          <StyledSelect value={form.grade} onValueChange={(v) => update("grade", v)} placeholder="Sinf">
            {grades.map((g) => (
              <SelectItem key={g} value={g}>{g}-sinf</SelectItem>
            ))}
          </StyledSelect>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            <>
              Davom etish
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    );
  }

  // ── Existing profile: compact edit card ──
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Photo + name row */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative group">
          <div className="h-16 w-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl.startsWith("blob:") ? photoUrl : `${apiBase}${photoUrl}`}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle className="h-8 w-8 text-white/20" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={photoMutation.isPending}
          >
            {photoMutation.isPending ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Camera className="h-4 w-4 text-white" />
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
          <p className="text-base font-semibold text-white">@{user.username}</p>
          <p className="text-xs text-white/40">Shaxsiy ma&apos;lumotlar</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
            required
            placeholder="Ism"
            className={inputClass}
          />
          <input
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
            required
            placeholder="Familiya"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
            required
            className={inputClass + " [color-scheme:dark]"}
          />
          <StyledSelect value={form.gender} onValueChange={(v) => update("gender", v)} placeholder="Jinsi">
            <SelectItem value="male">Erkak</SelectItem>
            <SelectItem value="female">Ayol</SelectItem>
          </StyledSelect>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StyledSelect
            value={form.region}
            onValueChange={(v) => { update("region", v); update("district", ""); }}
            placeholder="Viloyat"
          >
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </StyledSelect>
          <StyledSelect
            value={form.district}
            onValueChange={(v) => update("district", v)}
            placeholder={form.region ? "Tuman" : "Avval viloyat"}
            disabled={!form.region}
          >
            {getDistricts(form.region).map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </StyledSelect>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.school_name}
            onChange={(e) => update("school_name", e.target.value)}
            required
            placeholder="Maktab nomi"
            className={inputClass}
          />
          <StyledSelect value={form.grade} onValueChange={(v) => update("grade", v)} placeholder="Sinf">
            {grades.map((g) => (
              <SelectItem key={g} value={g}>{g}-sinf</SelectItem>
            ))}
          </StyledSelect>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </button>

        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm p-3 text-center">
            Saqlandi!
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

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
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  const isNewProfile = !profileCompleted;

  // ── New profile: full-screen onboarding ──
  if (isNewProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4 relative overflow-hidden">
        {/* Blur circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-2">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-blue-500/25 mb-4">
                NO
              </div>
              <h1 className="text-xl font-bold text-white">Profilni to&apos;ldiring</h1>
              <p className="text-sm text-blue-200/40 mt-1">Ma&apos;lumotlaringizni kiriting</p>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="h-1.5 w-8 rounded-full bg-blue-500" />
                <div className="h-1.5 w-8 rounded-full bg-blue-500/30" />
              </div>
            </div>

            <ProfileForm isNewProfile onProfileCompleted={() => setProfileCompleted(true)} />
          </div>
        </div>
      </div>
    );
  }

  // ── Existing profile: tabbed dark view ──
  return (
    <div className="max-w-2xl mx-auto py-2">
      <h1 className="text-xl font-bold text-white mb-5">{t("profile.title")}</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex w-full mb-5 bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          {[
            { value: "profile", label: "Shaxsiy" },
            { value: "balance", label: "Balans" },
            { value: "password", label: "Parol" },
            { value: "devices", label: "Qurilmalar" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-lg py-2 px-3 text-sm font-medium leading-none text-white/50 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm isNewProfile={false} onProfileCompleted={() => setProfileCompleted(true)} />
        </TabsContent>

        <TabsContent value="balance">
          <BalanceTab />
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
