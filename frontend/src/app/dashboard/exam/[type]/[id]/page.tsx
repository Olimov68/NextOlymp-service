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
import { Loader2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

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
        duration: attemptData.remaining_seconds || attemptData.duration_seconds || attemptData.duration * 60 || 3600,
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
      setResult(data as Record<string, unknown>);
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
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md bg-gray-900 p-8 rounded-2xl border border-gray-700">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Imtihon tugatildi!</h2>
          <p className="text-gray-400 mb-6">
            Javoblaringiz muvaffaqiyatli topshirildi.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-2xl font-bold text-emerald-400">{examSession.answeredCount}</p>
              <p className="text-xs text-gray-500">Javob berilgan</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-2xl font-bold text-gray-400">{examSession.unansweredCount}</p>
              <p className="text-xs text-gray-500">Javobsiz</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-2xl font-bold text-yellow-400">{examSession.flaggedCount}</p>
              <p className="text-xs text-gray-500">Belgilangan</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/results")}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
          >
            Natijalarni ko&apos;rish
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
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-semibold"
              >
                Topshirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
