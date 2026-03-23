"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export type ViolationType =
  | "fullscreen"
  | "tabSwitch"
  | "copyPaste"
  | "screenshot"
  | "devtools"
  | "rightClick";

interface AntiCheatWarningModalProps {
  message: string;
  type: ViolationType | null;
  current: number;
  max: number;
  onDismiss: () => void;
}

const TYPE_LABELS: Record<ViolationType, string> = {
  fullscreen: "To'liq ekran",
  tabSwitch: "Oyna almashtirish",
  copyPaste: "Nusxalash",
  screenshot: "Skrinshot",
  devtools: "Dasturchi vositalari",
  rightClick: "O'ng tugma",
};

export function AntiCheatWarningModal({
  message,
  type,
  current,
  max,
  onDismiss,
}: AntiCheatWarningModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const progressPercent =
    max > 0 && max < Infinity ? ((max - current) / max) * 100 : 100;
  const isUrgent = max < Infinity && current >= max - 2;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[200] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className={`relative max-w-md w-full mx-4 rounded-2xl p-6 border-2 transition-transform duration-300 ${
          visible ? "scale-100" : "scale-95"
        } ${
          isUrgent
            ? "border-red-500/70 bg-gray-900/95"
            : "border-amber-500/50 bg-gray-900/95"
        }`}
        style={{
          boxShadow: isUrgent
            ? "0 0 40px rgba(239,68,68,0.3), inset 0 0 40px rgba(239,68,68,0.05)"
            : "0 0 40px rgba(245,158,11,0.3), inset 0 0 40px rgba(245,158,11,0.05)",
        }}
      >
        {/* Pulsing warning icon */}
        <div className="flex items-center justify-center mb-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center animate-pulse ${
              isUrgent ? "bg-red-500/20" : "bg-amber-500/20"
            }`}
          >
            <AlertTriangle
              className={`w-8 h-8 ${
                isUrgent ? "text-red-400" : "text-amber-400"
              }`}
            />
          </div>
        </div>

        {/* Type label badge */}
        {type && (
          <div className="text-center mb-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                isUrgent
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {TYPE_LABELS[type]}
            </span>
          </div>
        )}

        {/* Message */}
        <p className="text-white text-center text-lg font-semibold mb-4">
          {message}
        </p>

        {/* Violation counter + progress bar */}
        {max < Infinity && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">
                Ogohlantirish: {current}/{max}
              </span>
              <span
                className={
                  isUrgent ? "text-red-400 font-bold" : "text-amber-400"
                }
              >
                {max - current} ta qoldi
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isUrgent
                    ? "bg-gradient-to-r from-red-500 to-red-400"
                    : "bg-gradient-to-r from-amber-500 to-amber-400"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
            isUrgent
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-amber-600 hover:bg-amber-500 text-white"
          }`}
        >
          Tushundim
        </button>
      </div>
    </div>
  );
}
