"use client";

import { ExamTimer } from "./ExamTimer";
import { AlertTriangle, Send } from "lucide-react";

interface ExamHeaderProps {
  title: string;
  timeLeft: number;
  answeredCount: number;
  totalCount: number;
  violationCount: number;
  onFinish: () => void;
  isSubmitting: boolean;
}

export function ExamHeader({
  title,
  timeLeft,
  answeredCount,
  totalCount,
  violationCount,
  onFinish,
  isSubmitting,
}: ExamHeaderProps) {
  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
          NextOlymp
        </div>
        <h1 className="text-white font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-[400px]">
          {title}
        </h1>
      </div>

      {/* Center: Timer + Progress */}
      <div className="flex items-center gap-4">
        <ExamTimer timeLeft={timeLeft} />
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-emerald-400 font-bold">{answeredCount}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{totalCount}</span>
        </div>
        {violationCount > 0 && (
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold">{violationCount}</span>
          </div>
        )}
      </div>

      {/* Right: Submit */}
      <button
        onClick={onFinish}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors text-sm font-semibold"
      >
        <Send className="w-4 h-4" />
        <span className="hidden md:inline">Topshirish</span>
      </button>
    </header>
  );
}
