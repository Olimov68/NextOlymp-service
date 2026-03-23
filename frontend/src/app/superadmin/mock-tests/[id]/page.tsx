"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getMockTest,
  updateMockTest,
  publishMockTest,
  unpublishMockTest,
  duplicateMockTest,
  getMockTestRegistrations,
  getMockTestParticipants,
  getMockTestResults,
  approveMockTestResult,
  getQuestionsBySource,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadImage,
} from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
import RegistrationsTable from "@/components/assessment/RegistrationsTable";
import ResultsTable from "@/components/assessment/ResultsTable";
import AntiCheatLogsTab from "@/components/assessment/AntiCheatLogsTab";
import type { AssessmentRegistration, AssessmentResult } from "@/lib/assessment-types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ListChecks,
  CheckCircle2,
  Circle,
  Globe,
  GlobeLock,
  Copy,
  Save,
  ClipboardList,
  Users,
  UserCheck,
  Trophy,
  Settings,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  X,
  Upload,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type Tab = "general" | "questions" | "registrations" | "participants" | "results" | "settings" | "logs";

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

const emptyQuestionForm: QuestionForm = {
  text: "",
  image_url: "",
  difficulty: "medium",
  points: "1",
  options: defaultOptions.map((o) => ({ ...o })),
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

const languages = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Ruscha" },
  { value: "en", label: "Inglizcha" },
];

const scoringTypes = [
  { value: "simple", label: "Oddiy" },
  { value: "rasch", label: "Rasch" },
];

const statusOptions = [
  { value: "draft", label: "Qoralama" },
  { value: "active", label: "Faol" },
  { value: "archived", label: "Arxivlangan" },
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-600",
  active: "bg-green-600",
  archived: "bg-yellow-600",
};

const subjectLabels: Record<string, string> = Object.fromEntries(
  subjects.map((s) => [s.value, s.label])
);

