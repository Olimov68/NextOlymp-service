"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import type { ExamType, AssessmentBase, AssessmentFormData } from "@/lib/assessment-types";
import { uploadImage } from "@/lib/superadmin-api";

interface AssessmentFormProps {
  examType: ExamType;
  initialData?: Partial<AssessmentBase>;
  onSubmit: (data: AssessmentFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const emptyForm: AssessmentFormData = {
  title: "",
  description: "",
  subject: "",
  grade: 0,
  language: "uz",
  rules: "",
  banner_url: "",
  icon_url: "",
  registration_start_time: "",
  registration_end_time: "",
  start_time: "",
  end_time: "",
  duration_minutes: 60,
  total_questions: 20,
  max_seats: 0,
  is_paid: false,
  price: undefined,
  status: "draft",
  shuffle_questions: false,
  shuffle_answers: false,
  auto_submit: true,
  allow_retake: false,
  show_result_immediately: false,
  give_certificate: false,
  manual_review: false,
  admin_approval: false,
  min_score_for_certificate: 0,
  scoring_rules: "",
  scoring_type: "classic",
  scaling_formula_type: "linear",
};

function toLocalDatetime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function AssessmentForm({
  examType,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: AssessmentFormProps) {
  const [form, setForm] = useState<AssessmentFormData>(emptyForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        description: initialData.description || "",
        subject: initialData.subject || "",
        grade: initialData.grade ?? 0,
        language: initialData.language || "uz",
        rules: initialData.rules || "",
        banner_url: initialData.banner_url || "",
        icon_url: initialData.icon_url || "",
        registration_start_time: toLocalDatetime(initialData.registration_start_time),
        registration_end_time: toLocalDatetime(initialData.registration_end_time),
        start_time: toLocalDatetime(initialData.start_time),
        end_time: toLocalDatetime(initialData.end_time),
        duration_minutes: initialData.duration_minutes ?? 60,
        total_questions: initialData.total_questions ?? 20,
        max_seats: initialData.max_seats ?? 0,
        is_paid: initialData.is_paid ?? false,
        price: initialData.price,
        status: initialData.status || "draft",
        shuffle_questions: initialData.shuffle_questions ?? false,
        shuffle_answers: initialData.shuffle_answers ?? false,
        auto_submit: initialData.auto_submit ?? true,
        allow_retake: initialData.allow_retake ?? false,
        show_result_immediately: initialData.show_result_immediately ?? false,
        give_certificate: initialData.give_certificate ?? false,
        manual_review: initialData.manual_review ?? false,
        admin_approval: initialData.admin_approval ?? false,
        min_score_for_certificate: (initialData as any)?.min_score_for_certificate ?? 0,
        scoring_rules: (initialData as any)?.scoring_rules || "",
        scoring_type: (initialData as any)?.scoring_type || "classic",
        scaling_formula_type: (initialData as any)?.scaling_formula_type || "linear",
      });
    }
  }, [initialData]);

  const update = <K extends keyof AssessmentFormData>(key: K, value: AssessmentFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleSwitch = (key: keyof AssessmentFormData) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  const handleSubmit = () => {
    onSubmit(form);
  };

  const isMock = examType === "mock_test";
  const typeLabel = isMock ? "Mock test" : "Olimpiada";

  return (
    <div className="space-y-6">
      {/* Section: Asosiy ma'lumotlar */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Asosiy ma&apos;lumotlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Sarlavha *</Label>
            <Input
              placeholder={`${typeLabel} nomi`}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>Tavsif</Label>
            <Textarea
              placeholder={`${typeLabel} haqida...`}
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fan *</Label>
            <Input
              placeholder="Matematika, Fizika..."
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sinf</Label>
            <Select
              value={String(form.grade)}
              onValueChange={(v) => update("grade", parseInt(v ?? "0") || 0)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sinf tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Barcha sinflar</SelectItem>
                {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {g}-sinf
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Til</Label>
            <Select
              value={form.language}
              onValueChange={(v) => update("language", v ?? "uz")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">O&apos;zbek</SelectItem>
                <SelectItem value="ru">Rus</SelectItem>
                <SelectItem value="en">Ingliz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>Qoidalar</Label>
            <Textarea
              placeholder="Imtihon qoidalari..."
              rows={3}
              value={form.rules}
              onChange={(e) => update("rules", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Section: Rasm */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Rasm
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploadField
            label="Banner"
            value={form.banner_url}
            onChange={(url) => update("banner_url", url)}
          />
          <ImageUploadField
            label="Ikon"
            value={form.icon_url}
            onChange={(url) => update("icon_url", url)}
          />
        </div>
      </section>

      {/* Section: Vaqt */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Vaqt
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Ro&apos;yxatdan o&apos;tish boshlanishi</Label>
            <Input
              type="datetime-local"
              value={form.registration_start_time}
              onChange={(e) => update("registration_start_time", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ro&apos;yxatdan o&apos;tish tugashi</Label>
            <Input
              type="datetime-local"
              value={form.registration_end_time}
              onChange={(e) => update("registration_end_time", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Imtihon boshlanishi</Label>
            <Input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Imtihon tugashi</Label>
            <Input
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Section: Imtihon */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Imtihon
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Davomiyligi (daqiqa) *</Label>
            <Input
              type="number"
              min={1}
              value={form.duration_minutes}
              onChange={(e) => update("duration_minutes", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Savollar soni</Label>
            <Input
              type="number"
              min={1}
              value={form.total_questions}
              onChange={(e) => update("total_questions", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Maksimal joylar</Label>
            <Input
              type="number"
              min={0}
              placeholder="0 = cheksiz"
              value={form.max_seats}
              onChange={(e) => update("max_seats", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </section>

      {/* Section: Narx */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Narx
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-foreground">To&apos;lovli {typeLabel.toLowerCase()}</p>
            <p className="text-xs text-muted-foreground">
              Foydalanuvchilar qatnashish uchun to&apos;lov qiladi
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              update("is_paid", !form.is_paid);
              if (form.is_paid) update("price", undefined);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.is_paid ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.is_paid ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {form.is_paid && (
          <div className="space-y-1.5">
            <Label>Narx (UZS) *</Label>
            <Input
              type="number"
              min={0}
              placeholder="10000"
              value={form.price ?? ""}
              onChange={(e) => update("price", e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        )}
      </section>

      {/* Section: Status */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Status
        </h3>
        <div className="max-w-xs space-y-1.5">
          <Label>Holat</Label>
          <Select
            value={form.status}
            onValueChange={(v) => update("status", v ?? "draft")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Qoralama</SelectItem>
              <SelectItem value="published">Nashr qilish</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Section: Sozlamalar */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Sozlamalar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ToggleRow
            label="Savollarni aralashtirish"
            description="Har bir foydalanuvchi uchun savollar tartibi boshqacha"
            checked={form.shuffle_questions}
            onToggle={() => toggleSwitch("shuffle_questions")}
          />
          <ToggleRow
            label="Javoblarni aralashtirish"
            description="Javob variantlari tartibini o'zgartirish"
            checked={form.shuffle_answers}
            onToggle={() => toggleSwitch("shuffle_answers")}
          />
          <ToggleRow
            label="Avtomatik topshirish"
            description="Vaqt tugaganda avtomatik yuboriladi"
            checked={form.auto_submit}
            onToggle={() => toggleSwitch("auto_submit")}
          />
          <ToggleRow
            label="Qayta topshirishga ruxsat"
            description="Foydalanuvchi qayta urinishi mumkin"
            checked={form.allow_retake}
            onToggle={() => toggleSwitch("allow_retake")}
          />
          <ToggleRow
            label="Natijani darhol ko'rsatish"
            description="Imtihon tugagandan so'ng natija ko'rinadi"
            checked={form.show_result_immediately}
            onToggle={() => toggleSwitch("show_result_immediately")}
          />
          <ToggleRow
            label="Sertifikat berish"
            description="Muvaffaqiyatli ishtirokchilarga sertifikat"
            checked={form.give_certificate}
            onToggle={() => toggleSwitch("give_certificate")}
          />
          <ToggleRow
            label="Qo'lda tekshirish"
            description="Natijalar qo'lda tekshiriladi"
            checked={form.manual_review}
            onToggle={() => toggleSwitch("manual_review")}
          />
          <ToggleRow
            label="Admin tasdiqlashi"
            description="Ro'yxatdan o'tish admin tomonidan tasdiqlanadi"
            checked={form.admin_approval}
            onToggle={() => toggleSwitch("admin_approval")}
          />
        </div>
      </section>

      {/* Section: Mock test only */}
      {isMock && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Mock test sozlamalari
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Baholash turi</Label>
              <Select
                value={form.scoring_type}
                onValueChange={(v) => update("scoring_type", v ?? "classic")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Klassik</SelectItem>
                  <SelectItem value="irt">IRT (Item Response Theory)</SelectItem>
                  <SelectItem value="weighted">Vaznli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Masshtablash formulasi</Label>
              <Select
                value={form.scaling_formula_type}
                onValueChange={(v) => update("scaling_formula_type", v ?? "linear")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Chiziqli</SelectItem>
                  <SelectItem value="percentile">Persentil</SelectItem>
                  <SelectItem value="z_score">Z-ball</SelectItem>
                  <SelectItem value="stanine">Stanine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      )}

      {/* Ball tizimi olib tashlandi — baholash mezoni asosida hisoblanadi */}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Bekor qilish
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {initialData ? "Saqlash" : "Yaratish"}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const result = await uploadImage(file);
      onChange(result.url);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Rasm yuklashda xatolik");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt={label}
            className="h-24 w-auto rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* File upload */}
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {/* URL fallback */}
      <Input
        placeholder="yoki URL kiriting: https://..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
