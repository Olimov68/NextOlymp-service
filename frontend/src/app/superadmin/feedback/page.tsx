"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, MessageSquare, Search, RefreshCw, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { getFeedbacks, getFeedback, replyFeedback } from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";

interface Feedback {
  id: number;
  user_id: number;
  category: string;
  subject: string;
  message: string;
  status: "open" | "in_review" | "answered" | "closed";
  admin_reply?: string;
  replied_at?: string;
  created_at: string;
  user?: { username: string };
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_review: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  answered: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabels: Record<string, string> = {
  open: "Ochiq",
  in_review: "Ko'rib chiqilmoqda",
  answered: "Javob berildi",
  closed: "Yopildi",
};

export default function SuperadminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailItem, setDetailItem] = useState<Feedback | null>(null);
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState<string>("answered");
  const [replying, setReplying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFeedbacks({ page: 1, page_size: 100 });
      setItems(normalizeList(data));
    } catch {
      toast.error("Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (item: Feedback) => {
    try {
      const detail = await getFeedback(item.id);
      setDetailItem(detail);
      setReply((detail as any).admin_reply || "");
      setReplyStatus(
        detail.status === "answered" || detail.status === "closed" ? detail.status : "answered"
      );
    } catch {
      setDetailItem(item);
      setReply(item.admin_reply || "");
    }
  };

  const handleReply = async () => {
    if (!detailItem) return;
    if (!reply.trim()) {
      toast.error("Javob matni majburiy");
      return;
    }
    setReplying(true);
    try {
      await replyFeedback(detailItem.id, { reply: reply.trim(), status: replyStatus });
      toast.success("Javob yuborildi");
      setDetailItem(null);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setReplying(false);
    }
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.subject.toLowerCase().includes(search.toLowerCase()) || i.message.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Murojaatlar</h1>
        <p className="text-sm text-muted-foreground mt-1">Foydalanuvchilar murojaatlarini ko'ring va javob bering</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha statuslar</SelectItem>
            <SelectItem value="open">Ochiq</SelectItem>
            <SelectItem value="in_review">Ko'rib chiqilmoqda</SelectItem>
            <SelectItem value="answered">Javob berildi</SelectItem>
            <SelectItem value="closed">Yopildi</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
            <p>Murojaatlar topilmadi</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Mavzu</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-sm">{item.user?.username || `User #${item.user_id}`}</TableCell>
                  <TableCell className="max-w-48">
                    <p className="font-medium text-foreground line-clamp-1">{item.subject}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDetail(item)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Detail + Reply Dialog */}
      <Dialog open={detailItem !== null} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle>Murojaat #{detailItem.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${statusColors[detailItem.status]}`}>
                    {statusLabels[detailItem.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{detailItem.category}</span>
                  <span className="text-xs text-muted-foreground">• {detailItem.user?.username || `User #${detailItem.user_id}`}</span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">{detailItem.subject}</p>
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{detailItem.message}</p>
                  </div>
                </div>

                {/* Reply section */}
                <div className="space-y-3 border-t border-border pt-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold"><Send className="h-4 w-4" />Javob berish</Label>
                  <Textarea
                    placeholder="Javob matnini yozing..."
                    rows={4}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={replyStatus} onValueChange={(v) => setReplyStatus(v ?? "answered")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_review">Ko'rib chiqilmoqda</SelectItem>
                        <SelectItem value="answered">Javob berildi</SelectItem>
                        <SelectItem value="closed">Yopish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailItem(null)}>Bekor qilish</Button>
                <Button onClick={handleReply} disabled={replying} className="gap-2">
                  {replying && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4" />Yuborish
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
