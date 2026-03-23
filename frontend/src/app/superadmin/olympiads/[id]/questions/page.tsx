"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft, Plus, Pencil, Trash2, Loader2, ListChecks, CheckCircle2, Circle,
  Image as ImageIcon, X, Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  getQuestionsBySource, createQuestion, updateQuestion, deleteQuestion, getOlympiad, uploadImage,
} from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import { getErrorMessage } from "@/lib/api-error";

interface Option {
  id?: number;
  label: string;
  text: string;
  is_correct: boolean;
  order_num: number;
  image_url?: string;
}

interface Question {
  id: number;
  text: string;
  image_url?: string;
  difficulty: string;
  points: number;
  order_num: number;
  is_active: boolean;
  options: Option[];
}

interface QuestionForm {
  text: string;
  image_url: string;
  difficulty: string;
  points: string;
  options: (Option & { image_url: string })[];
}

const defaultOptions: (Option & { image_url: string })[] = [
  { label: "A", text: "", is_correct: false, order_num: 0, image_url: "" },
  { label: "B", text: "", is_correct: false, order_num: 1, image_url: "" },
  { label: "C", text: "", is_correct: false, order_num: 2, image_url: "" },
  { label: "D", text: "", is_correct: false, order_num: 3, image_url: "" },
];

const emptyForm: QuestionForm = {
  text: "",
  image_url: "",
  difficulty: "medium",
  points: "1",
  options: defaultOptions.map(o => ({ ...o })),
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/10 text-green-600 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-600 border-red-500/20",
};

const difficultyLabels: Record<string, string> = {
  easy: "Oson",
  medium: "O'rtacha",
  hard: "Qiyin",
};

