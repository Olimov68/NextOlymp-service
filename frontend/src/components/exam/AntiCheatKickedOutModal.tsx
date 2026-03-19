"use client";

import { useEffect, useState } from "react";
import { ShieldOff } from "lucide-react";
import type { ViolationType } from "./AntiCheatWarningModal";

export interface ViolationCounts {
  fullscreen: number;
  tabSwitch: number;
  copyPaste: number;
  screenshot: number;
  devtools: number;
  rightClick: number;
  total: number;
}

interface AntiCheatKickedOutModalProps {
  reason: ViolationType | null;
  violations: ViolationCounts;
}

const REASON_LABELS: Record<ViolationType, string> = {
  fullscreen: "To'liq ekran rejimidan chiqish",
  tabSwitch: "Boshqa oynaga o'tish",
  copyPaste: "Nusxalash urinishi",
  screenshot: "Skrinshot olish urinishi",
  devtools: "Dasturchi vositalari ishlatish",
  rightClick: "O'ng tugma ishlatish",
};

const VIOLATION_LABELS: Record<string, string> = {
  fullscreen: "To'liq ekrandan chiqish",
  tabSwitch: "Oyna almashtirish",
  copyPaste: "Nusxalash urinishi",
  screenshot: "Skrinshot urinishi",
  devtools: "Dasturchi vositalari",
};

export function AntiCheatKickedOutModal({
  reason,
  violations,
}: AntiCheatKickedOutModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Build list of committed violations
  const committedViolations: { label: string; count: number }[] = [];
  const keys: (keyof Omit<ViolationCounts, "total" | "rightClick">)[] = [
    "fullscreen",
    "tabSwitch",
    "copyPaste",
    "screenshot",
    "devtools",
  ];
  for (const key of keys) {
    if (violations[key] > 0) {
      committedViolations.push({
        label: VIOLATION_LABELS[key] || key,
        count: violations[key],
      });
    }
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[300] transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background:
          "linear-gradient(135deg, rgba(127,29,29,0.95) 0%, rgba(0,0,0,0.98) 100%)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className={`max-w-lg w-full mx-4 rounded-2xl p-8 bg-gray-900/90 border-2 border-red-500/50 transition-transform duration-500 ${
          visible ? "scale-100" : "scale-90"
        }`}
        style={{
          boxShadow:
            "0 0 60px rgba(239,68,68,0.3), inset 0 0 60px rgba(239,68,68,0.05)",
        }}
      >
        {/* Red shield icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-red-400 text-center mb-2">
          Imtihon bekor qilindi
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6">
          Siz qoidalarni buzganingiz uchun imtihon avtomatik yakunlandi
        </p>

        {/* Kick reason */}
        {reason && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-center">
            <p className="text-red-300 text-sm font-medium">
              Sabab: {REASON_LABELS[reason]}
            </p>
          </div>
        )}

        {/* Violations list */}
        {committedViolations.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-4 space-y-2">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Aniqlangan qoidabuzarliklar
            </p>
            {committedViolations.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-400">{v.label}</span>
                <span className="text-red-400 font-bold">{v.count} marta</span>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-xl mb-6">
          <span className="text-gray-400 font-medium">
            Jami qoidabuzarliklar
          </span>
          <span className="text-red-400 font-bold text-lg">
            {violations.total}
          </span>
        </div>

        {/* Back button */}
        <a
          href="/dashboard"
          className="block w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-center font-semibold transition-colors"
        >
          Bosh sahifaga qaytish
        </a>
      </div>
    </div>
  );
}
