"use client";

import { useEffect, useState } from "react";
import { getCertificates, createCertificate } from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Certificate {
  id: number;
  user_id: number;
  user_name: string;
  title: string;
  source_type: string;
  source_id: number;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  created_at: string;
}

const emptyForm = { user_id: 0, source_type: "olympiad", source_id: 0, title: "" };
const sourceTypes = ["olympiad", "mock_test"];

export default function CertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCertificates({ page, page_size: limit, search, source_type: sourceTypeFilter || undefined });
      const list = normalizeList(res);
      setItems(list);
      setTotal(res.pagination?.total || res?.data?.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search, sourceTypeFilter]);

  const handleCreate = async () => {
    try {
      await createCertificate({ ...form, user_id: Number(form.user_id), source_id: Number(form.source_id) });
      setShowCreate(false);
      setForm(emptyForm);
      fetchData();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sertifikatlar</h1>
        <Button onClick={() => { setShowCreate(true); setForm(emptyForm); }} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" /> Sertifikat yaratish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-muted border-border" />
        </div>
        <Select value={sourceTypeFilter} onValueChange={(v) => { setSourceTypeFilter(!v || v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[170px] bg-muted border-border"><SelectValue placeholder="Manba turi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {sourceTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Sarlavha</TableHead>
              <TableHead>Manba turi</TableHead>
              <TableHead>Sertifikat raqami</TableHead>
              <TableHead>Tasdiqlash kodi</TableHead>
              <TableHead>Berilgan sana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sertifikat topilmadi</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-accent">
                <TableCell>{item.id}</TableCell>
                <TableCell className="font-medium">{item.user_name || `ID: ${item.user_id}`}</TableCell>
                <TableCell className="max-w-[200px] truncate">{item.title}</TableCell>
                <TableCell><Badge variant="secondary">{item.source_type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{item.certificate_number}</TableCell>
                <TableCell className="font-mono text-xs">{item.verification_code}</TableCell>
                <TableCell>{item.issued_at ? new Date(item.issued_at).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Jami: {total}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Yangi sertifikat</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Foydalanuvchi ID</Label><Input type="number" value={form.user_id || ""} onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })} className="bg-muted border-border" placeholder="Foydalanuvchi ID raqami" /></div>
            <div><Label>Sarlavha</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-muted border-border" /></div>
            <div><Label>Manba turi</Label>
              <Select value={form.source_type} onValueChange={(v) => setForm({ ...form, source_type: v ?? "" })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{sourceTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Manba ID</Label><Input type="number" value={form.source_id || ""} onChange={(e) => setForm({ ...form, source_id: Number(e.target.value) })} className="bg-muted border-border" placeholder="Olimpiada yoki mock test ID" /></div>
            <Button onClick={handleCreate} className="w-full bg-orange-500 hover:bg-orange-600">Yaratish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
