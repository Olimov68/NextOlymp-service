"use client";

import { ExamQuestion } from "@/hooks/useExamSession";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";

interface QuestionDisplayProps {
  question: ExamQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedOptionId: number | null;
  isFlagged: boolean;
  onSelectOption: (questionId: number, optionId: number) => void;
  onToggleFlag: (questionId: number) => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function QuestionDisplay({
  question,
  questionIndex,
  totalQuestions,
  selectedOptionId,
  isFlagged,
  onSelectOption,
  onToggleFlag,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: QuestionDisplayProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Question header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <button
          onClick={() => onToggleFlag(question.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isFlagged
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600"
          }`}
        >
          <Flag className="w-4 h-4" />
          {isFlagged ? "Belgilangan" : "Belgilash"}
        </button>
      </div>

      {/* Question text */}
      <div className="bg-gray-800/60 rounded-xl p-6 mb-6 border border-gray-700">
        <p className="text-lg text-white leading-relaxed whitespace-pre-wrap">
          {question.text}
        </p>
        {question.image_url && (
          <div className="mt-4">
            <img
              src={question.image_url}
              alt="Savol rasmi"
              className="max-w-full max-h-80 rounded-lg border border-gray-600"
            />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 flex-1">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelectOption(question.id, option.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-gray-700 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/60"
              }`}
            >
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {option.label}
              </span>
              <div className="flex-1">
                <span className={`text-base ${isSelected ? "text-white" : "text-gray-300"}`}>
                  {option.text}
                </span>
                {option.image_url && (
                  <img
                    src={option.image_url}
                    alt={`Variant ${option.label}`}
                    className="mt-2 max-h-40 rounded-lg border border-gray-600"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Oldingi
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Keyingi
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
