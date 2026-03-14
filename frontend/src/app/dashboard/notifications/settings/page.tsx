"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Trophy,
  Wallet,
  Newspaper,
  ClipboardCheck,
  Medal,
  Award,
  BarChart3,
  Gift,
  ArrowLeft,
  Save,
  Check,
} from "lucide-react";
import Link from "next/link";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/user-api";

interface CategoryItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const categories: CategoryItem[] = [
  {
    key: "olympiads",
    label: "Olimpiadalar",
    description: "Olimpiada e'lonlari va natijalar",
    icon: Trophy,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400",
  },
  {
    key: "payments",
    label: "To'lovlar",
    description: "To'lov holatlari va qaytarishlar",
    icon: Wallet,
    color: "text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400",
  },
  {
    key: "news",
    label: "Yangiliklar",
    description: "Yangiliklar va e'lonlar",
    icon: Newspaper,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400",
  },
  {
    key: "mock_tests",
    label: "Mock testlar",
    description: "Sinov testlari e'lonlari va natijalar",
    icon: ClipboardCheck,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400",
  },
  {
    key: "results",
    label: "Natijalar",
    description: "Natijalar va reyting yangiliklari",
    icon: Medal,
    color: "text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400",
  },
  {
    key: "certificates",
    label: "Sertifikatlar",
    description: "Sertifikat tayyorligi haqida",
    icon: Award,
    color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400",
  },
  {
    key: "leaderboard",
    label: "Leaderboard",
    description: "Peshqadamlar reytingi yangilanishi",
    icon: BarChart3,
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400",
  },
  {
    key: "promotions",
    label: "Promo va chegirmalar",
    description: "Chegirmalar va maxsus takliflar",
    icon: Gift,
    color: "text-pink-600 bg-pink-100 dark:bg-pink-900/50 dark:text-pink-400",
  },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getNotificationPreferences()
      .then((data) => setPrefs(data))
      .catch(() =>
        setPrefs({
          olympiads: true,
          payments: true,
          news: true,
          mock_tests: true,
          results: true,
          certificates: true,
          leaderboard: true,
          promotions: true,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      const updated = await updateNotificationPreferences(prefs);
      setPrefs(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/notifications"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bildirishnoma sozlamalari
            </h1>
            <p className="text-muted-foreground mt-1">
              Qaysi turdagi bildirishnomalarni olishni tanlang
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saqlandi
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Tizim bildirishnomalari (xavfsizlik, kirish va hokazo) doim yuboriladi va
              o&apos;chirib bo&apos;lmaydi.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const enabled = prefs?.[cat.key] ?? true;
          return (
            <Card
              key={cat.key}
              className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                enabled ? "" : "opacity-60"
              }`}
              onClick={() => handleToggle(cat.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}
                  >
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(cat.key);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
