"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trophy, Clock, BookOpen, Users, CheckCircle2, XCircle, AlertCircle,
  ArrowLeft, ArrowRight, Flag, DollarSign, Loader2, Award,
  ChevronLeft, ChevronRight, Timer, Maximize, Minimize, MinusCircle,
} from "lucide-react";
import {
  getOlympiad,
  joinOlympiad,
  startOlympiad,
  submitOlympiadAnswer,
  finishOlympiad,
  getOlympiadAttemptResult,
  getBalance,
} from "@/lib/user-api";
import { toast } from "sonner";

interface Option {
  id: number;
  label: string;
  text: string;
  content?: string;
  is_correct?: boolean;
  order_num?: number;
}

interface Question {
  id: number;
  text: string;
  title?: string;
  content?: string;
  points: number;
  order_num: number;
  options: Option[];
}

interface AttemptResult {
  total_questions: number;
  correct_answers: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  answers?: { question_id: number; is_correct: boolean; correct_option_id: number; selected_option_id: number }[];
}

type Phase = "detail" | "payment" | "ready" | "exam" | "result";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function OlympiadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [olympiad, setOlympiad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("detail");

  // Attempt state
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishConfirm, setFinishConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const examContainerRef = useRef<HTMLDivElement>(null);

  // Result state
  const [result, setResult] = useState<AttemptResult | null>(null);

  // Payment state
  const [balance, setBalance] = useState<number>(0);

  const handleFinishRef = useRef<(auto?: boolean) => void>(() => {});

  const handleFinish = useCallback(async (auto = false) => {
    if (!attemptId) return;
    setFinishConfirm(false);
    setFinishing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await finishOlympiad(attemptId);
      const resultData = await getOlympiadAttemptResult(attemptId);
      setResult(resultData as unknown as AttemptResult);
      setPhase("result");
      if (auto) toast.info("Vaqt tugadi! Olimpiada yakunlandi.");
      else toast.success("Olimpiada muvaffaqiyatli yakunlandi!");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Yakunlashda xatolik yuz berdi");
    } finally {
      setFinishing(false);
    }
  }, [attemptId]);

  useEffect(() => {
    handleFinishRef.current = handleFinish;
  }, [handleFinish]);

  useEffect(() => {
    Promise.all([
      getOlympiad(Number(id)),
      getBalance().catch(() => ({ balance: 0 })),
    ]).then(([olympiadData, balanceData]) => {
      setOlympiad(olympiadData);
      setBalance((balanceData as any)?.balance || 0);
    }).catch(() => {})
      .finally(() => setLoading(false));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  const startTimer = useCallback((durationMinutes: number) => {
    setTimeLeft(durationMinutes * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinishRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Fullscreen
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

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    if (phase === "exam") {
      const el = examContainerRef.current || document.documentElement;
      el.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [phase]);

  const handleJoin = async () => {
    if (!olympiad) return;
    if (olympiad.is_paid) {
      setPhase("payment");
      return;
    }
    try {
      await joinOlympiad(Number(id));
      setPhase("ready");
    } catch (e: any) {
      const msg = e?.response?.data?.error || "";
      if (msg.includes("already")) setPhase("ready");
      else toast.error(msg || "Xatolik yuz berdi");
    }
  };

  const handlePayAndJoin = async () => {
    if (!olympiad) return;
    if (balance < (olympiad.price || 0)) return;
    try {
      await joinOlympiad(Number(id));
      setPhase("ready");
    } catch (e: any) {
      const msg = e?.response?.data?.error || "";
      if (msg.includes("already")) setPhase("ready");
      else toast.error(msg || "Xatolik yuz berdi");
    }
  };

  const handleStart = async () => {
    try {
      const attempt = await startOlympiad(Number(id));
      const aId = (attempt as any).id || (attempt as any).attempt_id;
      setAttemptId(aId);
      const qs: Question[] = (attempt as any).questions || [];
      setQuestions(qs);
      setCurrentIdx(0);
      setAnswers({});
      setPhase("exam");
      startTimer((attempt as any).duration_minutes || olympiad?.duration_minutes || 60);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Test boshlashda xatolik");
    }
  };

  const handleAnswer = async (optionId: number) => {
    const question = questions[currentIdx];
    if (!question || !attemptId) return;

    const isDeselect = answers[question.id] === optionId;

    if (isDeselect) {
      const newAnswers = { ...answers };
      delete newAnswers[question.id];
      setAnswers(newAnswers);
    } else {
      setAnswers(prev => ({ ...prev, [question.id]: optionId }));
    }

    try {
      await submitOlympiadAnswer(attemptId, question.id, isDeselect ? 0 : optionId);
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="flex flex-col items-center py-32 text-muted-foreground">
        <Trophy className="h-14 w-14 mb-4 opacity-20" />
        <p>Olimpiada topilmadi</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/olympiads")}>Orqaga</Button>
      </div>
    );
  }

  // === RESULT PHASE ===
  if (phase === "result" && result) {
    const pct = result.percentage || Math.round((result.correct_answers / result.total_questions) * 100);
    const wrongCount = result.total_questions - result.correct_answers;
    return (
      <div className="max-w-lg mx-auto py-10 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full ${result.passed !== false ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {result.passed !== false
              ? <Award className="h-10 w-10 text-green-600" />
              : <XCircle className="h-10 w-10 text-red-500" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{result.passed !== false ? "Tabriklaymiz!" : "Keyingi safar yaxshiroq!"}</h2>
            <p className="text-muted-foreground mt-1">{olympiad.title}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{result.correct_answers}</p>
              <p className="text-xs text-muted-foreground">To&apos;g&apos;ri</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
              <p className="text-xs text-muted-foreground">Noto&apos;g&apos;ri</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{pct}%</p>
              <p className="text-xs text-muted-foreground">Natija</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Ball</span>
              <span className="font-semibold text-foreground">{result.score} / {result.max_score}</span>
            </div>
            <Progress value={pct} className="h-3" />
          </div>
          {result.time_taken_seconds > 0 && (
            <p className="text-sm text-muted-foreground">
              Sarflangan vaqt: {formatTime(result.time_taken_seconds)}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard/results")}>Natijalar</Button>
            <Button className="flex-1" onClick={() => router.push("/dashboard/olympiads")}>Olimpiadalar</Button>
          </div>
        </div>
      </div>
    );
  }

  // === EXAM PHASE (Fullscreen) ===
  if (phase === "exam" && questions.length > 0) {
    const question = questions[currentIdx];
    const selectedOpt = question ? answers[question.id] : undefined;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;
    const urgent = timeLeft < 60;

    return (
      <div
        ref={examContainerRef}
        className="fixed inset-0 z-[100] bg-background flex flex-col"
      >
        {/* Top bar */}
        <div className="flex-shrink-0 bg-background border-b border-border px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {olympiad.title}
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-sm text-muted-foreground hidden sm:block">
                <span className="font-medium text-foreground">{answeredCount}</span>
                /{questions.length} javob
              </div>
              <div
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                  urgent
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
                {isFullscreen ? <Minimize className="h-5 w-5 text-muted-foreground" /> : <Maximize className="h-5 w-5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Savol {currentIdx + 1} / {questions.length}
                </Badge>
                {question.points > 0 && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {question.points} ball
                  </Badge>
                )}
              </div>

              {(question.title || question.text) && (
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {question.title || question.text}
                </h3>
              )}

              {question.content && (
                <div
                  className="text-base text-foreground leading-relaxed mb-8 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: question.content }}
                />
              )}

              {/* Options */}
              <div className="space-y-3">
                {question.options
                  .sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0))
                  .map((opt, optIdx) => {
                    const isSelected = selectedOpt === opt.id;
                    const letter = opt.label || String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(opt.id)}
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
                          {opt.text || opt.content}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Oldingi
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setFinishConfirm(true)}
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
                const isAnswered = answers[q.id] !== undefined;
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

        {/* Mobile bottom bar */}
        <div className="md:hidden flex-shrink-0 border-t border-border bg-background px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
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

        {/* Finish confirmation */}
        <Dialog open={finishConfirm} onOpenChange={setFinishConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Olimpiadani yakunlash</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Jami: {questions.length} savol, {answeredCount} ta javob berildi.
              </p>
              {unansweredCount > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {unansweredCount} ta savol javobsiz qolmoqda
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFinishConfirm(false)}>Davom etish</Button>
              <Button variant="destructive" onClick={() => handleFinish()} disabled={finishing}>
                {finishing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Yakunlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // === PAYMENT PHASE ===
  if (phase === "payment") {
    const canPay = balance >= (olympiad.price || 0);
    return (
      <div className="max-w-md mx-auto py-10">
        <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => setPhase("detail")}>
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </Button>
        <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 mb-4">
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">To&apos;lovli olimpiada</h2>
            <p className="text-sm text-muted-foreground mt-2">{olympiad.title}</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Olimpiada narxi</span>
              <span className="font-semibold text-foreground">{olympiad.price?.toLocaleString()} UZS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balansingiz</span>
              <span className={`font-semibold ${canPay ? "text-green-600" : "text-red-500"}`}>{balance.toLocaleString()} UZS</span>
            </div>
            {!canPay && (
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Yetishmaydi</span>
                <span className="font-semibold text-red-500">{((olympiad.price || 0) - balance).toLocaleString()} UZS</span>
              </div>
            )}
          </div>

          {canPay ? (
            <Button className="w-full gap-2" onClick={handlePayAndJoin}>
              <DollarSign className="h-4 w-4" />
              To&apos;lov qilish va qatnashish
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">Balansingizni to&apos;ldiring va qatnashing</p>
              <Button className="w-full" onClick={() => router.push("/dashboard/balance")}>
                Balansni to&apos;ldirish
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === READY PHASE ===
  if (phase === "ready") {
    return (
      <div className="max-w-md mx-auto py-10">
        <div className="rounded-2xl border border-border bg-card p-8 space-y-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Tayyor!</h2>
            <p className="text-sm text-muted-foreground mt-2">{olympiad.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-border p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold text-foreground">{olympiad.duration_minutes} daqiqa</p>
            </div>
            <div className="rounded-xl border border-border p-3 text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold text-foreground">{olympiad.total_questions ?? olympiad.questions_count ?? "?"} savol</p>
            </div>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-left space-y-1.5 text-sm">
            <p className="flex items-start gap-2 text-foreground"><AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />Test boshlanganidan keyin vaqt hisoblanadi</p>
            <p className="flex items-start gap-2 text-foreground"><AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />Vaqt tugaganda test avtomatik yakunlanadi</p>
            <p className="flex items-start gap-2 text-foreground"><AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />Test to&apos;liq ekran rejimida ochiladi</p>
          </div>
          <Button className="w-full gap-2" onClick={handleStart}>
            <Trophy className="h-4 w-4" /> Testni boshlash
          </Button>
        </div>
      </div>
    );
  }

  // === DETAIL PHASE ===
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/dashboard/olympiads")}>
        <ArrowLeft className="h-4 w-4" /> Olimpiadalar
      </Button>

      <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className={`text-xs ${olympiad.is_paid ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : "bg-green-500/10 text-green-600 border-green-500/20"}`}>
                {olympiad.is_paid ? `${olympiad.price?.toLocaleString()} UZS` : "Bepul"}
              </Badge>
              {olympiad.subject && <Badge variant="outline" className="text-xs">{olympiad.subject}</Badge>}
              {olympiad.grade > 0 && <Badge variant="outline" className="text-xs">{olympiad.grade}-sinf</Badge>}
            </div>
            <h1 className="text-xl font-bold text-foreground">{olympiad.title}</h1>
          </div>
        </div>

        {olympiad.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{olympiad.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="font-semibold text-foreground">{olympiad.duration_minutes} daqiqa</p>
            <p className="text-xs text-muted-foreground">Davomiyligi</p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="font-semibold text-foreground">{olympiad.total_questions ?? olympiad.questions_count ?? "\u2014"} ta</p>
            <p className="text-xs text-muted-foreground">Savollar soni</p>
          </div>
        </div>

        {(olympiad.start_time || olympiad.start_date) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {(olympiad.start_time || olympiad.start_date) && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">Boshlanish</p>
                <p className="font-medium text-foreground">
                  {new Date(olympiad.start_time || olympiad.start_date).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            )}
            {(olympiad.end_time || olympiad.end_date) && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">Tugash</p>
                <p className="font-medium text-foreground">
                  {new Date(olympiad.end_time || olympiad.end_date).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            )}
          </div>
        )}

        {olympiad.rules && (
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-2">Qoidalar</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{olympiad.rules}</p>
          </div>
        )}

        {olympiad.status === "ended" || olympiad.status === "completed" ? (
          <Button disabled className="w-full">Olimpiada tugagan</Button>
        ) : (
          <Button className="w-full gap-2" onClick={handleJoin} size="lg">
            <Trophy className="h-4 w-4" />
            {olympiad.is_paid ? `To'lov qilish (${olympiad.price?.toLocaleString()} UZS)` : "Qatnashish"}
          </Button>
        )}
      </div>
    </div>
  );
}
