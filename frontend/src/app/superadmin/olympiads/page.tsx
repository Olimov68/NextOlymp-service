"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, Search, RefreshCw, Loader2, Trophy,
  ListChecks, DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOlympiads, createOlympiad, updateOlympiad, deleteOlympiad,
} from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";

interface Olympiad {
  id: number;
  title: string;
  slug: string;
  subject: string;
  grade: number;
  language: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_questions: number;
  status: string;
  is_paid: boolean;
  price?: number;
  created_at: string;
}

interface OlympiadForm {
  title: string;
  description: string;
  subject: string;
  grade: string;
  language: string;
  start_time: string;
  end_time: string;
  duration_minutes: string;
  total_questions: string;
  rules: string;
  status: string;
  is_paid: boolean;
  price: string;
}

const emptyForm: OlympiadForm = {
  title: "",
  description: "",
  subject: "",
  grade: "0",
  language: "uz",
  start_time: "",
  end_time: "",
  duration_minutes: "60",
  total_questions: "20",
  rules: "",
  status: "draft",
  is_paid: false,
  price: "",
};

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  published: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  ended: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  archived: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  published: "Nashr qilingan",
  active: "Faol",
  ended: "Tugagan",
  archived: "Arxiv",
};

export default function SuperadminOlympiadsPage() {
  const [items, setItems] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Olympiad | null>(null);
  const [form, setForm] = useState<OlympiadForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getOlympiads({ page: 1, page_size: 100 });
      setItems(normalizeList(data));
    } catch {
      toast.error("Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: Olympiad) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      description: "",
      subject: item.subject || "",
      grade: String(item.grade || 0),
      language: item.language || "uz",
      start_time: item.start_time ? item.start_time.slice(0, 16) : "",
      end_time: item.end_time ? item.end_time.slice(0, 16) : "",
      duration_minutes: String(item.duration_minutes || 60),
      total_questions: String(item.total_questions || 20),
      rules: "",
      status: item.status || "draft",
      is_paid: item.is_paid || false,
      price: item.price ? String(item.price) : "",
    });
    setOpen(true);
  };

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    subject: form.subject,
    grade: parseInt(form.grade) || 0,
    language: form.language,
    start_time: form.start_time ? new Date(form.start_time).toISOString() : undefined,
    end_time: form.end_time ? new Date(form.end_time).toISOString() : undefined,
    duration_minutes: parseInt(form.duration_minutes) || 60,
    total_questions: parseInt(form.total_questions) || 20,
    rules: form.rules,
    status: form.status,
    is_paid: form.is_paid,
    price: form.is_paid && form.price ? parseFloat(form.price) : undefined,
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.subject.trim()) {
      toast.error("Sarlavha va fan majburiy");
      return;
    }
    if (form.is_paid && (!form.price || parseFloat(form.price) <= 0)) {
      toast.error("To'lovli olimpiada uchun narx kiritish majburiy");
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await updateOlympiad(editItem.id, buildPayload() as Record<string, unknown>);
        toast.success("Olimpiada yangilandi");
      } else {
        await createOlympiad(buildPayload() as Record<string, unknown>);
        toast.success("Olimpiada yaratildi");
      }
      setOpen(false);
      setSearch("");
      setStatusFilter("all");
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteOlympiad(id);
      toast.success("O'chirildi");
      setDeleteId(null);
      load();
    } catch {
      toast.error("O'chirib bo'lmadi");
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olimpiadalar</h1>
          <p className="text-sm text-muted-foreground mt-1">Olimpiadalarni boshqaring va savollar qo&apos;shing</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Yangi olimpiada
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha statuslar</SelectItem>
            <SelectItem value="draft">Qoralama</SelectItem>
            <SelectItem value="published">Nashr qilingan</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="ended">Tugagan</SelectItem>
            <SelectItem value="archived">Arxiv</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Trophy className="h-10 w-10 mb-3 opacity-30" />
            <p>Olimpiadalar topilmadi</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Sarlavha</TableHead>
                <TableHead>Fan</TableHead>
                <TableHead>Davomiyligi</TableHead>
                <TableHead>To&apos;lov</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                    {item.grade > 0 && <p className="text-xs text-muted-foreground">{item.grade}-sinf</p>}
                  </TableCell>
                  <TableCell className="text-sm">{item.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.duration_minutes} daqiqa</TableCell>
                  <TableCell>
                    {item.is_paid ? (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs gap-1">
                        <DollarSign className="h-3 w-3" />{item.price?.toLocaleString()} UZS
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">Bepul</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/superadmin/olympiads/${item.id}/questions`}>
                        <Button variant="ghost" size="icon" title="Savollar">
                          <ListChecks className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Olimpiadani tahrirlash" : "Yangi olimpiada yaratish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Sarlavha *</Label>
                <Input placeholder="Olimpiada nomi" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Tavsif</Label>
                <Textarea placeholder="Olimpiada haqida..." rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Fan *</Label>
                <Input placeholder="Matematika, Fizika..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sinf</Label>
                <Input type="number" min={0} max={12} placeholder="0 = barcha sinflar" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Til</Label>
                <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v ?? 'uz' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uz">O&apos;zbek</SelectItem>
                    <SelectItem value="ru">Rus</SelectItem>
                    <SelectItem value="en">Ingliz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v ?? 'draft' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Qoralama</SelectItem>
                    <SelectItem value="published">Nashr qilish</SelectItem>
                    <SelectItem value="active">Faol</SelectItem>
                    <SelectItem value="ended">Tugatish</SelectItem>
                    <SelectItem value="archived">Arxiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Boshlanish vaqti</Label>
                <Input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tugash vaqti</Label>
                <Input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Davomiyligi (daqiqa) *</Label>
                <Input type="number" min={1} value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Savollar soni</Label>
                <Input type="number" min={1} value={form.total_questions} onChange={e => setForm(f => ({ ...f, total_questions: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Qoidalar</Label>
                <Textarea placeholder="Olimpiada qoidalari..." rows={2} value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} />
              </div>
              {/* Payment toggle */}
              <div className="col-span-2 rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">To&apos;lovli olimpiada</p>
                    <p className="text-xs text-muted-foreground">Foydalanuvchilar qatnashish uchun to&apos;lov qiladi</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_paid: !f.is_paid, price: !f.is_paid ? f.price : "" }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_paid ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_paid ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {form.is_paid && (
                  <div className="space-y-1.5">
                    <Label>Narx (UZS) *</Label>
                    <Input type="number" min={0} placeholder="10000" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editItem ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>O&apos;chirishni tasdiqlang</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Bu olimpiada barcha savol va natijalar bilan birga o&apos;chiriladi.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>O&apos;chirish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
