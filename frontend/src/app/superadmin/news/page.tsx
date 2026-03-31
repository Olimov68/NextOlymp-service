"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  Plus, Pencil, Trash2, Eye, Image as ImageIcon, Loader2, RefreshCw, Search,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { getNewsList, getNewsItem, createNews, updateNews, deleteNews } from "@/lib/superadmin-api";
import { uploadPanelImage } from "@/lib/admin-api";
import { normalizeList } from "@/lib/normalizeList";
import { getErrorMessage } from "@/lib/api-error";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1").replace(/\/api\/v1$/, "");
function imageUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
}

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image: string;
  type: "news" | "announcement";
  status: "draft" | "published" | "archived";
  published_at: string;
  created_at: string;
}

interface NewsFormData {
  title: string;
  body: string;
  excerpt: string;
  cover_image: string;
  type: "news" | "announcement";
  status: "draft" | "published" | "archived";
}

const emptyForm: NewsFormData = {
  title: "",
  body: "",
  excerpt: "",
  cover_image: "",
  type: "news",
  status: "draft",
};

const statusColors: Record<string, string> = {
  published: "bg-green-500/10 text-green-600 border-green-500/20",
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabels: Record<string, string> = {
  published: "Nashr qilingan",
  draft: "Qoralama",
  archived: "Arxiv",
};

export default function SuperadminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<NewsFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNewsList({ page: 1, page_size: 100 });
      const list = normalizeList(data);
      setNews(list);
    } catch {
      toast.error("Yangiliklar yuklanmadi");
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

  const openEdit = (item: NewsItem) => {
    setEditItem(item);
    setForm({
      title: item.title,
      body: item.body || "",
      excerpt: item.excerpt || "",
      cover_image: item.cover_image || "",
      type: item.type,
      status: item.status,
    });
    setOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPanelImage(file);
      setForm(f => ({ ...f, cover_image: url }));
      toast.success("Rasm yuklandi");
    } catch {
      toast.error("Rasm yuklanmadi");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Sarlavha va matn majburiy");
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await updateNews(editItem.id, { ...form } as Record<string, unknown>);
        toast.success("Yangilik yangilandi");
      } else {
        await createNews({ ...form } as Record<string, unknown>);
        toast.success("Yangilik yaratildi");
      }
      setOpen(false);
      setSearch("");
      setTypeFilter("all");
      setStatusFilter("all");
      await load();
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "Xatolik yuz berdi");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNews(id);
      toast.success("O'chirildi");
      setDeleteId(null);
      await load();
    } catch {
      toast.error("O'chirib bo'lmadi");
    }
  };

  const filtered = news.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || n.type === typeFilter;
    const matchStatus = statusFilter === "all" || n.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Yangiliklar</h1>
          <p className="text-sm text-muted-foreground mt-1">Yangiliklar va e&apos;lonlarni boshqaring</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Yangi yaratish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="news">Yangilik</SelectItem>
            <SelectItem value="announcement">E&apos;lon</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="published">Nashr</SelectItem>
            <SelectItem value="draft">Qoralama</SelectItem>
            <SelectItem value="archived">Arxiv</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Eye className="h-10 w-10 mb-3 opacity-30" />
            <p>Yangiliklar topilmadi</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Sarlavha</TableHead>
                <TableHead>Tur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.cover_image ? (
                        <img src={imageUrl(item.cover_image)} alt="" className="h-10 w-14 rounded-md object-cover border border-border" />
                      ) : (
                        <div className="h-10 w-14 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                        {item.excerpt && <p className="text-xs text-muted-foreground line-clamp-1">{item.excerpt}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.type === "news" ? "Yangilik" : "E'lon"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} />

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Yangilikni tahrirlash" : "Yangi yangilik yaratish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Sarlavha *</Label>
                <Input placeholder="Yangilik sarlavhasi" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tur</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as "news" | "announcement" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">Yangilik</SelectItem>
                    <SelectItem value="announcement">E&apos;lon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as "draft" | "published" | "archived" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Qoralama</SelectItem>
                    <SelectItem value="published">Nashr qilish</SelectItem>
                    <SelectItem value="archived">Arxiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Qisqa tavsif</Label>
                <Textarea placeholder="Qisqa tavsif..." rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>To&apos;liq matn *</Label>
                <Textarea placeholder="Yangilik matni..." rows={8} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              {/* Image Upload */}
              <div className="col-span-2 space-y-2">
                <Label>Muqova rasmi</Label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      {uploading ? "Yuklanmoqda..." : "Rasm tanlash"}
                    </Button>
                    {form.cover_image && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{form.cover_image}</p>
                    )}
                  </div>
                  {form.cover_image && (
                    <img src={imageUrl(form.cover_image)} alt="" className="h-16 w-24 rounded-lg object-cover border border-border" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editItem ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>O&apos;chirishni tasdiqlang</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Bu yangilik butunlay o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>O&apos;chirish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
