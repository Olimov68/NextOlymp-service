"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminChatMessages,
  sendAdminChatMessage,
  deleteAdminChatMessage,
  banChatUser,
  unbanChatUser,
  toggleChat,
  getChatBans,
  getChatOnline,
  getChatSettings,
  updateChatSettings,
  getChatModerationLogs,
} from "@/lib/admin-api";
import {
  Trash2,
  Ban,
  ShieldOff,
  Power,
  PowerOff,
  Users,
  RefreshCw,
  MessageCircle,
  Settings,
  ScrollText,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMsg {
  id: number;
  user_id: number;
  username: string;
  photo_url: string;
  content: string;
  type: string;
  role?: string;
  created_at: string;
}

interface ChatBanItem {
  id: number;
  user_id: number;
  user?: { id: number; username: string };
  reason: string;
  type: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface ModerationLog {
  id: number;
  staff_id: number;
  action: string;
  target_id: number;
  reason: string;
  details: string;
  created_at: string;
}

export default function AdminChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [bans, setBans] = useState<ChatBanItem[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [settings, setSettings] = useState({ max_message_len: 500, slow_mode: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"messages" | "bans" | "settings" | "logs">("messages");
  const [banDialog, setBanDialog] = useState<{ userId: number; username: string } | null>(null);
  const [banForm, setBanForm] = useState({ reason: "", type: "mute", duration: 1 });
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const res = await getAdminChatMessages({ limit: 100 });
      const msgs = res?.data?.messages || [];
      setMessages(msgs.reverse());
    } catch { /* ignore */ }
  }, []);

  const loadBans = useCallback(async () => {
    try {
      const res = await getChatBans();
      setBans(res?.data?.bans || []);
    } catch { /* ignore */ }
  }, []);

  const loadOnline = useCallback(async () => {
    try {
      const res = await getChatOnline();
      setOnlineCount(res?.data?.count || 0);
    } catch { /* ignore */ }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await getChatSettings();
      const s = res?.data || res;
      setChatOpen(s.is_chat_open ?? true);
      setSettings({ max_message_len: s.max_message_len || 500, slow_mode: s.slow_mode || 0 });
    } catch { /* ignore */ }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await getChatModerationLogs({ limit: 50 });
      setLogs(res?.data?.logs || []);
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadMessages(), loadBans(), loadOnline(), loadSettings(), loadLogs()]);
    setLoading(false);
  }, [loadMessages, loadBans, loadOnline, loadSettings, loadLogs]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      loadMessages();
      loadOnline();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadAll, loadMessages, loadOnline]);

  const handleDelete = async (id: number) => {
    try {
      await deleteAdminChatMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Xabar o'chirildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleBan = async () => {
    if (!banDialog) return;
    try {
      await banChatUser(banDialog.userId, banForm);
      toast.success(`${banDialog.username} bloklandi`);
      setBanDialog(null);
      setBanForm({ reason: "", type: "mute", duration: 1 });
      loadBans();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleUnban = async (userId: number) => {
    try {
      await unbanChatUser(userId);
      toast.success("Ban bekor qilindi");
      loadBans();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleToggleChat = async () => {
    try {
      await toggleChat({ is_open: !chatOpen });
      setChatOpen(!chatOpen);
      toast.success(chatOpen ? "Chat yopildi" : "Chat ochildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await sendAdminChatMessage(newMessage.trim());
      setNewMessage("");
      toast.success("Xabar yuborildi");
      loadMessages();
    } catch {
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setSending(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateChatSettings(settings);
      toast.success("Sozlamalar saqlandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const formatTime = (s: string) => {
    try { return new Date(s).toLocaleString("uz"); } catch { return s; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat Moderatsiya</h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" /> {onlineCount} online
          </span>
          <button
            onClick={handleToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              chatOpen
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {chatOpen ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
            {chatOpen ? "Chatni yopish" : "Chatni ochish"}
          </button>
          <button onClick={loadAll} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-accent/50 p-1 rounded-lg w-fit">
        {[
          { key: "messages", label: "Xabarlar", icon: MessageCircle },
          { key: "bans", label: "Banlar", icon: Ban },
          { key: "settings", label: "Sozlamalar", icon: Settings },
          { key: "logs", label: "Loglar", icon: ScrollText },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Messages Tab */}
      {tab === "messages" && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {messages.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Xabarlar yo&apos;q</div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors group">
                {msg.photo_url ? (
                  <img src={msg.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {msg.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{msg.username}</span>
                    <span className="text-[10px] text-muted-foreground">ID: {msg.user_id}</span>
                    {msg.role === "admin" && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded">ADMIN</span>}
                    <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5 break-words">{msg.content}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBanDialog({ userId: msg.user_id, username: msg.username })}
                    className="p-1.5 text-orange-400 hover:bg-orange-500/10 rounded-md transition-colors"
                    title="Bloklash"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Admin xabar yuborish */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-accent/30">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Admin sifatida xabar yozing..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Bans Tab */}
      {tab === "bans" && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {bans.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Aktiv banlar yo&apos;q</div>
            )}
            {bans.map((ban) => (
              <div key={ban.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm font-semibold">{ban.user?.username || `User #${ban.user_id}`}</span>
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                    ban.type === "permanent" ? "bg-red-500/10 text-red-400" :
                    ban.type === "ban" ? "bg-orange-500/10 text-orange-400" :
                    "bg-yellow-500/10 text-yellow-400"
                  }`}>{ban.type}</span>
                  {ban.reason && <p className="text-xs text-muted-foreground mt-0.5">{ban.reason}</p>}
                  {ban.expires_at && <p className="text-[10px] text-muted-foreground">Tugaydi: {formatTime(ban.expires_at)}</p>}
                </div>
                <button
                  onClick={() => handleUnban(ban.user_id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                >
                  <ShieldOff className="w-3.5 h-3.5" /> Unban
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="border border-border rounded-xl bg-card p-4 space-y-4 max-w-md">
          <div>
            <label className="text-sm text-muted-foreground">Max xabar uzunligi</label>
            <input
              type="number"
              value={settings.max_message_len}
              onChange={(e) => setSettings({ ...settings, max_message_len: Number(e.target.value) })}
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Slow mode (sekundlarda, 0 = o&apos;chirilgan)</label>
            <input
              type="number"
              value={settings.slow_mode}
              onChange={(e) => setSettings({ ...settings, slow_mode: Number(e.target.value) })}
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition-colors"
          >
            Saqlash
          </button>
        </div>
      )}

      {/* Logs Tab */}
      {tab === "logs" && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {logs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Loglar yo&apos;q</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    log.action === "ban" ? "bg-red-500/10 text-red-400" :
                    log.action === "delete_message" ? "bg-orange-500/10 text-orange-400" :
                    log.action === "unban" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-blue-500/10 text-blue-400"
                  }`}>{log.action}</span>
                  <span className="text-xs text-muted-foreground">Target: {log.target_id}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(log.created_at)}</span>
                </div>
                {log.reason && <p className="text-xs text-muted-foreground mt-0.5">{log.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ban Dialog */}
      {banDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold">{banDialog.username} ni bloklash</h3>
            <div>
              <label className="text-sm text-muted-foreground">Sabab</label>
              <input
                value={banForm.reason}
                onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Sabab kiriting..."
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Turi</label>
              <select
                value={banForm.type}
                onChange={(e) => setBanForm({ ...banForm, type: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="mute">Mute</option>
                <option value="ban">Ban</option>
                <option value="permanent">Doimiy</option>
              </select>
            </div>
            {banForm.type !== "permanent" && (
              <div>
                <label className="text-sm text-muted-foreground">Muddat (soat)</label>
                <select
                  value={banForm.duration}
                  onChange={(e) => setBanForm({ ...banForm, duration: Number(e.target.value) })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value={1}>1 soat</option>
                  <option value={24}>24 soat</option>
                  <option value={168}>7 kun</option>
                  <option value={720}>30 kun</option>
                </select>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setBanDialog(null)}
                className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleBan}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500"
              >
                Bloklash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
