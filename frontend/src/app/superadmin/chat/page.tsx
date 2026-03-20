"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
  banChatUser,
  unbanChatUser,
  toggleChat,
  getChatBans,
  getChatOnline,
  getChatSettings,
  updateChatSettings,
  getChatModerationLogs,
} from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trash2, Ban, ShieldOff, Power, PowerOff, Users, RefreshCw,
  MessageCircle, Settings, ScrollText, Loader2, Search,
  Reply, X, Send,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
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
  staff_username: string;
  action: string;
  target_id: number;
  target_username: string;
  reason: string;
  details: string;
  created_at: string;
}

interface ChatSettingsData {
  is_open: boolean;
  max_message_length: number;
  cooldown_seconds: number;
  slow_mode: boolean;
  slow_mode_interval: number;
}

type Tab = "messages" | "bans" | "logs" | "settings";

export default function ChatModerationPage() {
  const [tab, setTab] = useState<Tab>("messages");

  // Messages state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgTotal, setMsgTotal] = useState(0);
  const [msgPage, setMsgPage] = useState(1);
  const [msgSearch, setMsgSearch] = useState("");
  const [msgLoading, setMsgLoading] = useState(true);

  // Bans state
  const [bans, setBans] = useState<ChatBanItem[]>([]);
  const [bansLoading, setBansLoading] = useState(false);

  // Moderation logs state
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<ChatSettingsData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Online count
  const [onlineCount, setOnlineCount] = useState(0);

  // Chat open state
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Ban dialog
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTargetUserId, setBanTargetUserId] = useState<number | null>(null);
  const [banTargetUsername, setBanTargetUsername] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState("temporary");
  const [banDuration, setBanDuration] = useState(60);
  const [banning, setBanning] = useState(false);

  // Admin message input
  const [adminMsg, setAdminMsg] = useState("");
  const [sending, setSending] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);

  const limit = 20;

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setMsgLoading(true);
    try {
      const res = await getChatMessages({ page: msgPage, limit, search: msgSearch || undefined });
      const list = normalizeList<ChatMsg>(res);
      setMessages(list);
      setMsgTotal(res?.data?.meta?.total || res.pagination?.total || res?.data?.total || 0);
    } catch {
      setMessages([]);
    }
    setMsgLoading(false);
  }, [msgPage, msgSearch]);

  // Send admin message
  const handleSendMessage = async () => {
    if (!adminMsg.trim() || sending) return;
    setSending(true);
    try {
      await sendChatMessage(adminMsg.trim(), replyingTo?.id);
      setAdminMsg("");
      setReplyingTo(null);
      toast.success("Xabar yuborildi");
      fetchMessages();
    } catch {
      toast.error("Xabar yuborilmadi");
    }
    setSending(false);
  };

  // Fetch bans
  const fetchBans = useCallback(async () => {
    setBansLoading(true);
    try {
      const res = await getChatBans();
      const list = normalizeList<ChatBanItem>(res);
      setBans(list);
    } catch {
      setBans([]);
    }
    setBansLoading(false);
  }, []);

  // Fetch moderation logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await getChatModerationLogs({ page: logsPage, page_size: limit });
      const list = normalizeList<ModerationLog>(res);
      setLogs(list);
      setLogsTotal(res.pagination?.total || res?.data?.total || 0);
    } catch {
      setLogs([]);
    }
    setLogsLoading(false);
  }, [logsPage]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await getChatSettings();
      const data = res.data || res;
      setSettings(data);
      setIsChatOpen(data.is_open ?? true);
    } catch {
      setSettings(null);
    }
    setSettingsLoading(false);
  }, []);

  // Fetch online count
  const fetchOnline = useCallback(async () => {
    try {
      const res = await getChatOnline();
      setOnlineCount(res.data?.count || res.count || 0);
    } catch {
      /* ignore */
    }
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (tab === "messages") fetchMessages();
  }, [tab, fetchMessages]);

  useEffect(() => {
    if (tab === "bans") fetchBans();
  }, [tab, fetchBans]);

  useEffect(() => {
    if (tab === "logs") fetchLogs();
  }, [tab, fetchLogs]);

  useEffect(() => {
    if (tab === "settings") fetchSettings();
  }, [tab, fetchSettings]);

  useEffect(() => {
    fetchOnline();
    fetchSettings();
  }, [fetchOnline, fetchSettings]);

  // Delete message
  const handleDeleteMessage = async (id: number) => {
    if (!confirm("Xabarni o'chirishni xohlaysizmi?")) return;
    try {
      await deleteChatMessage(id);
      toast.success("Xabar o'chirildi");
      fetchMessages();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  // Open ban dialog
  const openBanDialog = (userId: number, username: string) => {
    setBanTargetUserId(userId);
    setBanTargetUsername(username);
    setBanReason("");
    setBanType("temporary");
    setBanDuration(60);
    setBanDialogOpen(true);
  };

  // Submit ban
  const handleBan = async () => {
    if (!banTargetUserId) return;
    setBanning(true);
    try {
      await banChatUser(banTargetUserId, {
        reason: banReason || undefined,
        type: banType,
        duration: banType === "temporary" ? banDuration : undefined,
      });
      toast.success(`${banTargetUsername} bloklandi`);
      setBanDialogOpen(false);
      fetchMessages();
      if (tab === "bans") fetchBans();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Xatolik");
    }
    setBanning(false);
  };

  // Unban
  const handleUnban = async (userId: number) => {
    if (!confirm("Blokni olib tashlashni xohlaysizmi?")) return;
    try {
      await unbanChatUser(userId);
      toast.success("Blok olib tashlandi");
      fetchBans();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  // Toggle chat
  const handleToggleChat = async () => {
    setToggling(true);
    try {
      await toggleChat({ is_open: !isChatOpen });
      setIsChatOpen(!isChatOpen);
      toast.success(isChatOpen ? "Chat yopildi" : "Chat ochildi");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Xatolik");
    }
    setToggling(false);
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      await updateChatSettings(settings as unknown as Record<string, unknown>);
      toast.success("Sozlamalar saqlandi");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Xatolik");
    }
    setSettingsSaving(false);
  };

  const msgTotalPages = Math.ceil(msgTotal / limit);
  const logsTotalPages = Math.ceil(logsTotal / limit);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "messages", label: "Xabarlar", icon: <MessageCircle className="w-4 h-4" /> },
    { key: "bans", label: "Bloklar", icon: <Ban className="w-4 h-4" /> },
    { key: "logs", label: "Loglar", icon: <ScrollText className="w-4 h-4" /> },
    { key: "settings", label: "Sozlamalar", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold">Chat moderatsiya</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{onlineCount} online</span>
              </div>
              <Badge className={isChatOpen ? "bg-green-600" : "bg-red-600"}>
                {isChatOpen ? "Chat ochiq" : "Chat yopiq"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchOnline(); if (tab === "messages") fetchMessages(); else if (tab === "bans") fetchBans(); else if (tab === "logs") fetchLogs(); }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Yangilash
          </Button>
          <Button
            variant={isChatOpen ? "destructive" : "default"}
            size="sm"
            onClick={handleToggleChat}
            disabled={toggling}
            className="gap-2"
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isChatOpen ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {isChatOpen ? "Chatni yopish" : "Chatni ochish"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages Tab */}
      {tab === "messages" && (
        <div className="space-y-4">
          {/* Admin xabar yuborish */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
            {replyingTo && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                <Reply className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-indigo-400">{replyingTo.username}</span>
                  <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="shrink-0 p-1 hover:bg-white/10 rounded">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <Input
                placeholder={replyingTo ? `${replyingTo.username} ga javob yozing...` : "Admin sifatida xabar yozing..."}
                value={adminMsg}
                onChange={(e) => setAdminMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                maxLength={1000}
                disabled={sending || !isChatOpen}
                className="flex-1 bg-muted border-border"
                autoFocus={!!replyingTo}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!adminMsg.trim() || sending || !isChatOpen}
                variant="default"
                className="bg-amber-600 hover:bg-amber-500"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {!sending && "Yuborish"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Xabar yoki foydalanuvchi qidirish..."
                value={msgSearch}
                onChange={(e) => { setMsgSearch(e.target.value); setMsgPage(1); }}
                className="pl-10 bg-muted border-border"
              />
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-accent">
                  <TableHead>ID</TableHead>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Xabar</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Vaqt</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {msgLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Xabar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((msg) => (
                    <TableRow key={msg.id} className="border-border hover:bg-accent">
                      <TableCell>{msg.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {msg.photo_url ? (
                            <img src={msg.photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                              {msg.username?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium">{msg.username}</span>
                            {msg.role && (
                              <Badge variant="secondary" className="ml-1.5 text-[10px]">{msg.role}</Badge>
                            )}
                            <p className="text-[10px] text-muted-foreground">ID: {msg.user_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">{msg.content}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{msg.type || "text"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setReplyingTo(msg); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            title="Javob berish"
                          >
                            <Reply className="w-4 h-4 text-indigo-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openBanDialog(msg.user_id, msg.username)}
                            title="Bloklash"
                          >
                            <Ban className="w-4 h-4 text-yellow-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination page={msgPage} totalPages={msgTotalPages} onPageChange={setMsgPage} total={msgTotal} />
        </div>
      )}

      {/* Bans Tab */}
      {tab === "bans" && (
        <div className="space-y-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-accent">
                  <TableHead>ID</TableHead>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Sabab</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Tugash vaqti</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Yaratilgan</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bansLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : bans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Bloklar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  bans.map((ban) => (
                    <TableRow key={ban.id} className="border-border hover:bg-accent">
                      <TableCell>{ban.id}</TableCell>
                      <TableCell>
                        <span className="font-medium">{ban.user?.username || `User #${ban.user_id}`}</span>
                        <p className="text-[10px] text-muted-foreground">ID: {ban.user_id}</p>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{ban.reason || "—"}</TableCell>
                      <TableCell>
                        <Badge className={ban.type === "permanent" ? "bg-red-600" : "bg-yellow-600"}>
                          {ban.type === "permanent" ? "Doimiy" : "Vaqtinchalik"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {ban.expires_at ? new Date(ban.expires_at).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={ban.is_active ? "bg-red-600" : "bg-gray-600"}>
                          {ban.is_active ? "Faol" : "Tugagan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ban.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {ban.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnban(ban.user_id)}
                            title="Blokni olib tashlash"
                          >
                            <ShieldOff className="w-4 h-4 text-green-400" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Moderation Logs Tab */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-accent">
                  <TableHead>ID</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Amal</TableHead>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Sabab</TableHead>
                  <TableHead>Tafsilotlar</TableHead>
                  <TableHead>Vaqt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Log topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-border hover:bg-accent">
                      <TableCell>{log.id}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {log.staff_id === 0 ? (
                            <Badge className="bg-gray-600">Tizim</Badge>
                          ) : (
                            log.staff_username || `#${log.staff_id}`
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.action === "delete" ? "bg-red-600" :
                            log.action === "ban" ? "bg-yellow-600" :
                            log.action === "unban" ? "bg-green-600" :
                            log.action === "profanity_blocked" ? "bg-orange-600" :
                            "bg-blue-600"
                          }
                        >
                          {log.action === "profanity_blocked" ? "Yomon so'z" : log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.target_username || `#${log.target_id}`}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.reason || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.details || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination page={logsPage} totalPages={logsTotalPages} onPageChange={setLogsPage} total={logsTotal} />
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-lg">
          {settingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : settings ? (
            <>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Maksimal xabar uzunligi</Label>
                  <Input
                    type="number"
                    value={settings.max_message_length || ""}
                    onChange={(e) => setSettings({ ...settings, max_message_length: parseInt(e.target.value) || 0 })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cooldown (soniya)</Label>
                  <Input
                    type="number"
                    value={settings.cooldown_seconds || ""}
                    onChange={(e) => setSettings({ ...settings, cooldown_seconds: parseInt(e.target.value) || 0 })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label>Slow mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Xabarlar orasida kutish vaqti</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, slow_mode: !settings.slow_mode })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.slow_mode ? "bg-indigo-600" : "bg-gray-600"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.slow_mode ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>
                {settings.slow_mode && (
                  <div className="space-y-1.5">
                    <Label>Slow mode intervali (soniya)</Label>
                    <Input
                      type="number"
                      value={settings.slow_mode_interval || ""}
                      onChange={(e) => setSettings({ ...settings, slow_mode_interval: parseInt(e.target.value) || 0 })}
                      className="bg-muted border-border"
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleSaveSettings} disabled={settingsSaving} className="gap-2">
                {settingsSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Saqlash
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">Sozlamalarni yuklashda xatolik</p>
          )}
        </div>
      )}

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Foydalanuvchini bloklash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{banTargetUsername}</span> (ID: {banTargetUserId})
            </p>
            <div className="space-y-1.5">
              <Label>Sabab</Label>
              <Input
                placeholder="Bloklash sababi..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Turi</Label>
              <Select value={banType} onValueChange={(v) => setBanType(v ?? "temporary")}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Vaqtinchalik</SelectItem>
                  <SelectItem value="permanent">Doimiy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banType === "temporary" && (
              <div className="space-y-1.5">
                <Label>Muddat (daqiqa)</Label>
                <Input
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleBan} disabled={banning} variant="destructive" className="gap-2">
              {banning && <Loader2 className="h-4 w-4 animate-spin" />}
              Bloklash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
