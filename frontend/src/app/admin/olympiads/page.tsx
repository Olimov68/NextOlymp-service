"use client";

import { useEffect, useState } from "react";
import {
  getAdminOlympiads,
  createAdminOlympiad,
  updateAdminOlympiad,
  deleteAdminOlympiad,
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

interface Olympiad {
  id: number;
  title: string;
  description: string;
  subject: string;
  grade: number;
  language: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
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
  start_time: "",
  end_time: "",
  duration_mins: 60,
  is_paid: false,
  price: 0,
  status: "draft",
};

const subjects = [
  "matematika",
  "fizika",
  "kimyo",
  "biologiya",
  "informatika",
  "ingliz_tili",
  "ona_tili",
  "tarix",
  "geografiya",
];

const statuses = ["draft", "active", "scheduled", "finished", "archived"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800",
  finished: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-800",
  archived: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-800",
};

export default function AdminOlympiadsPage() {
  const [items, setItems] = useState<Olympiad[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Olympiad | null>(null);
  const [deleteItem, setDeleteItem] = useState<Olympiad | null>(null);
  const [form, setForm] = useState(emptyForm);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminOlympiads({
        page,
        page_size: limit,
        search: search || undefined,
        status: statusFilter || undefined,
        subject: subjectFilter || undefined,
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
  }, [page, search, statusFilter, subjectFilter]);

  const handleCreate = async () => {
    try {
      await createAdminOlympiad({
        ...form,
        grade: Number(form.grade),
        duration_mins: Number(form.duration_mins),
        price: Number(form.price),
      });
      setShowCreate(false);
      setForm(emptyForm);
      fetchData();
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik"
      );
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      await updateAdminOlympiad(editItem.id, {
        ...form,
        grade: Number(form.grade),
        duration_mins: Number(form.duration_mins),
        price: Number(form.price),
      });
      setEditItem(null);
      fetchData();
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik"
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteAdminOlympiad(deleteItem.id);
      setDeleteItem(null);
      fetchData();
    } catch {
      alert("Xatolik");
    }
  };

  const openEdit = (item: Olympiad) => {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description || "",
      subject: item.subject,
      grade: item.grade,
      language: item.language || "uz",
      start_time: item.start_time ? item.start_time.slice(0, 16) : "",
      end_time: item.end_time ? item.end_time.slice(0, 16) : "",
      duration_mins: item.duration_mins,
      is_paid: item.is_paid,
      price: item.price || 0,
      status: item.status,
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
          className="border-border"
        />
      </div>
      <div>
        <Label>Tavsif</Label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <SelectItem key={s} value={s}>
                  {s}
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
            onValueChange={(v) => setForm({ ...form, language: v ?? "" })}
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
            value={form.duration_mins}
            onChange={(e) =>
              setForm({ ...form, duration_mins: Number(e.target.value) })
            }
            className="border-border"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Boshlanish vaqti</Label>
          <Input
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className="border-border"
          />
        </div>
        <div>
          <Label>Tugash vaqti</Label>
          <Input
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className="border-border"
          />
        </div>
      </div>
      <div>
        <Label>Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm({ ...form, status: v ?? "" })}
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
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isEdit ? "Saqlash" : "Yaratish"}
      </Button>
    </div>
  );

  return (
    <PermissionGuard module="olympiads" showAccessDenied>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Olimpiadalar</h1>
          <PermissionGuard permission="olympiads.create">
            <Button
              onClick={() => {
                setShowCreate(true);
                setForm(emptyForm);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Olimpiada qo&apos;shish
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
          <Select
            value={subjectFilter || "all"}
            onValueChange={(v) => {
              setSubjectFilter(!v || v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] border-border">
              <SelectValue placeholder="Fan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hammasi</SelectItem>
              {subjects.map((s) => (
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
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Sarlavha</TableHead>
                <TableHead className="text-muted-foreground">Fan</TableHead>
                <TableHead className="text-muted-foreground">Sinf</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Pullik</TableHead>
                <TableHead className="text-muted-foreground">Narxi</TableHead>
                <TableHead className="text-muted-foreground">Boshlanish</TableHead>
                <TableHead className="text-muted-foreground">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Olimpiadalar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-border hover:bg-accent"
                  >
                    <TableCell className="text-foreground">{item.id}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate text-foreground">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {item.subject}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {item.grade}
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
                      {item.is_paid ? `${item.price} so'm` : "\u2014"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {item.start_time
                        ? new Date(item.start_time).toLocaleString()
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <PermissionGuard permission="olympiads.update">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="olympiads.delete">
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
              <DialogTitle>Yangi olimpiada</DialogTitle>
            </DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Olimpiadani tahrirlash</DialogTitle>
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
              &quot;{deleteItem?.title}&quot; olimpiadasini o&apos;chirishni
              xohlaysizmi? Bu amalni qaytarib bo&apos;lmaydi.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteItem(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                O&apos;chirish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
