"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Eye, DollarSign, Copy, Send, SendHorizonal,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  getOlympiads, createOlympiad, updateOlympiad, deleteOlympiad,
  publishOlympiad, unpublishOlympiad, duplicateOlympiad,
} from "@/lib/superadmin-api";
import {
  getAssessmentDisplayStatus, getStatusBadgeColor, getStatusLabel,
} from "@/lib/assessment-types";
import type { AssessmentBase, AssessmentFormData } from "@/lib/assessment-types";
import { normalizeList } from "@/lib/normalizeList";
import AssessmentForm from "@/components/assessment/AssessmentForm";

interface Olympiad extends AssessmentBase {
  exam_type?: "olympiad";
}

export default function SuperadminOlympiadsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Olympiad | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

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
    setOpen(true);
  };

  const openEdit = (item: Olympiad) => {
    setEditItem(item);
    setOpen(true);
  };

  const handleFormSubmit = async (formData: AssessmentFormData) => {
    const payload: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      subject: formData.subject,
      grade: formData.grade,
      language: formData.language,
      rules: formData.rules,
      banner_url: formData.banner_url || undefined,
      icon_url: formData.icon_url || undefined,
      start_time: formData.start_time ? new Date(formData.start_time).toISOString() : undefined,
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
      registration_start_time: formData.registration_start_time ? new Date(formData.registration_start_time).toISOString() : undefined,
      registration_end_time: formData.registration_end_time ? new Date(formData.registration_end_time).toISOString() : undefined,
      duration_minutes: formData.duration_minutes,
      total_questions: formData.total_questions,
      max_seats: formData.max_seats,
      status: formData.status,
      is_paid: formData.is_paid,
      price: formData.is_paid && formData.price ? formData.price : undefined,
      shuffle_questions: formData.shuffle_questions,
      shuffle_answers: formData.shuffle_answers,
      auto_submit: formData.auto_submit,
      allow_retake: formData.allow_retake,
      show_result_immediately: formData.show_result_immediately,
      give_certificate: formData.give_certificate,
      manual_review: formData.manual_review,
      admin_approval: formData.admin_approval,
    };

    if (!formData.title.trim() || !formData.subject.trim()) {
      toast.error("Sarlavha va fan majburiy");
      return;
    }
    if (formData.is_paid && (!formData.price || formData.price <= 0)) {
      toast.error("To'lovli olimpiada uchun narx kiritish majburiy");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await updateOlympiad(editItem.id, payload);
        toast.success("Olimpiada yangilandi");
      } else {
        await createOlympiad(payload);
        toast.success("Olimpiada yaratildi");
      }
      setOpen(false);
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

  const handlePublish = async (id: number) => {
    try {
      await publishOlympiad(id);
      toast.success("Olimpiada nashr qilindi");
      load();
    } catch {
      toast.error("Nashr qilib bo'lmadi");
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await unpublishOlympiad(id);
      toast.success("Olimpiada nashrdan olindi");
      load();
    } catch {
      toast.error("Nashrdan olib bo'lmadi");
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateOlympiad(id);
      toast.success("Olimpiada nusxalandi");
      load();
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
  };

  // Derive unique subjects for filter
  const subjects = Array.from(new Set(items.map(i => i.subject).filter(Boolean)));

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchSubject = subjectFilter === "all" || item.subject === subjectFilter;
    const matchGrade = gradeFilter === "all" || String(item.grade) === gradeFilter;
    const matchLanguage = languageFilter === "all" || item.language === languageFilter;
    const matchPaid = paidFilter === "all" ||
      (paidFilter === "paid" && item.is_paid) ||
      (paidFilter === "free" && !item.is_paid);
    return matchSearch && matchStatus && matchSubject && matchGrade && matchLanguage && matchPaid;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, subjectFilter, gradeFilter, languageFilter, paidFilter]);

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
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha statuslar</SelectItem>
            <SelectItem value="draft">Qoralama</SelectItem>
            <SelectItem value="published">Nashr qilingan</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="ended">Tugagan</SelectItem>
            <SelectItem value="archived">Arxiv</SelectItem>
          </SelectContent>
        </Select>
        {subjects.length > 0 && (
          <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v ?? "all")}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Fan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha fanlar</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={gradeFilter} onValueChange={(v) => setGradeFilter(v ?? "all")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Sinf" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha sinflar</SelectItem>
            <SelectItem value="0">Umumiy</SelectItem>
            {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
              <SelectItem key={g} value={String(g)}>{g}-sinf</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={languageFilter} onValueChange={(v) => setLanguageFilter(v ?? "all")}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Til" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha tillar</SelectItem>
            <SelectItem value="uz">O&apos;zbek</SelectItem>
            <SelectItem value="ru">Rus</SelectItem>
            <SelectItem value="en">Ingliz</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paidFilter} onValueChange={(v) => setPaidFilter(v ?? "all")}>
          <SelectTrigger className="w-32"><SelectValue placeholder="To'lov" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="free">Bepul</SelectItem>
            <SelectItem value="paid">Pullik</SelectItem>
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
                <TableHead>Sinf</TableHead>
                <TableHead>Til</TableHead>
                <TableHead>Davomiyligi</TableHead>
                <TableHead>To&apos;lov</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item, i) => {
                const displayStatus = getAssessmentDisplayStatus(item);
                const langLabels: Record<string, string> = { uz: "O'zbek", ru: "Rus", en: "Ingliz" };
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <button
                        className="text-left hover:underline"
                        onClick={() => router.push(`/superadmin/olympiads/${item.id}`)}
                      >
                        <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{item.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.grade > 0 ? `${item.grade}-sinf` : "Umumiy"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {langLabels[item.language] || item.language}
                    </TableCell>
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
                      <Badge className={`text-xs ${getStatusBadgeColor(displayStatus)}`}>
                        {getStatusLabel(displayStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ko'rish"
                          onClick={() => router.push(`/superadmin/olympiads/${item.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.status === "draft" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Nashr qilish"
                            onClick={() => handlePublish(item.id)}
                          >
                            <Send className="h-4 w-4 text-blue-500" />
                          </Button>
                        ) : item.status === "published" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Nashrdan olish"
                            onClick={() => handleUnpublish(item.id)}
                          >
                            <SendHorizonal className="h-4 w-4 text-amber-500" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Nusxalash"
                          onClick={() => handleDuplicate(item.id)}
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Tahrirlash">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                          title="O'chirish"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} />

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Olimpiadani tahrirlash" : "Yangi olimpiada yaratish"}</DialogTitle>
          </DialogHeader>
          <AssessmentForm
            examType="olympiad"
            initialData={editItem || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setOpen(false)}
            loading={saving}
          />
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
