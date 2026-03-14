"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Monitor,
  Tablet,
  LogOut,
  Shield,
  Wifi,
  WifiOff,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  listDevices,
  logoutDevice,
  logoutAllOtherDevices,
  type DeviceSession,
} from "@/lib/user-api";

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

export default function DevicesPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Qurilmalar</h1>
          <p className="text-muted-foreground mt-1">
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
          {/* Device icon */}
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

          {/* Device info */}
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium dark:bg-gray-800 dark:text-gray-400">
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

          {/* Action */}
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
