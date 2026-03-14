"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMockTests,
  createMockTest,
  updateMockTest,
  deleteMockTest,
} from "@/lib/superadmin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeList } from "@/lib/normalizeList";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

interface MockTest {
  id: number;
  title: string;
  description: string;
  subject: string;
  language: string;
  scoring_type: string;
  participation_type: string;
  is_paid: boolean;
  price: number;
  duration_minutes: number;
  total_questions: number;
  status: string;
  created_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  subject: "matematika",
  language: "uz",
  scoring_type: "simple",
  participation_type: "free",
  price: 0,
  duration_minutes: 60,
  total_questions: 30,
  status: "draft",
};

const subjects = [
  { value: "matematika", label: "Matematika" },
  { value: "fizika", label: "Fizika" },
  { value: "ona_tili", label: "Ona tili" },
  { value: "tarix", label: "Tarix" },
  { value: "rus_tili", label: "Rus tili" },
  { value: "ingliz_tili", label: "Ingliz tili" },
  { value: "biologiya", label: "Biologiya" },
  { value: "kimyo", label: "Kimyo" },
];

const statuses = [
  { value: "draft", label: "Qoralama" },
  { value: "active", label: "Faol" },
  { value: "archived", label: "Arxivlangan" },
];

const scoringTypes = [
  { value: "simple", label: "Oddiy" },
  { value: "rasch", label: "Rasch" },
];

const languages = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Ruscha" },
  { value: "en", label: "Inglizcha" },
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-600",
  active: "bg-green-600",
  archived: "bg-yellow-600",
};

const subjectLabels: Record<string, string> = Object.fromEntries(
  subjects.map((s) => [s.value, s.label])
);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MockTestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<MockTest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MockTest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const limit = 20;

  /* Fetch ---------------------------------------------------------- */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMockTests({
        page,
        page_size: limit,
        search: search || undefined,
        status: statusFilter || undefined,
        subject: subjectFilter || undefined,
      });
      const list = normalizeList(res);
      setItems(list);
      setTotal(res?.pagination?.total || res?.data?.total || res?.total || list.length);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, subjectFilter]);

  /* CRUD ----------------------------------------------------------- */
  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (item: MockTest) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      subject: item.subject || "matematika",
      language: item.language || "uz",
      scoring_type: item.scoring_type || "simple",
      participation_type: item.is_paid ? "paid" : (item.participation_type || "free"),
      price: item.price || 0,
      duration_minutes: item.duration_minutes || 60,
      total_questions: item.total_questions || 30,
      status: item.status || "draft",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        price: form.participation_type === "paid" ? Number(form.price) : 0,
        duration_minutes: Number(form.duration_minutes),
        total_questions: Number(form.total_questions),
        is_paid: form.participation_type === "paid",
      };

      if (editItem) {
        await updateMockTest(editItem.id, payload);
        toast.success("Mock test yangilandi");
      } else {
        await createMockTest(payload);
        toast.success("Mock test yaratildi");
      }
      setDialogOpen(false);
      setSearch("");
      setStatusFilter("all");
      setSubjectFilter("all");
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMockTest(id);
      toast.success("Mock test o'chirildi");
      setDeleteId(null);
      await fetchData();
    } catch {
      toast.error("O'chirib bo'lmadi");
    }
  };

  const totalPages = Math.ceil(total / limit);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mock Testlar</h1>
        <Button onClick={openCreate} className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4" /> Mock test qo&apos;shish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => {
            setStatusFilter(!v || v === "all" ? "" : v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px] bg-muted border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={subjectFilter || "all"}
          onValueChange={(v) => {
            setSubjectFilter(!v || v === "all" ? "" : v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] bg-muted border-border">
            <SelectValue placeholder="Fan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Sarlavha</TableHead>
              <TableHead>Fan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Baholash</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Narxi</TableHead>
              <TableHead>Davomiyligi</TableHead>
              <TableHead>Savollar</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Mock test topilmadi
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-accent">
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {item.title || "—"}
                  </TableCell>
                  <TableCell>{subjectLabels[item.subject] || item.subject}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[item.status] || "bg-gray-600"}>
                      {statuses.find((s) => s.value === item.status)?.label || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{item.scoring_type}</TableCell>
                  <TableCell>
                    {item.is_paid || item.participation_type === "paid" ? (
                      <Badge className="bg-orange-600">Pullik</Badge>
                    ) : (
                      <Badge variant="secondary">Bepul</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.is_paid || item.participation_type === "paid"
                      ? `${item.price} so'm`
                      : "—"}
                  </TableCell>
                  <TableCell>{item.duration_minutes} min</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/superadmin/mock-tests/${item.id}/questions`)
                      }
                    >
                      Savollar
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Jami: {total}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-sm">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Mock testni tahrirlash" : "Yangi mock test"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Fan *</Label>
              <Select
                value={form.subject}
                onValueChange={(v) => setForm({ ...form, subject: v ?? "matematika" })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Fan tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Sarlavha</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ixtiyoriy sarlavha"
                className="bg-muted border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ixtiyoriy tavsif"
                className="w-full bg-muted border border-border rounded-md p-2 text-sm min-h-[80px]"
              />
            </div>

            {/* Language & Scoring type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Til</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm({ ...form, language: v ?? "uz" })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Baholash turi</Label>
                <Select
                  value={form.scoring_type}
                  onValueChange={(v) =>
                    setForm({ ...form, scoring_type: v ?? "simple" })
                  }
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scoringTypes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Participation type & Price */}
            <div className="space-y-1.5">
              <Label>Ishtirok turi</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="participation_type"
                    checked={form.participation_type === "free"}
                    onChange={() =>
                      setForm({ ...form, participation_type: "free", price: 0 })
                    }
                  />
                  <span className="text-sm">Bepul</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="participation_type"
                    checked={form.participation_type === "paid"}
                    onChange={() =>
                      setForm({ ...form, participation_type: "paid" })
                    }
                  />
                  <span className="text-sm">Pullik</span>
                </label>
              </div>
            </div>

            {form.participation_type === "paid" && (
              <div className="space-y-1.5">
                <Label>Narxi (so&apos;m)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="bg-muted border-border"
                />
              </div>
            )}

            {/* Duration & Total questions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Davomiyligi (daqiqa)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration_minutes: Number(e.target.value),
                    })
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Savollar soni</Label>
                <Input
                  type="number"
                  value={form.total_questions}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      total_questions: Number(e.target.value),
                    })
                  }
                  className="bg-muted border-border"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v ?? "draft" })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editItem ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mock testni o&apos;chirishni tasdiqlang</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu mock test butunlay o&apos;chiriladi. Bu amalni ortga qaytarib bo&apos;lmaydi.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
