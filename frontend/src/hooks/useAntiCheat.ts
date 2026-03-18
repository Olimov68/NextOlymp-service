"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";

interface AntiCheatConfig {
  attemptId: number;
  attemptType: "olympiad" | "mock_test";
  enabled: boolean;
  onAutoSubmit?: () => void;
  maxViolations?: number;
  apiUrl: string;
  token: string;
}

interface ViolationReport {
  attempt_id: number;
  attempt_type: string;
  type: string;
  severity: string;
  metadata?: Record<string, unknown>;
}

export function useAntiCheat(config: AntiCheatConfig) {
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(config.maxViolations || 10);
  const violationCountRef = useRef(0);

  const reportViolation = useCallback(
    async (type: string, severity: string = "warning", metadata?: Record<string, unknown>) => {
      if (!config.enabled) return;

      violationCountRef.current += 1;
      setViolationCount(violationCountRef.current);

      const report: ViolationReport = {
        attempt_id: config.attemptId,
        attempt_type: config.attemptType,
        type,
        severity,
        metadata,
      };

      try {
        const res = await fetch(`${config.apiUrl}/user/anticheat/violations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.token}`,
          },
          body: JSON.stringify(report),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.data?.max_violations) {
            setMaxViolations(data.data.max_violations);
          }
          if (data?.data?.auto_submit) {
            toast.error("Qoidabuzarliklar chegarasi oshdi! Test avtomatik topshirilmoqda...");
            setTimeout(() => config.onAutoSubmit?.(), 2000);
            return;
          }
        }
      } catch {
        // Network error — ignore
      }

      // Warning toast
      const remaining = maxViolations - violationCountRef.current;
      if (remaining > 0 && remaining <= 3) {
        toast.warning(`Ogohlantirish! Yana ${remaining} ta qoidabuzarlik — test avtomatik topshiriladi.`);
      } else if (violationCountRef.current <= maxViolations) {
        toast.warning(`Qoidabuzarlik aniqlandi: ${type.replace("_", " ")}`);
      }
    },
    [config, maxViolations]
  );

  useEffect(() => {
    if (!config.enabled) return;

    // 1. Copy/Paste/Cut bloklash
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("copy_paste", "warning");
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("copy_paste", "warning");
    };
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("copy_paste", "warning");
    };

    // 2. Right click bloklash
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation("right_click", "info");
    };

    // 3. Select all bloklash
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // 4. Tab switch / visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation("tab_switch", "warning", {
          timestamp: new Date().toISOString(),
        });
      }
    };

    // 5. Window blur
    const handleBlur = () => {
      reportViolation("blur", "warning", {
        timestamp: new Date().toISOString(),
      });
    };

    // 6. DevTools detection (resize heuristic)
    let devToolsOpen = false;
    const handleResize = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if ((widthThreshold || heightThreshold) && !devToolsOpen) {
        devToolsOpen = true;
        reportViolation("devtools", "critical", {
          outer: { w: window.outerWidth, h: window.outerHeight },
          inner: { w: window.innerWidth, h: window.innerHeight },
        });
      } else if (!widthThreshold && !heightThreshold) {
        devToolsOpen = false;
      }
    };

    // 7. Keyboard shortcuts bloklash (F12, Ctrl+Shift+I, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        reportViolation("devtools", "critical");
        return;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) {
        e.preventDefault();
        reportViolation("devtools", "critical");
        return;
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        reportViolation("devtools", "warning");
        return;
      }
      // Ctrl+A (select all)
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        return;
      }
      // Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && ["c", "v", "x"].includes(e.key)) {
        e.preventDefault();
        reportViolation("copy_paste", "warning");
        return;
      }
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        reportViolation("screenshot", "critical");
      }
    };

    // 8. Online/offline
    const handleOffline = () => {
      reportViolation("offline", "warning");
    };

    // Event listener larni qo'shish
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize);
    window.addEventListener("offline", handleOffline);

    // CSS orqali text select o'chirish
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("offline", handleOffline);

      // CSS ni qaytarish
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [config.enabled, reportViolation]);

  return {
    violationCount,
    maxViolations,
    reportViolation,
  };
}