export default function OlympiadQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<{ title?: string; id?: number; subject?: string; duration_minutes?: number; total_questions?: number } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [olympiadData, questionsData] = await Promise.all([
        getOlympiad(Number(id)),
        getQuestionsBySource({ source_type: "olympiad", source_id: Number(id) }),
      ]);
      setOlympiad(olympiadData);
      setQuestions(normalizeList(questionsData));
    } catch {
      toast.error("Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openCreate = () => {
    setEditQuestion(null);
    setForm({ ...emptyForm, options: defaultOptions.map(o => ({ ...o })) });
    setOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditQuestion(q);
    const opts = q.options.length >= 2
      ? q.options.map(o => ({ ...o, image_url: o.image_url || "" }))
      : defaultOptions.map(o => ({ ...o }));
    setForm({
      text: q.text,
      image_url: q.image_url || "",
      difficulty: q.difficulty || "medium",
      points: String(q.points || 1),
      options: opts,
    });
    setOpen(true);
  };

  const handleQuestionImageUpload = async (file: File) => {
    setUploadingQuestionImage(true);
    try {
      const res = await uploadImage(file);
      setForm(f => ({ ...f, image_url: res.url }));
    } catch {
      toast.error("Rasm yuklanmadi");
    } finally {
      setUploadingQuestionImage(false);
    }
  };

  const handleOptionImageUpload = async (idx: number, file: File) => {
    setUploadingOptionImage(idx);
    try {
      const res = await uploadImage(file);
      setForm(f => ({
        ...f,
        options: f.options.map((o, i) => i === idx ? { ...o, image_url: res.url } : o),
      }));
    } catch {
      toast.error("Rasm yuklanmadi");
    } finally {
      setUploadingOptionImage(null);
    }
  };

  const setOptionCorrect = (idx: number) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_correct: i === idx })),
    }));
  };

  const setOptionText = (idx: number, text: string) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => i === idx ? { ...o, text } : o),
    }));
  };

  const handleSave = async () => {
    if (!form.text.trim()) { toast.error("Savol matni majburiy"); return; }
    const hasCorrect = form.options.some(o => o.is_correct);
    if (!hasCorrect) { toast.error("Kamida 1 ta to'g'ri javob belgilang"); return; }
    const emptyOpts = form.options.filter(o => !o.text.trim());
    if (emptyOpts.length > 0) { toast.error("Barcha variantlar matnini to'ldiring"); return; }
    const points = parseFloat(form.points);
    if (!points || points <= 0) { toast.error("Ball musbat son bo'lishi kerak"); return; }

    setSaving(true);
    try {
      const payload = {
        source_type: "olympiad",
        source_id: Number(id),
        text: form.text,
        image_url: form.image_url || undefined,
        difficulty: form.difficulty,
        points,
        order_num: editQuestion ? editQuestion.order_num : questions.length,
        options: form.options.map((o, i) => ({
          label: o.label,
          text: o.text,
          is_correct: o.is_correct,
          order_num: i,
          image_url: o.image_url || undefined,
        })),
      };

      if (editQuestion) {
        await updateQuestion(editQuestion.id, {
          ...payload,
          options: form.options.map((o, i) => ({
            id: o.id,
            label: o.label,
            text: o.text,
            is_correct: o.is_correct,
            order_num: i,
            image_url: o.image_url || undefined,
          })),
        } as Record<string, unknown>);
        toast.success("Savol yangilandi");
      } else {
        await createQuestion(payload as Record<string, unknown>);
        toast.success("Savol yaratildi");
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Xatolik yuz berdi"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qid: number) => {
    try {
      await deleteQuestion(qid);
      toast.success("Savol o'chirildi");
      setDeleteId(null);
      load();
    } catch {
      toast.error("O'chirib bo'lmadi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/superadmin/olympiads")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Olimpiada</p>
          <h1 className="text-2xl font-bold text-foreground">{olympiad?.title || "Savollar"}</h1>
          {olympiad && (
            <p className="text-sm text-muted-foreground mt-1">
              {olympiad.subject} &bull; {olympiad.duration_minutes} daqiqa &bull; {questions.length} / {olympiad.total_questions} savol
            </p>
          )}
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Savol qo&apos;shish
        </Button>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-muted-foreground">
          <ListChecks className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-medium">Savollar yo&apos;q</p>
          <p className="text-sm mt-1">Olimpiadaga savollar qo&apos;shing</p>
          <Button className="mt-4 gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Savol qo&apos;shish</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-3">{q.text}</p>
                    {q.image_url && (
                      <img src={q.image_url} alt="Savol rasmi" className="h-20 w-auto rounded-lg border border-border object-contain bg-muted mb-3" />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map(opt => (
                        <div key={opt.id || opt.label} className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${opt.is_correct ? "border-green-500/30 bg-green-500/5" : "border-border bg-background"}`}>
                          <span className="flex-shrink-0">
                            {opt.is_correct
                              ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              : <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />}
                          </span>
                          <span className={`font-medium mr-1 ${opt.is_correct ? "text-green-600" : "text-muted-foreground"}`}>{opt.label}.</span>
                          <div className="flex-1">
                            <span className={opt.is_correct ? "text-foreground font-medium" : "text-muted-foreground"}>{opt.text}</span>
                            {opt.image_url && (
                              <img src={opt.image_url} alt={`${opt.label} rasmi`} className="h-10 w-auto rounded border border-border object-contain bg-muted mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className={`text-xs ${difficultyColors[q.difficulty]}`}>{difficultyLabels[q.difficulty]}</Badge>
                      <Badge variant="outline" className="text-xs">{q.points} ball</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(q.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editQuestion ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Savol matni *</Label>
              <Textarea
                placeholder="Savol matnini kiriting..."
                rows={3}
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              />
            </div>
            {/* Question image upload */}
            <div className="space-y-1.5">
              <Label>Savol rasmi</Label>
              {form.image_url ? (
                <div className="flex items-start gap-2">
                  <img src={form.image_url} alt="Savol rasmi" className="h-20 w-auto rounded-lg border border-border object-contain bg-muted" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setForm(f => ({ ...f, image_url: "" }))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border bg-muted/50 hover:bg-muted cursor-pointer transition-colors text-sm text-muted-foreground">
                    {uploadingQuestionImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Rasm yuklash
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingQuestionImage} onChange={e => { const f = e.target.files?.[0]; if (f) handleQuestionImageUpload(f); e.target.value = ""; }} />
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Qiyinlik darajasi</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v ?? "medium" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Oson</SelectItem>
                    <SelectItem value="medium">O&apos;rtacha</SelectItem>
                    <SelectItem value="hard">Qiyin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ball *</Label>
                <Input type="number" min={0.5} step={0.5} value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>Variantlar * (to&apos;g&apos;ri javobni tanlang)</Label>
              {form.options.map((opt, idx) => (
                <div key={opt.label} className={`rounded-xl border p-3 transition-colors ${opt.is_correct ? "border-green-500/30 bg-green-500/5" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOptionCorrect(idx)}
                      className="flex-shrink-0"
                    >
                      {opt.is_correct
                        ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                        : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />}
                    </button>
                    <span className="font-bold text-sm w-5 text-muted-foreground flex-shrink-0">{opt.label}.</span>
                    <Input
                      placeholder={`${opt.label} varianti...`}
                      value={opt.text}
                      onChange={e => setOptionText(idx, e.target.value)}
                      className="flex-1"
                    />
                    <label className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-muted/50 hover:bg-muted cursor-pointer transition-colors flex-shrink-0" title="Rasm yuklash">
                      {uploadingOptionImage === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingOptionImage === idx} onChange={e => { const f = e.target.files?.[0]; if (f) handleOptionImageUpload(idx, f); e.target.value = ""; }} />
                    </label>
                  </div>
                  {opt.image_url && (
                    <div className="flex items-start gap-2 mt-2 ml-11">
                      <img src={opt.image_url} alt={`${opt.label} rasmi`} className="h-14 w-auto rounded border border-border object-contain bg-muted" />
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, image_url: "" } : o) }))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Doirani bosib to&apos;g&apos;ri javobni belgilang</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editQuestion ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Savolni o&apos;chirishni tasdiqlang</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Bu savol o&apos;chirilib bo&apos;lmaydi.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>O&apos;chirish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
