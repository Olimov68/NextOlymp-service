"use client";

import { useState, useEffect, useCallback } from "react";
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
  Trophy, Users, Settings, ClipboardList, BarChart3, Info, DollarSign,
  Calendar, Clock, Globe, BookOpen, Send, SendHorizonal,
  Image as ImageIcon, X, Upload, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOlympiad, updateOlympiad, publishOlympiad, unpublishOlympiad,
  getQuestionsBySource, createQuestion, updateQuestion, deleteQuestion,
  getOlympiadRegistrations, getOlympiadParticipants,
  getOlympiadResults, approveOlympiadResult, uploadImage,
} from "@/lib/superadmin-api";
import {
  getAssessmentDisplayStatus, getStatusBadgeColor, getStatusLabel,
} from "@/lib/assessment-types";
import type { AssessmentBase, AssessmentFormData, AssessmentRegistration, AssessmentResult } from "@/lib/assessment-types";
import { normalizeList } from "@/lib/normalizeList";
import AssessmentForm from "@/components/assessment/AssessmentForm";
import RegistrationsTable from "@/components/assessment/RegistrationsTable";
import ResultsTable from "@/components/assessment/ResultsTable";
import AntiCheatLogsTab from "@/components/assessment/AntiCheatLogsTab";
import { getErrorMessage } from "@/lib/api-error";

// ========== Types ==========

interface Olympiad extends AssessmentBase {}

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

type Tab = "general" | "questions" | "registrations" | "participants" | "results" | "settings" | "logs";

const defaultOptions: (Option & { image_url: string })[] = [
  { label: "A", text: "", is_correct: false, order_num: 0, image_url: "" },
  { label: "B", text: "", is_correct: false, order_num: 1, image_url: "" },
  { label: "C", text: "", is_correct: false, order_num: 2, image_url: "" },
  { label: "D", text: "", is_correct: false, order_num: 3, image_url: "" },
];

const emptyQuestionForm: QuestionForm = {
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

const langLabels: Record<string, string> = { uz: "O'zbek", ru: "Rus", en: "Ingliz" };

function formatDateTime(iso?: string): string {
  if (!iso) return "---";
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "---";
  }
}

// ========== Main Component ==========

