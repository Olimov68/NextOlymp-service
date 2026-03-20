"use client";

import { useEffect, useState } from "react";
import { getAdminNews, createAdminNews, updateAdminNews, deleteAdminNews } from "@/lib/admin-api";
import { PermissionGuard } from "@/components/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface NewsItem {
  id: number;
  title: string;
  body: string;
  excerpt: string;
  cover_image: string;
  type: string;
  slug: string;
  status: string;
  created_at: string;
}

const emptyForm = {
  title: "", body: "", excerpt: "", cover_image: "", slug: "", type: "news", status: "draft"
};

const statuses = ["draft", "published", "archived"];
const types = ["news", "announcement"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-500", published: "bg-green-500", archived: "bg-red-500"
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminNews({ page, limit, search: search || undefined, status: statusFilter || undefined });
      setItems(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search, statusFilter]);

  const handleCreate = async () => {
    try {
      await createAdminNews(form);
      setShowCreate(false);
      setForm(emptyForm);
      fetchData();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      await updateAdminNews(editItem.id, form);
      setEditItem(null);
      fetchData();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yangilikni o'chirishni xohlaysizmi?")) return;
    try { await deleteAdminNews(id); fetchData(); } catch { alert("Xatolik"); }
  };

  const openEdit = (item: NewsItem) => {
    setEditItem(item);
    setForm({
      title: item.title,
      body: item.body || "",
      excerpt: item.excerpt || "",
      cover_image: item.cover_image || "",
      slug: item.slug || "",
      type: item.type || "news",
      status: item.status,
    });
  };

  const totalPages = Math.ceil(total / limit);

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div><Label className="text-foreground">Sarlavha</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-background border-border" /></div>
      <div><Label className="text-foreground">Qisqa tavsif</Label><textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full bg-background border border-border rounded-md p-2 text-sm min-h-[60px] text-foreground" /></div>
      <div><Label className="text-foreground">To&apos;liq matn</Label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full bg-background border border-border rounded-md p-2 text-sm min-h-[150px] text-foreground" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-foreground">Tur</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? "news" })}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t === "news" ? "Yangilik" : "E'lon"}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? "" })}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label className="text-foreground">Muqova rasmi (URL)</Label><Input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="bg-background border-border" placeholder="https://..." /></div>
      <div><Label className="text-foreground">Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="bg-background border-border" placeholder="yangilik-slug" /></div>
      <Button onClick={isEdit ? handleUpdate : handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">{isEdit ? "Saqlash" : "Yaratish"}</Button>
    </div>
  );

  return (
    <PermissionGuard module="news" showAccessDenied>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Yangiliklar</h1>
          <PermissionGuard permission="news.create">
            <Button onClick={() => { setShowCreate(true); setForm(emptyForm); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Yangilik qo&apos;shish
            </Button>
          </PermissionGuard>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 bg-background border-border" />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(!v || v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[150px] bg-background border-border"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Hammasi</SelectItem>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-accent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Sarlavha</TableHead>
                <TableHead className="text-muted-foreground">Tur</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Yaratilgan sana</TableHead>
                <TableHead className="text-muted-foreground">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yangilik topilmadi</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-accent">
                  <TableCell className="text-foreground">{item.id}</TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate text-foreground">{item.title}</TableCell>
                  <TableCell className="text-foreground">{item.type === "news" ? "Yangilik" : item.type === "announcement" ? "E'lon" : item.type}</TableCell>
                  <TableCell><Badge className={`${statusColors[item.status] || "bg-gray-500"} text-white`}>{item.status}</Badge></TableCell>
                  <TableCell className="text-foreground">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "\u2014"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <PermissionGuard permission="news.update">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                      </PermissionGuard>
                      <PermissionGuard permission="news.delete">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle className="text-foreground">Yangi yangilik</DialogTitle></DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle className="text-foreground">Yangilikni tahrirlash</DialogTitle></DialogHeader>
            {renderForm(true)}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
