"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCheck,
  Trash2,
  Mail,
  MailOpen,
  Info,
  AlertTriangle,
  Trophy,
  Wallet,
  Settings,
} from "lucide-react";
import Link from "next/link";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
} from "@/lib/user-api";

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  olympiad: Trophy,
  balance: Wallet,
  system: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    listNotifications()
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silently handle
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silently handle
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silently handle
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bildirishnomalar</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} ta o'qilmagan xabar`
              : "Barcha xabarlar o'qilgan"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Barchasini o&apos;qilgan deb belgilash</span>
              <span className="sm:hidden">Barchasini</span>
            </Button>
          )}
          <Link href="/dashboard/notifications/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sozlamalar</span>
            </Button>
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Hozircha bildirishnoma yo&apos;q</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <Card
                key={n.id}
                className={`border-0 shadow-sm transition-colors ${
                  !n.is_read ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !n.is_read ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-sm font-semibold ${
                            !n.is_read ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {n.title}
                        </h3>
                        {!n.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString("uz-UZ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.is_read ? (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="O'qilgan deb belgilash"
                        >
                          <MailOpen className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="p-2 text-muted-foreground/50">
                          <Mail className="h-4 w-4" />
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