export default function OlympiadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("general");
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<number | null>(null);

  // Registrations
  const [registrations, setRegistrations] = useState<AssessmentRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);

  // Participants
  const [participants, setParticipants] = useState<AssessmentRegistration[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Results
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Settings (local editable copy)
  const [settingsForm, setSettingsForm] = useState<Record<string, boolean>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ========== Data fetchers ==========

  const fetchOlympiad = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOlympiad(Number(id));
      const item = data.data || data;
      setOlympiad(item);
      setSettingsForm({
        shuffle_questions: item.shuffle_questions ?? false,
        shuffle_answers: item.shuffle_answers ?? false,
        auto_submit: item.auto_submit ?? true,
        allow_retake: item.allow_retake ?? false,
        show_result_immediately: item.show_result_immediately ?? false,
        give_certificate: item.give_certificate ?? false,
        manual_review: item.manual_review ?? false,
        admin_approval: item.admin_approval ?? false,
      });
    } catch {
      toast.error("Olimpiada yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const data = await getQuestionsBySource({ source_type: "olympiad", source_id: Number(id) });
      setQuestions(normalizeList(data));
    } catch {
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  }, [id]);

  const fetchRegistrations = useCallback(async () => {
    setRegistrationsLoading(true);
    try {
      const data = await getOlympiadRegistrations(Number(id));
      setRegistrations(normalizeList(data));
    } catch {
      setRegistrations([]);
    } finally {
      setRegistrationsLoading(false);
    }
  }, [id]);

  const fetchParticipants = useCallback(async () => {
    setParticipantsLoading(true);
    try {
      const data = await getOlympiadParticipants(Number(id));
      setParticipants(normalizeList(data));
    } catch {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  }, [id]);

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const data = await getOlympiadResults(Number(id));
      setResults(normalizeList(data));
    } catch {
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => { fetchOlympiad(); }, [fetchOlympiad]);

  // Tab-based data loading
  useEffect(() => {
    if (tab === "questions") fetchQuestions();
  }, [tab, fetchQuestions]);

  useEffect(() => {
    if (tab === "registrations") fetchRegistrations();
  }, [tab, fetchRegistrations]);

  useEffect(() => {
    if (tab === "participants") fetchParticipants();
  }, [tab, fetchParticipants]);

  useEffect(() => {
    if (tab === "results") fetchResults();
  }, [tab, fetchResults]);

  // ========== Edit olympiad ==========

  const handleEditSubmit = async (formData: AssessmentFormData) => {
    if (!olympiad) return;
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

    setEditSaving(true);
    try {
      await updateOlympiad(olympiad.id, payload);
      toast.success("Olimpiada yangilandi");
      setEditOpen(false);
      fetchOlympiad();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Xatolik yuz berdi"));
    } finally {
      setEditSaving(false);
    }
  };

  // ========== Publish / Unpublish ==========

  const handlePublish = async () => {
    if (!olympiad) return;
    try {
      await publishOlympiad(olympiad.id);
      toast.success("Olimpiada nashr qilindi");
      fetchOlympiad();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Nashr qilib bo'lmadi");
    }
  };

  const handleUnpublish = async () => {
    if (!olympiad) return;
    try {
      await unpublishOlympiad(olympiad.id);
      toast.success("Olimpiada nashrdan olindi");
      fetchOlympiad();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Nashrdan olib bo'lmadi");
    }
  };

  const handleToggleRegistration = async () => {
    if (!olympiad) return;
    try {
      const { toggleOlympiadRegistration } = await import("@/lib/superadmin-api");
      await toggleOlympiadRegistration(olympiad.id);
      fetchOlympiad();
      toast.success(olympiad.registration_open ? "Ro'yxatdan o'tish yopildi" : "Ro'yxatdan o'tish ochildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  // ========== Questions CRUD ==========

  const openCreateQuestion = () => {
    setEditQuestion(null);
    setQuestionForm({ ...emptyQuestionForm, options: defaultOptions.map(o => ({ ...o })) });
    setQuestionDialogOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditQuestion(q);
    const opts = q.options.length >= 2
      ? q.options.map(o => ({ ...o, image_url: o.image_url || "" }))
      : defaultOptions.map(o => ({ ...o }));
    setQuestionForm({
      text: q.text,
      image_url: q.image_url || "",
      difficulty: q.difficulty || "medium",
      points: String(q.points || 1),
      options: opts,
    });
    setQuestionDialogOpen(true);
  };

  const handleQuestionImageUpload = async (file: File) => {
    setUploadingQuestionImage(true);
    try {
      const res = await uploadImage(file);
      setQuestionForm(f => ({ ...f, image_url: res.url }));
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
      setQuestionForm(f => ({
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
    setQuestionForm(f => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_correct: i === idx })),
    }));
  };

  const setOptionText = (idx: number, text: string) => {
    setQuestionForm(f => ({
      ...f,
      options: f.options.map((o, i) => i === idx ? { ...o, text } : o),
    }));
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.text.trim()) { toast.error("Savol matni majburiy"); return; }
    if (!questionForm.options.some(o => o.is_correct)) { toast.error("Kamida 1 ta to'g'ri javob belgilang"); return; }
    if (questionForm.options.some(o => !o.text.trim())) { toast.error("Barcha variantlar matnini to'ldiring"); return; }
    const points = parseFloat(questionForm.points);
    if (!points || points <= 0) { toast.error("Ball musbat son bo'lishi kerak"); return; }

    setQuestionSaving(true);
    try {
      const payload = {
        source_type: "olympiad",
        source_id: Number(id),
        text: questionForm.text,
        image_url: questionForm.image_url || undefined,
        difficulty: questionForm.difficulty,
        points,
        order_num: editQuestion ? editQuestion.order_num : questions.length,
        options: questionForm.options.map((o, i) => ({
          ...(editQuestion ? { id: o.id } : {}),
          label: o.label,
          text: o.text,
          is_correct: o.is_correct,
          order_num: i,
          image_url: o.image_url || undefined,
        })),
      };

      if (editQuestion) {
        await updateQuestion(editQuestion.id, payload as Record<string, unknown>);
        toast.success("Savol yangilandi");
      } else {
        await createQuestion(payload as Record<string, unknown>);
        toast.success("Savol yaratildi");
      }
      setQuestionDialogOpen(false);
      fetchQuestions();
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "Xatolik yuz berdi");
      console.error("Savol yaratish xatosi:", e);
      toast.error(msg);
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (qid: number) => {
    try {
      await deleteQuestion(qid);
      toast.success("Savol o'chirildi");
      setDeleteQuestionId(null);
      fetchQuestions();
    } catch {
      toast.error("O'chirib bo'lmadi");
    }
  };

  // ========== Results approve ==========

  const handleApproveResult = async (resultId: number) => {
    try {
      await approveOlympiadResult(Number(id), resultId);
      toast.success("Natija tasdiqlandi");
      fetchResults();
    } catch {
      toast.error("Tasdiqlab bo'lmadi");
    }
  };

  // ========== Settings save ==========

  const handleSaveSettings = async () => {
    if (!olympiad) return;
    setSettingsSaving(true);
    try {
      await updateOlympiad(olympiad.id, settingsForm as Record<string, unknown>);
      toast.success("Sozlamalar saqlandi");
      fetchOlympiad();
    } catch {
      toast.error("Sozlamalarni saqlab bo'lmadi");
    } finally {
      setSettingsSaving(false);
    }
  };

  // ========== Tabs config ==========

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "general", label: "Umumiy", icon: <Info className="w-4 h-4" /> },
    { key: "questions", label: "Savollar", icon: <ListChecks className="w-4 h-4" /> },
    { key: "registrations", label: "Ro'yxatdan o'tganlar", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "participants", label: "Ishtirokchilar", icon: <Users className="w-4 h-4" /> },
    { key: "results", label: "Natijalar", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "settings", label: "Sozlamalar", icon: <Settings className="w-4 h-4" /> },
    { key: "logs", label: "Loglar", icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  // ========== Render ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Trophy className="h-12 w-12 mb-4 opacity-30" />
        <p className="font-medium">Olimpiada topilmadi</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/superadmin/olympiads")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
        </Button>
      </div>
    );
  }

  const displayStatus = getAssessmentDisplayStatus(olympiad);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/superadmin/olympiads")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground truncate">{olympiad.title}</h1>
            <Badge className={`text-xs ${getStatusBadgeColor(displayStatus)}`}>
              {getStatusLabel(displayStatus)}
            </Badge>
            {olympiad.is_paid && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs gap-1">
                <DollarSign className="h-3 w-3" />{olympiad.price?.toLocaleString()} UZS
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {olympiad.subject} &bull; {olympiad.grade > 0 ? `${olympiad.grade}-sinf` : "Barcha sinflar"} &bull; {langLabels[olympiad.language] || olympiad.language} &bull; {olympiad.duration_minutes} daqiqa
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {olympiad.status === "draft" && (
            <Button size="sm" onClick={handlePublish} className="gap-2">
              <Send className="h-4 w-4" /> Nashr qilish
            </Button>
          )}
          {olympiad.status === "published" && (
            <Button size="sm" variant="outline" onClick={handleUnpublish} className="gap-2">
              <SendHorizonal className="h-4 w-4" /> Nashrdan olish
            </Button>
          )}
          {(olympiad.status === "published" || olympiad.status === "active") && (
            <Button
              size="sm"
              variant={olympiad.registration_open !== false ? "destructive" : "default"}
              onClick={handleToggleRegistration}
              className="gap-2"
            >
              <ShieldAlert className="h-4 w-4" />
              {olympiad.registration_open !== false ? "Ro'yxatni yopish" : "Ro'yxatni ochish"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="h-4 w-4" /> Tahrirlash
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ========== Tab: Umumiy ========== */}
      {tab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Details Card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Asosiy ma&apos;lumotlar</h3>
            <div className="space-y-3">
              <InfoRow label="Sarlavha" value={olympiad.title} />
              <InfoRow label="Tavsif" value={olympiad.description || "---"} />
              <InfoRow label="Fan" value={olympiad.subject} />
              <InfoRow label="Sinf" value={olympiad.grade > 0 ? `${olympiad.grade}-sinf` : "Barcha sinflar"} />
              <InfoRow label="Til" value={langLabels[olympiad.language] || olympiad.language} />
              <InfoRow label="Slug" value={olympiad.slug || "---"} />
            </div>
          </div>

          {/* Time Card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Vaqt va sozlamalar</h3>
            <div className="space-y-3">
              <InfoRow icon={<Clock className="h-4 w-4" />} label="Davomiyligi" value={`${olympiad.duration_minutes} daqiqa`} />
              <InfoRow icon={<ListChecks className="h-4 w-4" />} label="Savollar soni" value={String(olympiad.total_questions)} />
              <InfoRow icon={<Users className="h-4 w-4" />} label="Maksimal joylar" value={olympiad.max_seats > 0 ? String(olympiad.max_seats) : "Cheksiz"} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Ro'yxat boshlanishi" value={formatDateTime(olympiad.registration_start_time)} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Ro'yxat tugashi" value={formatDateTime(olympiad.registration_end_time)} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Imtihon boshlanishi" value={formatDateTime(olympiad.start_time)} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Imtihon tugashi" value={formatDateTime(olympiad.end_time)} />
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Statistika</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Ro'yxatdan o'tganlar" value={olympiad.registered_count ?? 0} icon={<ClipboardList className="h-5 w-5 text-blue-500" />} />
              <StatCard label="Ishtirokchilar" value={olympiad.participants_count ?? 0} icon={<Users className="h-5 w-5 text-green-500" />} />
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">To&apos;lov</h3>
            <div className="space-y-3">
              <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Turi" value={olympiad.is_paid ? "Pullik" : "Bepul"} />
              {olympiad.is_paid && (
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Narx" value={`${olympiad.price?.toLocaleString()} UZS`} />
              )}
            </div>
            {olympiad.rules && (
              <>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide pt-2">Qoidalar</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{olympiad.rules}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== Tab: Savollar ========== */}
      {tab === "questions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {questions.length} / {olympiad.total_questions} savol
            </p>
            <Button onClick={openCreateQuestion} className="gap-2">
              <Plus className="h-4 w-4" /> Savol qo&apos;shish
            </Button>
          </div>

          {questionsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-muted-foreground">
              <ListChecks className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">Savollar yo&apos;q</p>
              <p className="text-sm mt-1">Olimpiadaga savollar qo&apos;shing</p>
              <Button className="mt-4 gap-2" onClick={openCreateQuestion}>
                <Plus className="h-4 w-4" />Savol qo&apos;shish
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground mb-3">{q.text}</p>
                        {q.image_url && (
                          <img src={q.image_url} alt="Savol rasmi" className="h-20 w-auto rounded-lg border border-border object-contain bg-muted mb-3" />
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map(opt => (
                            <div
                              key={opt.id || opt.label}
                              className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${
                                opt.is_correct ? "border-green-500/30 bg-green-500/5" : "border-border bg-background"
                              }`}
                            >
                              <span className="flex-shrink-0">
                                {opt.is_correct
                                  ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                  : <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />}
                              </span>
                              <span className={`font-medium mr-1 ${opt.is_correct ? "text-green-600" : "text-muted-foreground"}`}>
                                {opt.label}.
                              </span>
                              <div className="flex-1">
                                <span className={opt.is_correct ? "text-foreground font-medium" : "text-muted-foreground"}>
                                  {opt.text}
                                </span>
                                {opt.image_url && (
                                  <img src={opt.image_url} alt={`${opt.label} rasmi`} className="h-10 w-auto rounded border border-border object-contain bg-muted mt-1" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className={`text-xs ${difficultyColors[q.difficulty]}`}>
                            {difficultyLabels[q.difficulty]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{q.points} ball</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEditQuestion(q)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteQuestionId(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== Tab: Ro'yxatdan o'tganlar ========== */}
      {tab === "registrations" && (
        <RegistrationsTable registrations={registrations} loading={registrationsLoading} />
      )}

      {/* ========== Tab: Ishtirokchilar ========== */}
      {tab === "participants" && (
        <RegistrationsTable registrations={participants} loading={participantsLoading} />
      )}

      {/* ========== Tab: Natijalar ========== */}
      {tab === "results" && (
        <ResultsTable
          results={results}
          examType="olympiad"
          onApprove={handleApproveResult}
          loading={resultsLoading}
        />
      )}

      {/* ========== Tab: Sozlamalar ========== */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Imtihon sozlamalari
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SettingToggle
                label="Savollarni aralashtirish"
                description="Har bir foydalanuvchi uchun savollar tartibi boshqacha"
                checked={settingsForm.shuffle_questions ?? false}
                onToggle={() => setSettingsForm(s => ({ ...s, shuffle_questions: !s.shuffle_questions }))}
              />
              <SettingToggle
                label="Javoblarni aralashtirish"
                description="Javob variantlari tartibini o'zgartirish"
                checked={settingsForm.shuffle_answers ?? false}
                onToggle={() => setSettingsForm(s => ({ ...s, shuffle_answers: !s.shuffle_answers }))}
              />
              <SettingToggle
                label="Avtomatik topshirish"
                description="Vaqt tugaganda avtomatik yuboriladi"
                checked={settingsForm.auto_submit ?? true}
                onToggle={() => setSettingsForm(s => ({ ...s, auto_submit: !s.auto_submit }))}
              />
              <SettingToggle
                label="Qayta topshirishga ruxsat"
                description="Foydalanuvchi qayta urinishi mumkin"
                checked={settingsForm.allow_retake ?? false}
                onToggle={() => setSettingsForm(s => ({ ...s, allow_retake: !s.allow_retake }))}
              />
              <SettingToggle
                label="Natijani darhol ko'rsatish"
                description="Imtihon tugagandan so'ng natija ko'rinadi"
                checked={settingsForm.show_result_immediately ?? false}
                onToggle={() => setSettingsForm(s => ({ ...s, show_result_immediately: !s.show_result_immediately }))}
              />
              <SettingToggle
                label="Sertifikat berish"
                description="Muvaffaqiyatli ishtirokchilarga sertifikat"
                checked={settingsForm.give_certificate ?? false}
                onToggle={() => setSettingsForm(s => ({ ...s, give_certificate: !s.give_certificate }))}
              />
              <SettingToggle
                label="Qo'lda tekshirish"
                description="Natijalar qo'lda tekshiriladi"
                checked={settingsForm.manual_review ?? false}
                onToggle={() => setSettingsForm(s => ({ ...s, manual_review: !s.manual_review }))}
              />
              <SettingToggle
                label="Admin tasdiqlashi"
                description="Ro'yxatdan o'tish admin tomonidan tasdiqlanadi"
                checked={settingsForm.admin_approval ?? false}
                onToggle={() => setSettingsForm(s => ({ ...s, admin_approval: !s.admin_approval }))}
              />
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={settingsSaving} className="gap-2">
            {settingsSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </div>
      )}

      {/* ========== Tab: Loglar ========== */}
      {tab === "logs" && (
        <AntiCheatLogsTab sourceType="olympiad" sourceId={Number(id)} />
      )}

      {/* ========== Dialogs ========== */}

      {/* Edit Olympiad Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Olimpiadani tahrirlash</DialogTitle>
          </DialogHeader>
          <AssessmentForm
            examType="olympiad"
            initialData={olympiad}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
            loading={editSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Question Create/Edit Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
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
                value={questionForm.text}
                onChange={e => setQuestionForm(f => ({ ...f, text: e.target.value }))}
              />
            </div>
            {/* Question image upload */}
            <div className="space-y-1.5">
              <Label>Savol rasmi</Label>
              {questionForm.image_url ? (
                <div className="flex items-start gap-2">
                  <img src={questionForm.image_url} alt="Savol rasmi" className="h-20 w-auto rounded-lg border border-border object-contain bg-muted" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setQuestionForm(f => ({ ...f, image_url: "" }))}>
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
                <Select value={questionForm.difficulty} onValueChange={v => setQuestionForm(f => ({ ...f, difficulty: v ?? "medium" }))}>
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
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={questionForm.points}
                  onChange={e => setQuestionForm(f => ({ ...f, points: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Variantlar * (to&apos;g&apos;ri javobni tanlang)</Label>
              {questionForm.options.map((opt, idx) => (
                <div
                  key={opt.label}
                  className={`rounded-xl border p-3 transition-colors ${
                    opt.is_correct ? "border-green-500/30 bg-green-500/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setOptionCorrect(idx)} className="flex-shrink-0">
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
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setQuestionForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, image_url: "" } : o) }))}>
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
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSaveQuestion} disabled={questionSaving}>
              {questionSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editQuestion ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation */}
      <Dialog open={deleteQuestionId !== null} onOpenChange={() => setDeleteQuestionId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Savolni o&apos;chirishni tasdiqlang</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Bu savol o&apos;chirilib bo&apos;lmaydi.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQuestionId(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={() => deleteQuestionId && handleDeleteQuestion(deleteQuestionId)}>
              O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== Helper Components ==========

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SettingToggle({
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
