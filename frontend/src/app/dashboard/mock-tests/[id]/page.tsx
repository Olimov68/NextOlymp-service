"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  FileText,
  BookOpen,
  Trophy,
  AlertCircle,
  Play,
  CheckCircle2,
  XCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Timer,
  Wallet,
  Shield,
  Target,
  MinusCircle,
  Maximize,
  Minimize,
  Sparkles,
  Brain,
  TrendingUp,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  getMockTest,
  joinMockTest,
  startMockTest,
  getMyMockAttempts,
  getMockAttemptResult,
  submitMockAnswer,
  finishMockTest,
  getBalance,
  type MockAttempt,
  type AttemptResult,
  type ExamStartResponse,
  type ExamQuestion,
} from "@/lib/user-api";
import type { MockExam } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = "detail" | "exam" | "result";

interface AnswerMap {
  [questionId: number]: number | null;
}

// ─── Helper: format seconds to mm:ss ────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-5 w-20" />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <Skeleton className="h-8 w-2/3 mb-2" />
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-20 w-full mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MockTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  // Phase state
  const [phase, setPhase] = useState<Phase>("detail");

  // Detail state
  const [mockTest, setMockTest] = useState<MockExam | null>(null);
  const [attempts, setAttempts] = useState<MockAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [starting, setStarting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Exam state
  const [examData, setExamData] = useState<ExamStartResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const examContainerRef = useRef<HTMLDivElement>(null);

  // Result state
  const [result, setResult] = useState<AttemptResult | null>(null);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<import("@/lib/user-api").AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  // ─── Load detail data ───────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    Promise.allSettled([getMockTest(id), getMyMockAttempts(id)])
      .then(([testRes, attemptsRes]) => {
        if (testRes.status === "fulfilled") {
          setMockTest(testRes.value);
          if (
            (testRes.value as any).is_joined ||
            (testRes.value as any).joined
          ) {
            setJoined(true);
          }
        }
        if (attemptsRes.status === "fulfilled") {
          const attData = Array.isArray(attemptsRes.value)
            ? attemptsRes.value
            : [];
          setAttempts(attData);
          if (attData.length > 0) setJoined(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Load balance if test is paid
  useEffect(() => {
    if (mockTest && mockTest.price > 0 && !joined) {
      getBalance()
        .then((b) => setBalance(b.balance))
        .catch(() => setBalance(null));
    }
  }, [mockTest, joined]);

  // ─── Timer ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "exam" || !examData) return;

    const startedMs = new Date(examData.started_at).getTime();
    const durationMs = examData.duration_minutes * 60 * 1000;
    const endMs = startedMs + durationMs;

    const updateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handleAutoFinish();
      }
    };

    updateTime();
    timerRef.current = setInterval(updateTime, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, examData]);

  // ─── Fullscreen ─────────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = examContainerRef.current || document.documentElement;
      el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Enter fullscreen when exam starts
  useEffect(() => {
    if (phase === "exam") {
      const el = examContainerRef.current || document.documentElement;
      el.requestFullscreen?.().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [phase]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinMockTest(id);
      setJoined(true);
      toast.success("Testga muvaffaqiyatli ro'yxatdan o'tdingiz!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Ro'yxatdan o'tishda xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const data = await startMockTest(id);
      setExamData(data);
      setAnswers({});
      setCurrentIdx(0);
      setPhase("exam");
      toast.success("Test boshlandi! Omad tilaymiz!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Testni boshlashda xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  const handleSelectOption = async (questionId: number, optionId: number) => {
    if (!examData) return;

    const currentAnswer = answers[questionId];
    const isDeselect = currentAnswer === optionId;

    const newAnswers = { ...answers };
    if (isDeselect) {
      newAnswers[questionId] = null;
    } else {
      newAnswers[questionId] = optionId;
    }
    setAnswers(newAnswers);

    try {
      await submitMockAnswer(examData.attempt_id, {
        question_id: questionId,
        option_id: isDeselect ? null : optionId,
      });
    } catch {
      toast.error("Javobni saqlashda xatolik");
    }
  };

  const handleAutoFinish = useCallback(async () => {
    if (!examData || finishing) return;
    setFinishing(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await finishMockTest(examData.attempt_id);
      const resultData = await getMockAttemptResult(examData.attempt_id);
      setResult(resultData);
      setPhase("result");
      toast.info("Vaqt tugadi! Test yakunlandi.");
    } catch (err: any) {
      toast.error("Testni yakunlashda xatolik");
      try {
        const resultData = await getMockAttemptResult(examData.attempt_id);
        setResult(resultData);
        setPhase("result");
      } catch {
        setPhase("detail");
        const newAttempts = await getMyMockAttempts(id);
        setAttempts(Array.isArray(newAttempts) ? newAttempts : []);
      }
    } finally {
      setFinishing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, finishing, id]);

  const handleFinish = async () => {
    if (!examData) return;
    setShowFinishDialog(false);
    setFinishing(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await finishMockTest(examData.attempt_id);
      const resultData = await getMockAttemptResult(examData.attempt_id);
      setResult(resultData);
      setPhase("result");
      toast.success("Test muvaffaqiyatli yakunlandi!");
    } catch (err: any) {
      toast.error("Testni yakunlashda xatolik");
      try {
        const resultData = await getMockAttemptResult(examData.attempt_id);
        setResult(resultData);
        setPhase("result");
      } catch {
        setPhase("detail");
        const newAttempts = await getMyMockAttempts(id);
        setAttempts(Array.isArray(newAttempts) ? newAttempts : []);
      }
    } finally {
      setFinishing(false);
    }
  };

  const handleBackToDetail = async () => {
    setPhase("detail");
    setExamData(null);
    setResult(null);
    setAnswers({});
    setCurrentIdx(0);
    setAiAnalysis(null);
    setShowAiAnalysis(false);
    setAiError("");

    try {
      const newAttempts = await getMyMockAttempts(id);
      setAttempts(Array.isArray(newAttempts) ? newAttempts : []);
    } catch {
      // silent
    }
  };

  const handleAIAnalysis = async () => {
    if (aiAnalysis) {
      setShowAiAnalysis(!showAiAnalysis);
      return;
    }
    if (!result) return;
    setAiLoading(true);
    setAiError("");
    try {
      const { getAIAnalysis } = await import("@/lib/user-api");
      const data = await getAIAnalysis(result.attempt_id);
      setAiAnalysis(data);
      setShowAiAnalysis(true);
    } catch (err: any) {
      setAiError(err?.response?.data?.message || "AI tahlil yuklanmadi");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) return <DetailSkeleton />;

  if (!mockTest) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Mock test topilmadi</p>
        <Link
          href="/dashboard/mock-tests"
          className="text-blue-600 text-sm mt-2 inline-block hover:underline"
        >
          Ortga qaytish
        </Link>
      </div>
    );
  }

  // ─── Phase: Exam (Fullscreen) ──────────────────────────────────────────

  if (phase === "exam" && examData) {
    const questions = examData.questions;
    const currentQ = questions[currentIdx];
    const answeredCount = Object.values(answers).filter(
      (v) => v !== null && v !== undefined
    ).length;
    const unansweredCount = questions.length - answeredCount;
    const isTimeLow = timeLeft <= 60;

    return (
      <div
        ref={examContainerRef}
        className="fixed inset-0 z-[100] bg-background flex flex-col"
      >
        {/* Top bar: Timer + Title + Controls */}
        <div className="flex-shrink-0 bg-background border-b border-border px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {mockTest.title}
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-sm text-muted-foreground hidden sm:block">
                <span className="font-medium text-foreground">{answeredCount}</span>
                /{questions.length} javob
              </div>
              <div
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                  isTimeLow
                    ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 animate-pulse"
                    : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                }`}
              >
                <Timer className="h-5 w-5" />
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title={isFullscreen ? "Kichiklashtirish" : "Kattalashtirish"}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Maximize className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Question area - takes most space */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1"
                >
                  Savol {currentIdx + 1} / {questions.length}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {currentQ.points} ball
                </Badge>
              </div>

              {currentQ.title && (
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {currentQ.title}
                </h3>
              )}

              {currentQ.content && (
                <div
                  className="text-base text-foreground leading-relaxed mb-8 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: currentQ.content }}
                />
              )}

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options
                  .sort((a, b) => a.order_num - b.order_num)
                  .map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt.id}
                        onClick={() =>
                          handleSelectOption(currentQ.id, opt.id)
                        }
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm"
                            : "border-border hover:border-blue-200 dark:hover:border-blue-800 hover:bg-accent/50"
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {letter}
                        </div>
                        <span
                          className={`text-base pt-1 ${
                            isSelected
                              ? "text-blue-900 dark:text-blue-100 font-medium"
                              : "text-foreground"
                          }`}
                        >
                          {opt.content}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Oldingi
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowFinishDialog(true)}
                  disabled={finishing}
                  className="px-6"
                >
                  Yakunlash
                </Button>

                <Button
                  variant="outline"
                  disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                >
                  Keyingi
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right sidebar: Question tracker */}
          <div className="w-64 flex-shrink-0 border-l border-border bg-muted/30 overflow-y-auto p-4 hidden md:block">
            <p className="text-sm font-semibold text-foreground mb-4">
              Savollar
            </p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered =
                  answers[q.id] !== null && answers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white ring-2 ring-blue-300 shadow-md"
                        : isAnswered
                        ? "bg-green-500 text-white shadow-sm"
                        : "bg-white dark:bg-background text-muted-foreground border border-border hover:bg-accent"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-500" />
                <span className="text-foreground">Javob berilgan ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-white dark:bg-background border border-border" />
                <span className="text-foreground">Javobsiz ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-blue-600" />
                <span className="text-foreground">Joriy savol</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {answeredCount}/{questions.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Yechilgan savollar</p>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom bar for question numbers */}
        <div className="md:hidden flex-shrink-0 border-t border-border bg-background px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {questions.map((q, idx) => {
              const isAnswered =
                answers[q.id] !== null && answers[q.id] !== undefined;
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold flex-shrink-0 transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : isAnswered
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Finish Confirmation Dialog */}
        <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Testni yakunlash</DialogTitle>
              <DialogDescription>
                Haqiqatan ham testni yakunlamoqchimisiz?
              </DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Javob berilgan: {answeredCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Javobsiz: {unansweredCount}</span>
                </div>
              </div>
              {unansweredCount > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">
                  Diqqat: {unansweredCount} ta savolga hali javob bermadingiz!
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowFinishDialog(false)}
              >
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={handleFinish}
                disabled={finishing}
              >
                {finishing ? "Yakunlanmoqda..." : "Ha, yakunlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Phase: Result ────────────────────────────────────────────────────

  if (phase === "result" && result) {
    const percentage = result.percentage ?? 0;
    const isPassed = result.status === "passed";
    const totalQuestions = result.answers?.length ?? 0;
    const correctCount = result.answers?.filter((a) => a.is_correct).length ?? 0;
    const wrongCount = result.answers?.filter(
      (a) => !a.is_correct && a.selected_option_id
    ).length ?? 0;
    const skippedCount = totalQuestions - correctCount - wrongCount;

    let timeTakenStr = "\u2014";
    if (result.started_at && result.finished_at) {
      const startMs = new Date(result.started_at).getTime();
      const endMs = new Date(result.finished_at).getTime();
      const diffS = Math.floor((endMs - startMs) / 1000);
      const mins = Math.floor(diffS / 60);
      const secs = diffS % 60;
      timeTakenStr = `${mins} daqiqa ${secs} soniya`;
    }

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/dashboard/mock-tests"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Mock testlar
        </Link>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              {mockTest.title}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Test natijalari
            </p>

            {/* Progress ring */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  className="transform -rotate-90"
                >
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-muted/30"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-1000 ${
                      isPassed ? "text-green-500" : "text-red-500"
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">
                    {Math.round(percentage)}%
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isPassed ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPassed ? "O'tdi" : "O'tmadi"}
                  </span>
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="text-center mb-6">
              <p className="text-2xl font-bold text-foreground">
                {result.score} / {result.max_score}
              </p>
              <p className="text-sm text-muted-foreground">Umumiy ball</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {correctCount}
                </p>
                <p className="text-xs text-green-600/70">To&apos;g&apos;ri</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 text-center">
                <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-700 dark:text-red-400">
                  {wrongCount}
                </p>
                <p className="text-xs text-red-600/70">Noto&apos;g&apos;ri</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 text-center">
                <MinusCircle className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {skippedCount}
                </p>
                <p className="text-xs text-gray-500">Javobsiz</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  {timeTakenStr}
                </p>
                <p className="text-xs text-blue-600/70">Sarflangan vaqt</p>
              </div>
            </div>

            {/* Pass/Fail badge */}
            <div className="flex justify-center mb-6">
              <Badge
                className={`text-base px-6 py-2 border-0 ${
                  isPassed
                    ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                }`}
              >
                {isPassed ? (
                  <>
                    <Trophy className="h-4 w-4 mr-2" /> Tabriklaymiz!
                    O&apos;tdingiz!
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" /> Qayta urinib
                    ko&apos;ring
                  </>
                )}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleBackToDetail}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ortga qaytish
              </Button>
              <Link href="/dashboard/mock-tests">
                <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                  Mock testlar ro&apos;yxatiga
                </Button>
              </Link>
            </div>

            {/* AI Tahlil */}
            <div className="mt-6">
              <button
                onClick={handleAIAnalysis}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 text-foreground font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    AI tahlil qilinmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    {aiAnalysis ? (showAiAnalysis ? "AI Tahlilni yashirish" : "AI Tahlilni ko\u2018rsatish") : "AI Tahlil olish"}
                    {aiAnalysis && (showAiAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </>
                )}
              </button>
              {aiError && <p className="text-red-400 text-sm text-center mt-2">{aiError}</p>}
            </div>

            {/* AI Analysis Results */}
            {showAiAnalysis && aiAnalysis && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Overall Grade & Summary */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">AI Tahlil</h3>
                        <p className="text-xs text-muted-foreground">Claude AI tomonidan tahlil qilingan</p>
                      </div>
                    </div>
                    <div className={`text-3xl font-extrabold ${
                      aiAnalysis.overall_grade?.startsWith("A") ? "text-green-400" :
                      aiAnalysis.overall_grade?.startsWith("B") ? "text-blue-400" :
                      aiAnalysis.overall_grade?.startsWith("C") ? "text-amber-400" : "text-red-400"
                    }`}>
                      {aiAnalysis.overall_grade}
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{aiAnalysis.summary}</p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-green-500/5 border border-green-500/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <h4 className="font-semibold text-green-600 dark:text-green-400">Kuchli tomonlar</h4>
                    </div>
                    <ul className="space-y-2">
                      {aiAnalysis.strengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-green-400 mt-0.5">{"\u2713"}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-red-400" />
                      <h4 className="font-semibold text-red-600 dark:text-red-400">Yaxshilash kerak</h4>
                    </div>
                    <ul className="space-y-2">
                      {aiAnalysis.weaknesses?.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-red-400 mt-0.5">!</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Question Analysis */}
                {aiAnalysis.question_analysis?.length > 0 && (
                  <div className="rounded-2xl bg-muted/50 border border-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="h-5 w-5 text-blue-400" />
                      <h4 className="font-semibold text-foreground">Xatolar tahlili</h4>
                    </div>
                    <div className="space-y-4">
                      {aiAnalysis.question_analysis.map((qa, i) => (
                        <div key={i} className="rounded-xl bg-background border border-border p-4">
                          <p className="text-sm font-medium text-foreground mb-2">
                            <span className="text-blue-400">#{qa.question_num}</span>{" "}
                            {qa.question_text}
                          </p>
                          <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                            <div className="bg-red-500/10 rounded-lg px-3 py-1.5">
                              <span className="text-red-400">Sizning javob:</span>{" "}
                              <span className="text-muted-foreground">{qa.your_answer || "\u2014"}</span>
                            </div>
                            <div className="bg-green-500/10 rounded-lg px-3 py-1.5">
                              <span className="text-green-400">To&apos;g&apos;ri javob:</span>{" "}
                              <span className="text-muted-foreground">{qa.correct_answer}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <Lightbulb className="h-4 w-4 inline-block text-amber-400 mr-1" />
                            {qa.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400">Tavsiyalar</h4>
                  </div>
                  <ul className="space-y-2">
                    {aiAnalysis.recommendations?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-amber-400 font-bold mt-0.5">{i + 1}.</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Motivation */}
                {aiAnalysis.motivation && (
                  <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-5 text-center">
                    <p className="text-lg text-foreground font-medium leading-relaxed italic">
                      &ldquo;{aiAnalysis.motivation}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">&mdash; AI Mentor</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Phase: Detail ────────────────────────────────────────────────────

  const canStart =
    joined &&
    mockTest.status === "active" &&
    (mockTest.max_attempts === 0 || attempts.length < mockTest.max_attempts);

  const hasInProgress = attempts.some((a) => a.status === "in_progress");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/mock-tests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Ortga
      </Link>

      {/* Test Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {mockTest.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {mockTest.subject}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {mockTest.duration_minutes} daqiqa
                </div>
              </div>
            </div>
            <Badge
              className={`border-0 ${
                mockTest.status === "active"
                  ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {mockTest.status === "active" ? "Faol" : mockTest.status}
            </Badge>
          </div>

          {mockTest.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tavsif
              </h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {mockTest.description}
              </p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground">Davomiyligi</p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {mockTest.duration_minutes} daqiqa
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Savollar</p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {mockTest.questions_count}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max urinishlar</p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {mockTest.max_attempts === 0 ? "Cheksiz" : mockTest.max_attempts}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Narxi</p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {mockTest.price === 0 ? (
                  <span className="text-green-600">Bepul</span>
                ) : (
                  <span className="text-orange-600">
                    {mockTest.price.toLocaleString()} so&apos;m
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Assessment method */}
          {mockTest.assessment_method && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <Shield className="h-4 w-4 flex-shrink-0" />
              Baholash usuli:{" "}
              {mockTest.assessment_method === "standard"
                ? "Standart"
                : mockTest.assessment_method === "rasch"
                ? "Rasch modeli"
                : mockTest.assessment_method}
            </div>
          )}

          {/* Rules */}
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
              Qoidalar
            </h3>
            <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1.5 list-disc list-inside">
              <li>Test {mockTest.duration_minutes} daqiqa davom etadi</li>
              <li>Jami {mockTest.questions_count} ta savol mavjud</li>
              <li>Har bir savolda bitta to&apos;g&apos;ri javob bor</li>
              <li>Vaqt tugagach test avtomatik yakunlanadi</li>
              <li>Test to&apos;liq ekran rejimida ochiladi</li>
              {mockTest.max_attempts > 0 && (
                <li>
                  Maksimal {mockTest.max_attempts} marta urinish mumkin
                </li>
              )}
            </ul>
          </div>

          {/* Payment info for paid tests */}
          {mockTest.price > 0 && !joined && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-orange-600" />
                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                  To&apos;lov ma&apos;lumotlari
                </h3>
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                <p>
                  Test narxi:{" "}
                  <span className="font-bold">
                    {mockTest.price.toLocaleString()} so&apos;m
                  </span>
                </p>
                {balance !== null && (
                  <p>
                    Sizning balansingiz:{" "}
                    <span
                      className={`font-bold ${
                        balance >= mockTest.price
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {balance.toLocaleString()} so&apos;m
                    </span>
                  </p>
                )}
                {balance !== null && balance < mockTest.price && (
                  <p className="text-red-600 dark:text-red-400 font-medium mt-2">
                    Balansingizda yetarli mablag&apos; yo&apos;q.{" "}
                    <Link
                      href="/dashboard/balance"
                      className="underline hover:no-underline"
                    >
                      Balansni to&apos;ldirish
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!joined && (
              <Button
                onClick={handleJoin}
                disabled={joining || (mockTest.price > 0 && balance !== null && balance < mockTest.price)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {joining
                  ? "Yuklanmoqda..."
                  : mockTest.price > 0
                  ? `To'lov qilish (${mockTest.price.toLocaleString()} so'm)`
                  : "Ro'yxatdan o'tish"}
              </Button>
            )}

            {canStart && (
              <Button
                onClick={handleStart}
                disabled={starting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                {starting
                  ? "Boshlanmoqda..."
                  : hasInProgress
                  ? "Testni davom ettirish"
                  : "Testni boshlash"}
              </Button>
            )}

            {joined &&
              mockTest.max_attempts > 0 &&
              attempts.length >= mockTest.max_attempts && (
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Barcha urinishlaringiz tugadi (
                    {attempts.length}/{mockTest.max_attempts})
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Past Attempts */}
      {attempts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Urinishlar tarixi
            </h2>
            <div className="space-y-3">
              {attempts.map((a, idx) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        a.status === "completed"
                          ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                          : a.status === "in_progress"
                          ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {idx + 1}-urinish
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.started_at).toLocaleString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {a.status === "completed" ? (
                      <>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {a.score}/{a.max_score}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.percentage}%
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const r = await getMockAttemptResult(a.id);
                              setResult(r);
                              setPhase("result");
                            } catch {
                              toast.error("Natijani yuklashda xatolik");
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline"
                        >
                          Batafsil
                        </button>
                      </>
                    ) : a.status === "in_progress" ? (
                      <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0">
                        Jarayonda
                      </Badge>
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