const grades = [
  { value: "0", label: "Belgilanmagan" },
  { value: "5", label: "5-sinf" },
  { value: "6", label: "6-sinf" },
  { value: "7", label: "7-sinf" },
  { value: "8", label: "8-sinf" },
  { value: "9", label: "9-sinf" },
  { value: "10", label: "10-sinf" },
  { value: "11", label: "11-sinf" },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MockTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const mockTestId = Number(id);

  const [tab, setTab] = useState<Tab>("general");
  const [mockTest, setMockTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  /* --- General tab (edit form) --- */
  const [generalForm, setGeneralForm] = useState<Record<string, any>>({});
  const [generalSaving, setGeneralSaving] = useState(false);

  /* --- Questions tab --- */
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [questionDeleteId, setQuestionDeleteId] = useState<number | null>(null);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<number | null>(null);

  /* --- Registrations tab --- */
  const [registrations, setRegistrations] = useState<AssessmentRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);

  /* --- Participants tab --- */
  const [participants, setParticipants] = useState<AssessmentRegistration[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  /* --- Results tab --- */
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  /* --- Settings tab --- */
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  /* ================================================================ */
  /* Loaders                                                          */
  /* ================================================================ */

  const loadMockTest = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMockTest(mockTestId);
      const mt = data?.data || data;
      setMockTest(mt);
      setGeneralForm({
        title: mt.title || "",
        description: mt.description || "",
        subject: mt.subject || "matematika",
        grade: mt.grade || 0,
        language: mt.language || "uz",
        scoring_type: mt.scoring_type || "simple",
        is_paid: mt.is_paid ?? false,
        price: mt.price || 0,
        duration_minutes: mt.duration_minutes || 60,
        total_questions: mt.total_questions || 30,
        status: mt.status || "draft",
      });
      setSettingsForm({
        shuffle_questions: mt.shuffle_questions ?? false,
        shuffle_answers: mt.shuffle_answers ?? false,
        auto_submit: mt.auto_submit ?? true,
        allow_retake: mt.allow_retake ?? false,
        show_result_immediately: mt.show_result_immediately ?? true,
        give_certificate: mt.give_certificate ?? false,
        manual_review: mt.manual_review ?? false,
        admin_approval: mt.admin_approval ?? false,
        max_seats: mt.max_seats || 0,
        start_time: mt.start_time || "",
        end_time: mt.end_time || "",
        registration_start_time: mt.registration_start_time || "",
        registration_end_time: mt.registration_end_time || "",
      });
    } catch {
      toast.error("Mock test yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [mockTestId]);

  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const data = await getQuestionsBySource({
        source_type: "mock_test",
        source_id: mockTestId,
      });
      setQuestions(normalizeList(data));
    } catch {
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  }, [mockTestId]);

  const loadRegistrations = useCallback(async () => {
    setRegistrationsLoading(true);
    try {
      const data = await getMockTestRegistrations(mockTestId);
      setRegistrations(normalizeList(data));
    } catch {
      setRegistrations([]);
    } finally {
      setRegistrationsLoading(false);
    }
  }, [mockTestId]);

  const loadParticipants = useCallback(async () => {
    setParticipantsLoading(true);
    try {
      const data = await getMockTestParticipants(mockTestId);
      setParticipants(normalizeList(data));
    } catch {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  }, [mockTestId]);

  const loadResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const data = await getMockTestResults(mockTestId);
      setResults(normalizeList(data));
    } catch {
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, [mockTestId]);

  /* Initial load */
  useEffect(() => {
    loadMockTest();
  }, [loadMockTest]);

  /* Tab-based lazy loading */
  useEffect(() => {
    if (tab === "questions") loadQuestions();
    else if (tab === "registrations") loadRegistrations();
    else if (tab === "participants") loadParticipants();
    else if (tab === "results") loadResults();
  }, [tab, loadQuestions, loadRegistrations, loadParticipants, loadResults]);

  /* ================================================================ */
  /* Actions                                                          */
  /* ================================================================ */

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await publishMockTest(mockTestId);
      toast.success("Mock test e'lon qilindi");
      await loadMockTest();
    } catch {
      toast.error("E'lon qilib bo'lmadi");
    }
    setActionLoading(false);
  };

  const handleUnpublish = async () => {
    setActionLoading(true);
    try {
      await unpublishMockTest(mockTestId);
      toast.success("Mock test e'londan olindi");
      await loadMockTest();
    } catch {
      toast.error("E'londan olib bo'lmadi");
    }
    setActionLoading(false);
  };

  const handleDuplicate = async () => {
    setActionLoading(true);
    try {
      await duplicateMockTest(mockTestId);
      toast.success("Mock test nusxalandi");
      router.push("/superadmin/mock-tests");
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
    setActionLoading(false);
  };

  /* General save */
  const handleSaveGeneral = async () => {
    setGeneralSaving(true);
    try {
      await updateMockTest(mockTestId, {
        ...generalForm,
        grade: Number(generalForm.grade) || 0,
        price: generalForm.is_paid ? Number(generalForm.price) : 0,
        duration_minutes: Number(generalForm.duration_minutes),
        total_questions: Number(generalForm.total_questions),
      });
      toast.success("Mock test yangilandi");
      await loadMockTest();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setGeneralSaving(false);
    }
  };

  /* Settings save */
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await updateMockTest(mockTestId, {
        ...settingsForm,
        max_seats: Number(settingsForm.max_seats) || 0,
        start_time: settingsForm.start_time || null,
        end_time: settingsForm.end_time || null,
        registration_start_time: settingsForm.registration_start_time || null,
        registration_end_time: settingsForm.registration_end_time || null,
      });
      toast.success("Sozlamalar saqlandi");
      await loadMockTest();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setSettingsSaving(false);
    }
  };

  /* Approve result */
  const handleApproveResult = async (resultId: number) => {
    try {
      await approveMockTestResult(mockTestId, resultId);
      toast.success("Natija tasdiqlandi");
      await loadResults();
    } catch {
      toast.error("Tasdiqlab bo'lmadi");
    }
  };

  /* ================================================================ */
  /* Question CRUD                                                     */
  /* ================================================================ */

  const openCreateQuestion = () => {
    setEditQuestion(null);
    setQuestionForm({
      ...emptyQuestionForm,
      options: defaultOptions.map((o) => ({ ...o })),
    });
    setQuestionDialogOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditQuestion(q);
    const opts =
      q.options.length >= 2
        ? q.options.map((o) => ({ ...o, image_url: o.image_url || "" }))
        : defaultOptions.map((o) => ({ ...o }));
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
      setQuestionForm((f) => ({ ...f, image_url: res.url }));
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
      setQuestionForm((f) => ({
        ...f,
        options: f.options.map((o, i) => (i === idx ? { ...o, image_url: res.url } : o)),
      }));
    } catch {
      toast.error("Rasm yuklanmadi");
    } finally {
      setUploadingOptionImage(null);
    }
  };

  const setOptionCorrect = (idx: number) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_correct: i === idx })),
    }));
  };

  const setOptionText = (idx: number, text: string) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === idx ? { ...o, text } : o)),
    }));
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.text.trim()) {
      toast.error("Savol matni majburiy");
      return;
    }
    const hasCorrect = questionForm.options.some((o) => o.is_correct);
    if (!hasCorrect) {
      toast.error("Kamida 1 ta to'g'ri javob belgilang");
      return;
    }
    const emptyOpts = questionForm.options.filter((o) => !o.text.trim());
    if (emptyOpts.length > 0) {
      toast.error("Barcha variantlar matnini to'ldiring");
      return;
    }
    const points = parseFloat(questionForm.points);
    if (!points || points <= 0) {
      toast.error("Ball musbat son bo'lishi kerak");
      return;
    }

    setQuestionSaving(true);
    try {
      const payload = {
        source_type: "mock_test",
        source_id: mockTestId,
        text: questionForm.text,
        image_url: questionForm.image_url || undefined,
        difficulty: questionForm.difficulty,
        points,
        order_num: editQuestion ? editQuestion.order_num : questions.length,
        options: questionForm.options.map((o, i) => ({
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
          options: questionForm.options.map((o, i) => ({
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
      setQuestionDialogOpen(false);
      loadQuestions();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Xatolik yuz berdi";
      console.error("Savol yaratish xatosi:", e?.response?.data || e);
      toast.error(msg);
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (qid: number) => {
    try {
      await deleteQuestion(qid);
      toast.success("Savol o'chirildi");
      setQuestionDeleteId(null);
      loadQuestions();
    } catch {
      toast.error("O'chirib bo'lmadi");
    }
  };

  /* ================================================================ */
  /* Tabs config                                                       */
  /* ================================================================ */

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "general", label: "Umumiy", icon: <FileText className="w-4 h-4" /> },
    { key: "questions", label: "Savollar", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "registrations", label: "Ro'yxatdan o'tganlar", icon: <Users className="w-4 h-4" /> },
    { key: "participants", label: "Ishtirokchilar", icon: <UserCheck className="w-4 h-4" /> },
    { key: "results", label: "Natijalar", icon: <Trophy className="w-4 h-4" /> },
    { key: "settings", label: "Sozlamalar", icon: <Settings className="w-4 h-4" /> },
    { key: "logs", label: "Loglar", icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mockTest) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Mock test topilmadi
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/superadmin/mock-tests")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Mock test</p>
          <h1 className="text-2xl font-bold text-foreground">
            {mockTest.title || subjectLabels[mockTest.subject] || `Mock test #${mockTest.id}`}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={statusColors[mockTest.status] || "bg-gray-600"}>
              {statusOptions.find((s) => s.value === mockTest.status)?.label || mockTest.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {subjectLabels[mockTest.subject] || mockTest.subject}
              {mockTest.grade ? ` | ${mockTest.grade}-sinf` : ""}
              {" | "}
              {mockTest.duration_minutes} daqiqa
              {" | "}
              {mockTest.total_questions} savol
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mockTest.status === "draft" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublish}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              E&apos;lon qilish
            </Button>
          ) : mockTest.status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GlobeLock className="w-4 h-4" />}
              E&apos;londan olish
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={actionLoading}
            className="gap-2"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Nusxalash
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
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* Umumiy (General) Tab                                         */}
      {/* ============================================================ */}
      {tab === "general" && (
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Fan</Label>
              <Select
                value={generalForm.subject}
                onValueChange={(v) => setGeneralForm({ ...generalForm, subject: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Sarlavha</Label>
              <Input
                value={generalForm.title || ""}
                onChange={(e) => setGeneralForm({ ...generalForm, title: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Textarea
                value={generalForm.description || ""}
                onChange={(e) => setGeneralForm({ ...generalForm, description: e.target.value })}
                className="bg-muted border-border min-h-[80px]"
              />
            </div>

            {/* Grade & Language */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sinf</Label>
                <Select
                  value={String(generalForm.grade || 0)}
                  onValueChange={(v) => setGeneralForm({ ...generalForm, grade: Number(v) || 0 })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Til</Label>
                <Select
                  value={generalForm.language}
                  onValueChange={(v) => setGeneralForm({ ...generalForm, language: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scoring type & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Baholash turi</Label>
                <Select
                  value={generalForm.scoring_type}
                  onValueChange={(v) => setGeneralForm({ ...generalForm, scoring_type: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scoringTypes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={generalForm.status}
                  onValueChange={(v) => setGeneralForm({ ...generalForm, status: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Paid & Price */}
            <div className="space-y-1.5">
              <Label>Ishtirok turi</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!generalForm.is_paid}
                    onChange={() => setGeneralForm({ ...generalForm, is_paid: false, price: 0 })}
                  />
                  <span className="text-sm">Bepul</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={generalForm.is_paid}
                    onChange={() => setGeneralForm({ ...generalForm, is_paid: true })}
                  />
                  <span className="text-sm">Pullik</span>
                </label>
              </div>
            </div>

            {generalForm.is_paid && (
              <div className="space-y-1.5">
                <Label>Narxi (so&apos;m)</Label>
                <Input
                  type="number"
                  value={generalForm.price || 0}
                  onChange={(e) => setGeneralForm({ ...generalForm, price: Number(e.target.value) })}
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
                  value={generalForm.duration_minutes || 60}
                  onChange={(e) => setGeneralForm({ ...generalForm, duration_minutes: Number(e.target.value) })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Savollar soni</Label>
                <Input
                  type="number"
                  value={generalForm.total_questions || 30}
                  onChange={(e) => setGeneralForm({ ...generalForm, total_questions: Number(e.target.value) })}
                  className="bg-muted border-border"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveGeneral}
            disabled={generalSaving}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            {generalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Saqlash
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/* Savollar (Questions) Tab                                      */}
      {/* ============================================================ */}
      {tab === "questions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {questions.length} / {mockTest.total_questions} savol
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
              <p className="text-sm mt-1">Mock testga savollar qo&apos;shing</p>
              <Button className="mt-4 gap-2" onClick={openCreateQuestion}>
                <Plus className="h-4 w-4" /> Savol qo&apos;shish
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
                          {q.options.map((opt) => (
                            <div
                              key={opt.id || opt.label}
                              className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${
                                opt.is_correct
                                  ? "border-green-500/30 bg-green-500/5"
                                  : "border-border bg-background"
                              }`}
                            >
                              <span className="flex-shrink-0">
                                {opt.is_correct ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                )}
                              </span>
                              <span
                                className={`font-medium mr-1 ${
                                  opt.is_correct ? "text-green-600" : "text-muted-foreground"
                                }`}
                              >
                                {opt.label}.
                              </span>
                              <div className="flex-1">
                                <span
                                  className={
                                    opt.is_correct ? "text-foreground font-medium" : "text-muted-foreground"
                                  }
                                >
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
                          <Badge
                            variant="outline"
                            className={`text-xs ${difficultyColors[q.difficulty]}`}
                          >
                            {difficultyLabels[q.difficulty] || q.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {q.points} ball
                          </Badge>
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
                        onClick={() => setQuestionDeleteId(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Question Create / Edit Dialog */}
          <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editQuestion ? "Savolni tahrirlash" : "Yangi savol"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Savol matni *</Label>
                  <Textarea
                    placeholder="Savol matnini kiriting..."
                    rows={3}
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, text: e.target.value }))}
                  />
                </div>
                {/* Question image upload */}
                <div className="space-y-1.5">
                  <Label>Savol rasmi</Label>
                  {questionForm.image_url ? (
                    <div className="flex items-start gap-2">
                      <img src={questionForm.image_url} alt="Savol rasmi" className="h-20 w-auto rounded-lg border border-border object-contain bg-muted" />
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setQuestionForm((f) => ({ ...f, image_url: "" }))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border bg-muted/50 hover:bg-muted cursor-pointer transition-colors text-sm text-muted-foreground">
                        {uploadingQuestionImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Rasm yuklash
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingQuestionImage} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQuestionImageUpload(f); e.target.value = ""; }} />
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Qiyinlik darajasi</Label>
                    <Select
                      value={questionForm.difficulty}
                      onValueChange={(v) => setQuestionForm((f) => ({ ...f, difficulty: v ?? "medium" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                      onChange={(e) => setQuestionForm((f) => ({ ...f, points: e.target.value }))}
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
                          {opt.is_correct ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>
                        <span className="font-bold text-sm w-5 text-muted-foreground flex-shrink-0">
                          {opt.label}.
                        </span>
                        <Input
                          placeholder={`${opt.label} varianti...`}
                          value={opt.text}
                          onChange={(e) => setOptionText(idx, e.target.value)}
                          className="flex-1"
                        />
                        <label className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-muted/50 hover:bg-muted cursor-pointer transition-colors flex-shrink-0" title="Rasm yuklash">
                          {uploadingOptionImage === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingOptionImage === idx} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOptionImageUpload(idx, f); e.target.value = ""; }} />
                        </label>
                      </div>
                      {opt.image_url && (
                        <div className="flex items-start gap-2 mt-2 ml-11">
                          <img src={opt.image_url} alt={`${opt.label} rasmi`} className="h-14 w-auto rounded border border-border object-contain bg-muted" />
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setQuestionForm((f) => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, image_url: "" } : o) }))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Doirani bosib to&apos;g&apos;ri javobni belgilang
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleSaveQuestion} disabled={questionSaving}>
                  {questionSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editQuestion ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Question Delete Confirmation */}
          <Dialog open={questionDeleteId !== null} onOpenChange={() => setQuestionDeleteId(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Savolni o&apos;chirishni tasdiqlang</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Bu savol o&apos;chirilib bo&apos;lmaydi.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuestionDeleteId(null)}>
                  Bekor qilish
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => questionDeleteId && handleDeleteQuestion(questionDeleteId)}
                >
                  O&apos;chirish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ============================================================ */}
      {/* Ro'yxatdan o'tganlar (Registrations) Tab                      */}
      {/* ============================================================ */}
      {tab === "registrations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Jami: {registrations.length} ta ro&apos;yxatdan o&apos;tgan
            </p>
            <Button variant="outline" size="sm" onClick={loadRegistrations} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Yangilash
            </Button>
          </div>
          <RegistrationsTable
            registrations={registrations}
            loading={registrationsLoading}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* Ishtirokchilar (Participants) Tab                             */}
      {/* ============================================================ */}
      {tab === "participants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Jami: {participants.length} ta ishtirokchi
            </p>
            <Button variant="outline" size="sm" onClick={loadParticipants} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Yangilash
            </Button>
          </div>
          <RegistrationsTable
            registrations={participants}
            loading={participantsLoading}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* Natijalar (Results) Tab                                       */}
      {/* ============================================================ */}
      {tab === "results" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Jami: {results.length} ta natija
            </p>
            <Button variant="outline" size="sm" onClick={loadResults} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Yangilash
            </Button>
          </div>
          <ResultsTable
            results={results}
            examType="mock_test"
            onApprove={handleApproveResult}
            loading={resultsLoading}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* Sozlamalar (Settings) Tab                                     */}
      {/* ============================================================ */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {/* Time settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Vaqt sozlamalari</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ro&apos;yxatdan o&apos;tish boshlanishi</Label>
                <Input
                  type="datetime-local"
                  value={settingsForm.registration_start_time?.slice(0, 16) || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_start_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ro&apos;yxatdan o&apos;tish tugashi</Label>
                <Input
                  type="datetime-local"
                  value={settingsForm.registration_end_time?.slice(0, 16) || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_end_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Test boshlanishi</Label>
                <Input
                  type="datetime-local"
                  value={settingsForm.start_time?.slice(0, 16) || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, start_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Test tugashi</Label>
                <Input
                  type="datetime-local"
                  value={settingsForm.end_time?.slice(0, 16) || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, end_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Maksimal o&apos;rinlar soni (0 = cheksiz)</Label>
              <Input
                type="number"
                value={settingsForm.max_seats || 0}
                onChange={(e) => setSettingsForm({ ...settingsForm, max_seats: Number(e.target.value) })}
                className="bg-muted border-border max-w-[200px]"
              />
            </div>
          </div>

          {/* Toggle settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Test sozlamalari</h3>
            {[
              { key: "shuffle_questions", label: "Savollarni aralashtirish", desc: "Har bir foydalanuvchiga savollar tasodifiy tartibda" },
              { key: "shuffle_answers", label: "Javoblarni aralashtirish", desc: "Variant javoblarini tasodifiy tartibda ko'rsatish" },
              { key: "auto_submit", label: "Avtomatik topshirish", desc: "Vaqt tugaganda testni avtomatik topshirish" },
              { key: "allow_retake", label: "Qayta topshirishga ruxsat", desc: "Foydalanuvchi testni qayta topshirishi mumkin" },
              { key: "show_result_immediately", label: "Natijani darhol ko'rsatish", desc: "Topshirgandan so'ng natijani ko'rsatish" },
              { key: "give_certificate", label: "Sertifikat berish", desc: "Muvaffaqiyatli topshirganlarga sertifikat" },
              { key: "manual_review", label: "Qo'lda tekshirish", desc: "Javoblarni admin qo'lda tekshirishi" },
              { key: "admin_approval", label: "Admin tasdiqlashi", desc: "Natijalarni admin tasdiqlashi kerak" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label>{item.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => setSettingsForm({ ...settingsForm, [item.key]: !settingsForm[item.key] })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settingsForm[item.key] ? "bg-orange-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      settingsForm[item.key] ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Sozlamalarni saqlash
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/* Loglar (Anti-cheat) Tab                                       */}
      {/* ============================================================ */}
      {tab === "logs" && (
        <AntiCheatLogsTab sourceType="mock_test" sourceId={Number(id)} />
      )}
    </div>
  );
}
