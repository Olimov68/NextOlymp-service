"use client";

import { useEffect, useState } from "react";
import {
  getAdminMockTests,
  createAdminMockTest,
  updateAdminMockTest,
  deleteAdminMockTest,
} from "@/lib/admin-api";
import { PermissionGuard } from "@/components/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
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
  Edit,
  Trash2,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

interface MockTest {
  id: number;
  title: string;
  description: string;
  subject: string;
  grade: number;
  language: string;
  duration_minutes: number;
  total_questions: number;
  scoring_type: string;
  is_paid: boolean;
  price: number;
  status: string;
  created_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  subject: "",
  grade: 0,
  language: "uz",
  duration_minutes: 60,
  total_questions: 0,
  scoring_type: "simple",
  is_paid: false,
  price: 0,
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

const statuses = ["draft", "active", "archived"];
const scoringTypes = [
  { value: "simple", label: "Oddiy (Simple)" },
  { value: "rasch", label: "Rasch" },
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800",
  archived: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-800",
};

const subjectLabel = (val: string) =>
  subjects.find((s) => s.value === val)?.label || val;

export default function AdminMockTestsPage() {
  const [items, setItems] = useState<MockTest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<MockTest | null>(null);
  const [deleteItem, setDeleteItem] = useState<MockTest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminMockTests({
        page,
        page_size: limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setItems(list);
      setTotal(res.total || res.data?.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        grade: Number(form.grade),
        duration_minutes: Number(form.duration_minutes),
        total_questions: Number(form.total_questions),
      };
      if (form.is_paid) {
        payload.price = Number(form.price);
      } else {
        payload.price = null;
      }
      await createAdminMockTest(payload);
      setShowCreate(false);
      setForm(emptyForm);
      toast.success("Mock test muvaffaqiyatli yaratildi");
      fetchData();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik yuz berdi";
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        grade: Number(form.grade),
        duration_minutes: Number(form.duration_minutes),
        total_questions: Number(form.total_questions),
      };
      if (form.is_paid) {
        payload.price = Number(form.price);
      } else {
        payload.price = null;
      }
      await updateAdminMockTest(editItem.id, payload);
      setEditItem(null);
      toast.success("Mock test muvaffaqiyatli yangilandi");
      fetchData();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik yuz berdi";
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteAdminMockTest(deleteItem.id);
      setDeleteItem(null);
      toast.success("Mock test o'chirildi");
      fetchData();
    } catch {
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  const openEdit = (item: MockTest) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      subject: item.subject || "",
      grade: item.grade || 0,
      language: item.language || "uz",
      duration_minutes: item.duration_minutes || 60,
      total_questions: item.total_questions || 0,
      scoring_type: item.scoring_type || "simple",
      is_paid: item.is_paid || false,
      price: item.price || 0,
      status: item.status || "draft",
    });
  };

  const totalPages = Math.ceil(total / limit);

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label>Sarlavha</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Mock test sarlavhasi"
          className="border-border"
        />
      </div>
      <div>
        <Label>Tavsif</Label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Qo'shimcha tavsif (ixtiyoriy)"
          className="w-full border border-border rounded-md p-2 text-sm min-h-[80px] bg-background text-foreground"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Fan</Label>
          <Select
            value={form.subject}
            onValueChange={(v) => setForm({ ...form, subject: v ?? "" })}
          >
            <SelectTrigger className="border-border">
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
        <div>
          <Label>Sinf</Label>
          <Input
            type="number"
            value={form.grade}
            onChange={(e) =>
              setForm({ ...form, grade: Number(e.target.value) })
            }
            className="border-border"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Til</Label>
          <Select
            value={form.language}
            onValueChange={(v) => setForm({ ...form, language: v ?? "uz" })}
          >
            <SelectTrigger className="border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uz">O&apos;zbekcha</SelectItem>
              <SelectItem value="ru">Ruscha</SelectItem>
              <SelectItem value="en">Inglizcha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Davomiyligi (min)</Label>
          <Input
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={(e) =>
              setForm({ ...form, duration_minutes: Number(e.target.value) })
            }
            className="border-border"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Baholash turi</Label>
          <Select
            value={form.scoring_type}
            onValueChange={(v) =>
              setForm({ ...form, scoring_type: v ?? "simple" })
            }
          >
            <SelectTrigger className="border-border">
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
        <div>
          <Label>Savollar soni</Label>
          <Input
            type="number"
            min={0}
            value={form.total_questions}
            onChange={(e) =>
              setForm({ ...form, total_questions: Number(e.target.value) })
            }
            className="border-border"
          />
        </div>
      </div>
      <div>
        <Label>Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm({ ...form, status: v ?? "draft" })}
        >
          <SelectTrigger className="border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_paid}
            onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Pullik</span>
        </label>
        {form.is_paid && (
          <div className="flex-1">
            <Label>Narxi</Label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              className="border-border"
            />
          </div>
        )}
      </div>
      <Button
        onClick={isEdit ? handleUpdate : handleCreate}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {saving ? "Saqlanmoqda..." : isEdit ? "Saqlash" : "Yaratish"}
      </Button>
    </div>
  );

  return (
    <PermissionGuard module="mock_tests" showAccessDenied>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Mock Testlar</h1>
          <PermissionGuard permission="mock_tests.create">
            <Button
              onClick={() => {
                setShowCreate(true);
                setForm(emptyForm);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Mock test qo&apos;shish
            </Button>
          </PermissionGuard>
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
              className="pl-10 border-border"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter(!v || v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hammasi</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted hover:bg-muted">
                <TableHead className="text-muted-foreground">Sarlavha</TableHead>
                <TableHead className="text-muted-foreground">Fan</TableHead>
                <TableHead className="text-muted-foreground">Baholash</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Turi</TableHead>
                <TableHead className="text-muted-foreground">Davomiyligi</TableHead>
                <TableHead className="text-muted-foreground">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Mock test topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-border hover:bg-accent"
                  >
                    <TableCell className="font-medium max-w-[250px] truncate text-foreground">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {subjectLabel(item.subject)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {item.scoring_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[item.status] ||
                          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.is_paid ? (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-800">
                          Pullik
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground border-border"
                        >
                          Bepul
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {item.duration_minutes} min
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <PermissionGuard permission="mock_tests.update">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="mock_tests.delete">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteItem(item)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi mock test</DialogTitle>
            </DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Mock testni tahrirlash</DialogTitle>
            </DialogHeader>
            {renderForm(true)}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>O&apos;chirishni tasdiqlang</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              &quot;{deleteItem?.title}&quot; mock testini o&apos;chirishni
              xohlaysizmi? Bu amalni qaytarib bo&apos;lmaydi.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteItem(null)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                O&apos;chirish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
