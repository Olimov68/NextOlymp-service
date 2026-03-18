"use client";

import { QuestionStatus } from "@/hooks/useExamSession";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  getStatus: (questionId: number) => QuestionStatus;
  questionIds: number[];
  onSelect: (index: number) => void;
  answeredCount: number;
  flaggedCount: number;
  unansweredCount: number;
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  getStatus,
  questionIds,
  onSelect,
  answeredCount,
  flaggedCount,
  unansweredCount,
}: QuestionNavigatorProps) {
  const getButtonClass = (index: number) => {
    const questionId = questionIds[index];
    const status = getStatus(questionId);
    const isCurrent = index === currentIndex;

    let base = "w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ";

    if (isCurrent) {
      base += "ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900 ";
    }

    switch (status) {
      case "answered":
        return base + "bg-emerald-600 text-white hover:bg-emerald-500";
      case "flagged":
        return base + "bg-yellow-500 text-black hover:bg-yellow-400";
      case "unanswered":
      default:
        return base + (isCurrent ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600");
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
        Savollar
      </h3>

      {/* Savollar gridi */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={getButtonClass(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-700 pt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-600" />
            <span className="text-gray-400">Javob berilgan</span>
          </div>
          <span className="font-bold text-emerald-400">{answeredCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-gray-400">Belgilangan</span>
          </div>
          <span className="font-bold text-yellow-400">{flaggedCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gray-700" />
            <span className="text-gray-400">Javobsiz</span>
          </div>
          <span className="font-bold text-gray-400">{unansweredCount}</span>
        </div>
      </div>
    </div>
  );
}
