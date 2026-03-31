"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminFetchOlympiad,
  adminUpdateOlympiad,
  adminFetchOlympiadQuestions,
  adminCreateOlympiadQuestion,
  adminUpdateOlympiadQuestion,
  adminDeleteOlympiadQuestion,
  type Olympiad,
  type OlympiadQuestion,
} from "@/lib/api";

type OlympiadQuestionOption = {
  id?: number;
  text: string;
  image?: string;
  is_correct: boolean;
  order_num: number;
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

// ==================== Overview Tab ====================
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "Belgilanmagan";
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "Belgilanmagan";
  }
}

function OverviewTab({ olympiad }: { olympiad: Olympiad }) {
  const items = [
    { label: "Nomi", value: olympiad.title },
    { label: "Fan", value: olympiad.subject },
    { label: "Narx", value: !olympiad.price ? "Bepul" : `${olympiad.price} so'm` },
    { label: "Status", value: olympiad.status },
    {
      label: "Davomiyligi",
      value: olympiad.duration_minutes
        ? `${olympiad.duration_minutes} daqiqa`
        : "Belgilanmagan",
    },
    {
      label: "Maksimal joylar",
      value: olympiad.max_seats || "Cheksiz",
    },
    {
      label: "Boshlanish vaqti",
      value: formatDateTime(olympiad.start_time),
    },
    {
      label: "Tugash vaqti",
      value: formatDateTime(olympiad.end_time),
    },
    { label: "Savollar soni", value: olympiad.questions_count ?? 0 },
    { label: "Ishtirokchilar soni", value: olympiad.participants_count ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.label} className="border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-base font-semibold mt-1">{String(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {olympiad.description && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Tavsif</p>
            <p className="mt-1 text-foreground">{olympiad.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== Questions Tab ====================
type QuestionForm = {
  text: string;
  image: string;
  type: string;
  points: number;
  options: OlympiadQuestionOption[];
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

function defaultOptions(): OlympiadQuestionOption[] {
  return [
    { text: "", is_correct: true, order_num: 0 },
    { text: "", is_correct: false, order_num: 1 },
    { text: "", is_correct: false, order_num: 2 },
    { text: "", is_correct: false, order_num: 3 },
  ];
}

function QuestionsTab({ olympiadId }: { olympiadId: number }) {
  const queryClient = useQueryClient();

  const { data: questionsResp, isLoading } = useQuery({
    queryKey: ["admin-olympiad-questions", olympiadId],
    queryFn: () => adminFetchOlympiadQuestions(olympiadId),
  });
  const questions: OlympiadQuestion[] = questionsResp?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OlympiadQuestion | null>(null);
  const [form, setForm] = useState<QuestionForm>({
    text: "",
    image: "",
    type: "single_choice",
    points: 5,
    options: defaultOptions(),
  });

  const createMut = useMutation({
    mutationFn: adminCreateOlympiadQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-olympiad-questions", olympiadId] });
      queryClient.invalidateQueries({ queryKey: ["admin-olympiad", String(olympiadId)] });
      closeDialog();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OlympiadQuestion> }) =>
      adminUpdateOlympiadQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-olympiad-questions", olympiadId] });
      closeDialog();
    },
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteOlympiadQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-olympiad-questions", olympiadId] });
      queryClient.invalidateQueries({ queryKey: ["admin-olympiad", String(olympiadId)] });
    },
  });

  function resetForm() {
    setForm({ text: "", image: "", type: "single_choice", points: 5, options: defaultOptions() });
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setQuestionError("");
    resetForm();
  }

  function openCreate() {
    resetForm();
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(q: OlympiadQuestion) {
    setEditing(q);
    const opts: OlympiadQuestionOption[] = [0, 1, 2, 3].map((i) => {
      const existing = q.options?.[i];
      return existing
        ? { text: existing.text, is_correct: existing.is_correct, order_num: i, id: existing.id }
        : { text: "", is_correct: false, order_num: i };
    });
    setForm({
      text: q.text,
      image: q.image || "",
      type: q.type || "single_choice",
      points: q.points,
      options: opts,
    });
    setDialogOpen(true);
  }

  function setCorrectAnswer(idx: number) {
    if (form.type === "single_choice") {
      setForm({
        ...form,
        options: form.options.map((opt, i) => ({ ...opt, is_correct: i === idx })),
      });
    } else {
      setForm({
        ...form,
        options: form.options.map((opt, i) =>
          i === idx ? { ...opt, is_correct: !opt.is_correct } : opt
        ),
      });
    }
  }

  function setOptionText(idx: number, text: string) {
    setForm({
      ...form,
      options: form.options.map((opt, i) => (i === idx ? { ...opt, text } : opt)),
    });
  }

  function addOption() {
    const newOpt: OlympiadQuestionOption = {
      text: "",
      is_correct: false,
      order_num: form.options.length,
    };
    setForm({ ...form, options: [...form.options, newOpt] });
  }

  function removeOption(idx: number) {
    if (form.options.length <= 2) return;
    setForm({
      ...form,
      options: form.options
        .filter((_, i) => i !== idx)
        .map((opt, i) => ({ ...opt, order_num: i })),
    });
  }

  const [questionError, setQuestionError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuestionError("");

    // Validate question text
    if (!form.text.trim()) {
      setQuestionError("Savol matni kiritilishi shart");
      return;
    }

    // Validate points
    if (form.points < 1) {
      setQuestionError("Ball kamida 1 bo'lishi kerak");
      return;
    }

    const filteredOptions = form.options.filter((opt) => opt.text.trim() !== "");

    // Validate at least 2 options with text
    if (filteredOptions.length < 2) {
      setQuestionError("Kamida 2 ta javob varianti kiritilishi kerak");
      return;
    }

    // Validate at least one correct answer
    const hasCorrect = filteredOptions.some((opt) => opt.is_correct);
    if (!hasCorrect) {
      setQuestionError("Kamida bitta to'g'ri javob belgilanishi kerak");
      return;
    }

    if (editing) {
      updateMut.mutate({
        id: editing.id,
        data: {
          text: form.text,
          image: form.image,
          type: form.type,
          points: form.points,
          order_num: editing.order_num,
          options: filteredOptions,
        } as Partial<OlympiadQuestion>,
      });
    } else {
      createMut.mutate({
        olympiad_id: olympiadId,
        text: form.text,
        image: form.image || undefined,
        type: form.type,
        points: form.points,
        order_num: (questions.length ?? 0) + 1,
        options: filteredOptions,
      });
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Savollar ({questions.length})</h3>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Savol qo&apos;shish
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {questions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Hali savollar qo&apos;shilmagan. &quot;Savol qo&apos;shish&quot; tugmasini bosing.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Tartib</TableHead>
                  <TableHead>Savol matni</TableHead>
                  <TableHead className="w-36">Turi</TableHead>
                  <TableHead className="w-20">Ball</TableHead>
                  <TableHead className="w-24">Variantlar</TableHead>
                  <TableHead className="w-24 text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q, idx) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-muted-foreground">#{idx + 1}</TableCell>
                    <TableCell>
                      <p className="line-clamp-2">{q.text}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {q.type === "single_choice"
                          ? "Yagona javob"
                          : q.type === "multiple_choice"
                          ? "Ko'p javob"
                          : q.type || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{q.points}</TableCell>
                    <TableCell>{q.options?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => deleteMut.mutate(q.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) closeDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Question text */}
            <div className="space-y-2">
              <Label>Savol matni</Label>
              <Textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                placeholder="Savol matnini kiriting..."
                required
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label>Rasm URL (ixtiyoriy)</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* Type + Points */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm({ ...form, type: val as string })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Yagona javob</SelectItem>
                    <SelectItem value="multiple_choice">Ko&apos;p javob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ball</Label>
                <Input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>
                Javob variantlari
                {form.type === "single_choice"
                  ? " (to\u2018g\u2018ri javobni belgilang)"
                  : " (to\u2018g\u2018ri javoblarni belgilang)"}
              </Label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(i)}
                      className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                        opt.is_correct
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border text-muted-foreground hover:border-green-400"
                      }`}
                    >
                      {OPTION_LETTERS[i] ?? i + 1}
                    </button>
                    <Input
                      className="flex-1"
                      value={opt.text}
                      onChange={(e) => setOptionText(i, e.target.value)}
                      placeholder={`${OPTION_LETTERS[i] ?? i + 1} variant`}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {form.options.length < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-blue-600"
                  onClick={addOption}
                >
                  <Plus className="h-3 w-3 mr-1" /> Variant qo&apos;shish
                </Button>
              )}
            </div>

            {questionError && (
              <p className="text-sm text-destructive">{questionError}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={createMut.isPending || updateMut.isPending}
            >
              {editing ? "Saqlash" : "Qo\u2018shish"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Settings Tab ====================
function toLocalDatetime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function SettingsTab({ olympiad }: { olympiad: Olympiad }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: olympiad.title,
    subject: olympiad.subject,
    description: olympiad.description || "",
    price: olympiad.price,
    status: olympiad.status,
    duration_minutes: olympiad.duration_minutes || 0,
    max_seats: olympiad.max_seats || 0,
    start_time: toLocalDatetime(olympiad.start_time),
    end_time: toLocalDatetime(olympiad.end_time),
  });

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminUpdateOlympiad(olympiad.id, data as Partial<Olympiad>),
    onSuccess: () => {
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["admin-olympiad", String(olympiad.id)] });
      queryClient.invalidateQueries({ queryKey: ["admin-olympiads"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xatolik yuz berdi";
      setFormError(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Sarlavha kiritilishi shart");
      return;
    }
    if (!form.subject.trim()) {
      setFormError("Fan kiritilishi shart");
      return;
    }
    if (form.duration_minutes < 1) {
      setFormError("Davomiyligi kamida 1 daqiqa bo'lishi kerak");
      return;
    }

    // datetime-local formatini ISO ga o'girish
    const toISO = (val: string) => {
      if (!val) return undefined;
      try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
      } catch {
        return undefined;
      }
    };

    const startISO = toISO(form.start_time);
    const endISO = toISO(form.end_time);

    if (startISO && endISO && new Date(endISO) <= new Date(startISO)) {
      setFormError("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
      return;
    }

    updateMut.mutate({
      title: form.title,
      subject: form.subject,
      description: form.description,
      price: form.price,
      status: form.status,
      duration_minutes: form.duration_minutes,
      max_seats: form.max_seats,
      start_time: startISO,
      end_time: endISO,
    });
  }

  return (
    <Card className="border shadow-sm max-w-2xl">
      <CardHeader>
        <CardTitle>Olimpiada sozlamalari</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nomi *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Fan *</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Tavsif</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Olimpiada haqida qisqacha ma'lumot..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Narx (so&apos;m)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm({ ...form, status: val as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="published">Nashr qilingan</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="scheduled">Rejalashtirilgan</SelectItem>
                  <SelectItem value="finished">Tugagan</SelectItem>
                  <SelectItem value="archived">Arxivlangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Davomiyligi (daqiqa) *</Label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: Number(e.target.value) })
                }
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Maksimal joylar</Label>
              <Input
                type="number"
                value={form.max_seats}
                onChange={(e) =>
                  setForm({ ...form, max_seats: Number(e.target.value) })
                }
                min={0}
                placeholder="0 = cheksiz"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Boshlanish vaqti</Label>
              <Input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tugash vaqti</Label>
              <Input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            {updateMut.isSuccess && !formError && (
              <p className="text-sm text-green-600">Muvaffaqiyatli saqlandi!</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ==================== Placeholder Tabs ====================
function ParticipantsTab() {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-12 text-center">
        <p className="text-muted-foreground text-lg">Ishtirokchilar ro&apos;yxati tez orada...</p>
      </CardContent>
    </Card>
  );
}

function ResultsTab() {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-12 text-center">
        <p className="text-muted-foreground text-lg">Natijalar tez orada...</p>
      </CardContent>
    </Card>
  );
}

function CertificateTab() {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-12 text-center">
        <p className="text-muted-foreground text-lg">Sertifikat sozlamalari tez orada...</p>
      </CardContent>
    </Card>
  );
}

// ==================== Main Page ====================
export default function OlympiadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: olympiadResp, isLoading } = useQuery({
    queryKey: ["admin-olympiad", id],
    queryFn: () => adminFetchOlympiad(Number(id)),
    enabled: !!id,
  });
  const olympiad = olympiadResp?.data;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!olympiad) {
    return <div className="p-8 text-center text-muted-foreground">Olimpiada topilmadi</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/olympiads")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{olympiad.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {olympiad.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{olympiad.subject}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="questions">Savollar</TabsTrigger>
          <TabsTrigger value="participants">Ishtirokchilar</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
          <TabsTrigger value="certificate">Sertifikat</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab olympiad={olympiad} />
        </TabsContent>
        <TabsContent value="questions">
          <QuestionsTab olympiadId={olympiad.id} />
        </TabsContent>
        <TabsContent value="participants">
          <ParticipantsTab />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab />
        </TabsContent>
        <TabsContent value="certificate">
          <CertificateTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab olympiad={olympiad} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
