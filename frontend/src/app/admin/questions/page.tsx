"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOlympiads,
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  type Question,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, CheckCircle, Image, GripVertical } from "lucide-react";

export default function AdminQuestionsPage() {
  const queryClient = useQueryClient();
  const { data: olympiads } = useQuery({ queryKey: ["olympiads"], queryFn: fetchOlympiads });
  const [selectedOlympiadId, setSelectedOlympiadId] = useState<number | null>(null);
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", selectedOlympiadId],
    queryFn: () => fetchQuestions(selectedOlympiadId!),
    enabled: !!selectedOlympiadId,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({
    text: "",
    image: "",
    options: ["", "", "", ""],
    correctIdx: 0,
    points: 5,
  });

  const createMut = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", selectedOlympiadId] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Question> }) => updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", selectedOlympiadId] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", selectedOlympiadId] }),
  });

  function resetForm() {
    setForm({ text: "", image: "", options: ["", "", "", ""], correctIdx: 0, points: 5 });
    setEditing(null);
  }

  function openEdit(q: Question) {
    const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
    setEditing(q);
    setForm({
      text: q.text,
      image: q.image || "",
      options: opts.length >= 4 ? opts : [...opts, ...Array(4 - opts.length).fill("")],
      correctIdx: q.correctIdx,
      points: q.points,
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = form.options.filter((o) => o.trim() !== "");
    if (validOptions.length < 2) return;

    const payload = {
      text: form.text,
      image: form.image,
      options: validOptions,
      correctIdx: form.correctIdx,
      points: form.points,
      orderNum: (questions?.length || 0) + 1,
    };

    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate({ ...payload, olympiadId: selectedOlympiadId! });
    }
  }

  function updateOption(idx: number, value: string) {
    setForm((f) => {
      const opts = [...f.options];
      opts[idx] = value;
      return { ...f, options: opts };
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Savollar boshqaruvi</h1>
      </div>

      {/* Olympiad Selector */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Olimpiadani tanlang</Label>
              <Select
                value={selectedOlympiadId?.toString() || ""}
                onValueChange={(v) => v && setSelectedOlympiadId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Olimpiadani tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {olympiads?.map((o) => (
                    <SelectItem key={o.id} value={o.id.toString()}>
                      {o.title} ({o.subject})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedOlympiadId && (
              <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
                <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition-colors mt-6">
                  <Plus className="h-4 w-4" /> Savol qo&apos;shish
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editing ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label>Savol matni *</Label>
                      <Textarea
                        value={form.text}
                        onChange={(e) => setForm({ ...form, text: e.target.value })}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Image className="h-4 w-4" /> Rasm URL (ixtiyoriy)
                      </Label>
                      <Input
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Javob variantlari *</Label>
                      {form.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, correctIdx: idx })}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                              form.correctIdx === idx
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-gray-300 text-gray-400 hover:border-green-300"
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </button>
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            placeholder={`${idx + 1}-variant`}
                          />
                          {form.correctIdx === idx && (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-400">
                        To&apos;g&apos;ri javobni belgilash uchun harf tugmasini bosing
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Ball</Label>
                      <Input
                        type="number"
                        value={form.points}
                        onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                        min={1}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={createMut.isPending || updateMut.isPending}
                    >
                      {editing ? "Saqlash" : "Qo'shish"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {selectedOlympiadId && (
        <div className="space-y-3">
          {questionsLoading ? (
            <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
          ) : questions?.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              Bu olimpiadada hali savollar yo&apos;q. Yuqoridagi tugma orqali savol qo&apos;shing.
            </div>
          ) : (
            questions?.map((q, idx) => {
              const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
              return (
                <Card key={q.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm font-bold mt-0.5">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium text-gray-500">
                            Savol #{idx + 1} ({q.points} ball)
                          </CardTitle>
                          <p className="text-gray-900 mt-1">{q.text}</p>
                          {q.image && (
                            <div className="mt-2 text-xs text-blue-500">📷 Rasm biriktirilgan</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => deleteMut.mutate(q.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 ml-11">
                      {opts.map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            i === q.correctIdx
                              ? "bg-green-50 text-green-700 border border-green-200 font-medium"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          <span className="font-medium mr-1">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                          {i === q.correctIdx && " ✓"}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {!selectedOlympiadId && (
        <div className="p-12 text-center text-gray-400">
          Savollarni ko&apos;rish uchun yuqoridan olimpiadani tanlang
        </div>
      )}
    </div>
  );
}
