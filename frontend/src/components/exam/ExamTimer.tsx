"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  timeLeft: number; // sekundlarda
}

export function ExamTimer({ timeLeft }: ExamTimerProps) {
  const { hours, minutes, seconds, isWarning, isCritical } = useMemo(() => {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return {
      hours: h,
      minutes: m,
      seconds: s,
      isWarning: timeLeft <= 300 && timeLeft > 60, // 5 minut qoldi
      isCritical: timeLeft <= 60, // 1 minut qoldi
    };
  }, [timeLeft]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const colorClass = isCritical
    ? "text-red-500 animate-pulse"
    : isWarning
    ? "text-yellow-400"
    : "text-white";

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold ${colorClass}`}>
      <Clock className="w-5 h-5" />
      <span>
        {hours > 0 && `${pad(hours)}:`}
        {pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}
