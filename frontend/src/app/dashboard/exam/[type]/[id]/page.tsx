"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { QuestionDisplay } from "@/components/exam/QuestionDisplay";
import { QuestionNavigator } from "@/components/exam/QuestionNavigator";
import { AntiCheatWarningModal } from "@/components/exam/AntiCheatWarningModal";
import { AntiCheatKickedOutModal } from "@/components/exam/AntiCheatKickedOutModal";
import { useExamSession, ExamQuestion } from "@/hooks/useExamSession";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { Loader2, CheckCircle2, XCircle, HelpCircle, AlertTriangle, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

interface XPAwardPayload {
  xp_awarded?: number;
  new_total_xp?: number;
  old_level?: number;
  new_level?: number;
  leveled_up?: boolean;
  current_streak?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1";

interface ExamData {
  attempt_id: number;
  title: string;
  duration: number;
  questions: ExamQuestion[];
  existing_answers?: Record<number, number>;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const examType = params.type as string; // "olympiad" or "mock-test"
  const examId = params.id as string;

  // Exam start
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    startExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startExam = async () => {
    try {
      setLoading(true);
      const endpoint =
        examType === "olympiad"
          ? `${API_URL}/user/exams/olympiads/${examId}/start`
          : `${API_URL}/user/exams/mock-tests/${examId}/start`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Imtihonni boshlashda xatolik");
      }

      const data = await res.json();
      const attemptData = data?.data;

      if (!attemptData) {
        throw new Error("Ma'lumot topilmadi");
      }

      // Savollarni format qilish
      const questions: ExamQuestion[] = (attemptData.questions || []).map(
        (q: Record<string, unknown>, idx: number) => ({
          id: q.id as number,
          text: q.text as string || q.statement as string || "",
          image_url: q.image_url as string || q.image as string || "",
          options: ((q.options as Record<string, unknown>[]) || []).map(
            (o: Record<string, unknown>, oIdx: number) => ({
              id: o.id as number,
              text: o.text as string || o.label as string || "",
              image_url: o.image_url as string || "",
              label: String.fromCharCode(65 + oIdx), // A, B, C, D
            })
          ),
        })
      );

      setExamData({
        attempt_id: attemptData.attempt_id || attemptData.id,
        title: attemptData.title || "Imtihon",
        duration: attemptData.remaining_seconds || attemptData.duration_seconds || (attemptData.duration_mins ? attemptData.duration_mins * 60 : null) || (attemptData.duration ? attemptData.duration * 60 : null) || 3600,
        questions,
        existing_answers: attemptData.existing_answers || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Exam session hook
  const examSession = useExamSession({
    attemptId: examData?.attempt_id || 0,
    attemptType: examType === "olympiad" ? "olympiad" : "mock_test",
    questions: examData?.questions || [],
    duration: examData?.duration || 0,
    existingAnswers: examData?.existing_answers,
    apiUrl: API_URL,
    token: token || "",
    onFinish: (data) => {
      const payload = data as Record<string, unknown> & {
        data?: Record<string, unknown>;
      };
      // Backend response { data: { xp_awarded: ... } } yoki to'g'ri obyekt bo'lishi mumkin
      const inner = (payload?.data as Record<string, unknown>) ?? payload;
      const xpRaw = inner?.xp_awarded as XPAwardPayload | undefined;
      if (xpRaw && typeof xpRaw.xp_awarded === "number" && xpRaw.xp_awarded > 0) {
        const streakSuffix =
          xpRaw.current_streak && xpRaw.current_streak > 1
            ? ` · 🔥 ${xpRaw.current_streak} kun streak`
            : "";
        toast.success(`+${xpRaw.xp_awarded} XP yutdingiz!${streakSuffix}`, {
          icon: <Sparkles className="h-4 w-4 text-amber-400" />,
          duration: 5000,
        });
        if (xpRaw.leveled_up && xpRaw.new_level) {
          setTimeout(() => {
            toast(`Yangi level ochildi: ${xpRaw.new_level}!`, {
              icon: <Zap className="h-4 w-4 text-purple-400" />,
              duration: 6000,
              className: "bg-purple-600 text-white border-purple-500",
            });
          }, 600);
        }
      }
      setResult(inner);
      setShowResult(true);
    },
  });

  // Anti-cheat hook
  const antiCheat = useAntiCheat({
    enabled: !!examData,
    maxFullscreenViolations: 5,
    maxTabSwitchViolations: 5,
    maxCopyPasteViolations: 4,
    onKickedOut: () => examSession.finishExam(),
    // Backend reporting
    attemptId: examData?.attempt_id || 0,
    attemptType: examType === "olympiad" ? "olympiad" : "mock_test",
    apiUrl: API_URL,
    token: token || "",
    onAutoSubmit: () => examSession.finishExam(),
  });

  // Request fullscreen when exam data loads
  useEffect(() => {
    if (examData && !loading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        antiCheat.requestFullscreen();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, loading]);

  // Finish confirmation
  const handleFinishClick = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const confirmFinish = useCallback(() => {
    setShowConfirmDialog(false);
    examSession.finishExam();
  }, [examSession]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Imtihon tayyorlanmoqda...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Xatolik</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  if (!examData || !examSession.currentQuestion) return null;

  // Result state
  if (showResult) {
    const r = (result || {}) as Record<string, unknown>;
    const isPending = r.status === "pending_review";

    // Backend qaytaradigan maydonlar (Rasch + scaling bo'lsa to'liq)
    const score = Number(r.score ?? 0);
    const maxScore = Number(r.max_score ?? 0);
    const correct = Number(r.correct ?? examSession.answeredCount);
    const wrong = Number(r.wrong ?? 0);
    const unanswered = Number(r.unanswered ?? examSession.unansweredCount);
    const percentage = Number(r.percentage ?? 0);
    const tScore = r.t_score != null ? Number(r.t_score) : null;
    const scaledScore = r.scaled_score != null ? Number(r.scaled_score) : null;
    const gradeLabel = (r.grade_label as string) || "";
    const scoringType = (r.scoring_type as string) || "simple";

    // Daraja rangi
    const gradeColor = (() => {
      if (gradeLabel.startsWith("A")) return "text-cyan-400";
      if (gradeLabel.startsWith("B")) return "text-emerald-400";
      if (gradeLabel.startsWith("C")) return "text-amber-400";
      return "text-red-400";
    })();

    if (isPending) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
          <div className="text-center max-w-md bg-gray-900 p-8 rounded-2xl border border-amber-700/40">
            <CheckCircle2 className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Imtihon tugatildi!</h2>
            <p className="text-amber-300 mb-2">Natijangiz admin tomonidan tekshirilmoqda.</p>
            <p className="text-gray-500 text-sm mb-6">
              Tekshirilgandan so&apos;ng natijalar bo&apos;limida ko&apos;rsatiladi.
            </p>
            <button
              onClick={() => router.push("/dashboard/results")}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
            >
              Natijalar bo&apos;limiga o&apos;tish
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full bg-gray-900 p-8 rounded-2xl border border-gray-700 space-y-6">
          {/* Header */}
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-1">Imtihon tugatildi!</h2>
            <p className="text-gray-400 text-sm">Natijangiz quyida ko&apos;rsatilgan</p>
          </div>

          {/* Rasch grade — eng katta */}
          {scoringType === "rasch" && gradeLabel && (
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-indigo-300/80 mb-1">
                Daraja
              </p>
              <p className={`text-6xl font-bold ${gradeColor}`}>{gradeLabel}</p>
              {tScore != null && (
                <p className="text-sm text-gray-400 mt-2">
                  T-ball: <span className="text-white font-semibold">{tScore.toFixed(1)}</span>
                </p>
              )}
              {scaledScore != null && (
                <p className="text-sm text-gray-400 mt-1">
                  Tabaqalashtirilgan ball:{" "}
                  <span className="text-amber-300 font-semibold">{scaledScore.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {/* Asosiy ballar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-white">{score}</p>
              <p className="text-xs text-gray-400 mt-1">Ball / {maxScore}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-emerald-400">{percentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Foiz</p>
            </div>
          </div>

          {/* Javoblar taqsimoti */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-900/20 border border-emerald-700/30 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-400">{correct}</p>
              <p className="text-[11px] text-gray-400 mt-1">To&apos;g&apos;ri</p>
            </div>
            <div className="bg-red-900/20 border border-red-700/30 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{wrong}</p>
              <p className="text-[11px] text-gray-400 mt-1">Noto&apos;g&apos;ri</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-400">{unanswered}</p>
              <p className="text-[11px] text-gray-400 mt-1">Javobsiz</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard/results")}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
          >
            Barcha natijalar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <ExamHeader
        title={examData.title}
        timeLeft={examSession.timeLeft}
        answeredCount={examSession.answeredCount}
        totalCount={examSession.totalCount}
        violationCount={antiCheat.violationCount}
        onFinish={handleFinishClick}
        isSubmitting={examSession.isSubmitting}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Question area - prevent text selection on question content */}
        <div className="flex-1 min-w-0 select-none">
          <QuestionDisplay
            question={examSession.currentQuestion}
            questionIndex={examSession.currentIndex}
            totalQuestions={examSession.totalCount}
            selectedOptionId={examSession.answers[examSession.currentQuestion.id] ?? null}
            isFlagged={examSession.flagged.has(examSession.currentQuestion.id)}
            onSelectOption={examSession.selectAnswer}
            onToggleFlag={examSession.toggleFlag}
            onNext={examSession.nextQuestion}
            onPrev={examSession.prevQuestion}
            hasNext={examSession.currentIndex < examSession.totalCount - 1}
            hasPrev={examSession.currentIndex > 0}
          />
        </div>

        {/* Navigator sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <QuestionNavigator
            totalQuestions={examSession.totalCount}
            currentIndex={examSession.currentIndex}
            getStatus={examSession.getQuestionStatus}
            questionIds={examData.questions.map((q) => q.id)}
            onSelect={examSession.goToQuestion}
            answeredCount={examSession.answeredCount}
            flaggedCount={examSession.flaggedCount}
            unansweredCount={examSession.unansweredCount}
          />
        </div>
      </div>

      {/* Anti-cheat Warning Modal */}
      {antiCheat.warning && !antiCheat.isKickedOut && (
        <AntiCheatWarningModal
          message={antiCheat.warning.message}
          type={antiCheat.warning.type}
          current={antiCheat.warning.current}
          max={antiCheat.warning.max}
          onDismiss={antiCheat.dismissWarning}
        />
      )}

      {/* Anti-cheat Kicked Out Modal */}
      {antiCheat.isKickedOut && (
        <AntiCheatKickedOutModal
          reason={antiCheat.kickReason}
          violations={antiCheat.violations}
        />
      )}

      {/* Submit error toast */}
      {examSession.submitError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-top-2">
          <div className="bg-red-900/90 border border-red-700 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl max-w-md">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">{examSession.submitError}</p>
            <button
              onClick={examSession.clearSubmitError}
              className="text-red-400 hover:text-red-300 ml-2 text-lg font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirmDialog && !antiCheat.isKickedOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-8 h-8 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Imtihonni topshirasizmi?</h3>
            </div>
            <div className="mb-6 space-y-2 text-sm text-gray-400">
              <p>
                Javob berilgan: <span className="text-emerald-400 font-bold">{examSession.answeredCount}</span> / {examSession.totalCount}
              </p>
              {examSession.unansweredCount > 0 && (
                <p className="text-yellow-400">
                  {examSession.unansweredCount} ta savolga javob berilmagan!
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmFinish}
                disabled={examSession.isSubmitting}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {examSession.isSubmitting ? "Yuborilmoqda..." : "Topshirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
