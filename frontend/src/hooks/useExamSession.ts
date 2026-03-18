"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface ExamQuestion {
  id: number;
  text: string;
  image_url?: string;
  options: {
    id: number;
    text: string;
    image_url?: string;
    label: string; // A, B, C, D
  }[];
}

export interface ExamAnswer {
  question_id: number;
  option_id: number | null;
}

export type QuestionStatus = "unanswered" | "answered" | "flagged";

interface ExamSessionConfig {
  attemptId: number;
  attemptType: "olympiad" | "mock_test";
  questions: ExamQuestion[];
  duration: number; // sekundlarda
  existingAnswers?: Record<number, number>; // question_id -> option_id
  apiUrl: string;
  token: string;
  onFinish?: (result: unknown) => void;
}

export function useExamSession(config: ExamSessionConfig) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>(() => config.existingAnswers || {});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (isFinished || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  // Auto-submit when time runs out
  const handleAutoSubmit = useCallback(async () => {
    if (isFinished || isSubmitting) return;
    await finishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, isSubmitting]);

  // Savol javobini saqlash (debounced)
  const selectAnswer = useCallback(
    (questionId: number, optionId: number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

      // Debounced save to backend
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveAnswerToBackend(questionId, optionId);
      }, 500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.attemptId, config.attemptType]
  );

  // Backend ga javob saqlash
  const saveAnswerToBackend = async (questionId: number, optionId: number) => {
    try {
      const endpoint =
        config.attemptType === "olympiad"
          ? `${config.apiUrl}/user/exams/olympiads/attempts/${config.attemptId}/answer`
          : `${config.apiUrl}/user/exams/mock-tests/attempts/${config.attemptId}/answer`;

      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify({
          question_id: questionId,
          option_id: optionId,
        }),
      });
    } catch {
      // Network error — javob local da saqlangan, keyinroq sync bo'ladi
    }
  };

  // Savolni belgilash/belgilashni olib tashlash
  const toggleFlag = useCallback((questionId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  // Savolga o'tish
  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < config.questions.length) {
        setCurrentIndex(index);
      }
    },
    [config.questions.length]
  );

  const nextQuestion = useCallback(() => {
    goToQuestion(currentIndex + 1);
  }, [currentIndex, goToQuestion]);

  const prevQuestion = useCallback(() => {
    goToQuestion(currentIndex - 1);
  }, [currentIndex, goToQuestion]);

  // Savol statusi
  const getQuestionStatus = useCallback(
    (questionId: number): QuestionStatus => {
      if (flagged.has(questionId)) return "flagged";
      if (answers[questionId] !== undefined) return "answered";
      return "unanswered";
    },
    [answers, flagged]
  );

  // Imtihonni tugatish
  const finishExam = useCallback(async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);

    try {
      const endpoint =
        config.attemptType === "olympiad"
          ? `${config.apiUrl}/user/exams/olympiads/attempts/${config.attemptId}/finish`
          : `${config.apiUrl}/user/exams/mock-tests/attempts/${config.attemptId}/finish`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsFinished(true);
        config.onFinish?.(data);
      }
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  }, [config, isSubmitting, isFinished]);

  // Statistics
  const answeredCount = Object.keys(answers).length;
  const totalCount = config.questions.length;
  const flaggedCount = flagged.size;
  const unansweredCount = totalCount - answeredCount;

  return {
    // State
    currentIndex,
    currentQuestion: config.questions[currentIndex] || null,
    answers,
    flagged,
    timeLeft,
    isSubmitting,
    isFinished,

    // Actions
    selectAnswer,
    toggleFlag,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    finishExam,
    getQuestionStatus,

    // Stats
    answeredCount,
    totalCount,
    flaggedCount,
    unansweredCount,
  };
}
