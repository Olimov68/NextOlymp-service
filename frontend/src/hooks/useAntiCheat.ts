"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ViolationType =
  | "fullscreen"
  | "tabSwitch"
  | "copyPaste"
  | "screenshot"
  | "devtools"
  | "rightClick";

export interface ViolationCounts {
  fullscreen: number;
  tabSwitch: number;
  copyPaste: number;
  screenshot: number;
  devtools: number;
  rightClick: number;
  total: number;
}

export interface UseAntiCheatOptions {
  enabled: boolean;
  maxFullscreenViolations?: number; // default 5
  maxTabSwitchViolations?: number; // default 5
  maxCopyPasteViolations?: number; // default 4
  onKickedOut: () => void; // called when max violations reached
  // Backend reporting (optional)
  attemptId?: number;
  attemptType?: "olympiad" | "mock_test";
  apiUrl?: string;
  token?: string;
  onAutoSubmit?: () => void;
}

export interface WarningState {
  message: string;
  type: ViolationType | null;
  current: number;
  max: number;
}

export interface UseAntiCheatReturn {
  violations: ViolationCounts;
  isKickedOut: boolean;
  kickReason: ViolationType | null;
  warning: WarningState | null;
  dismissWarning: () => void;
  requestFullscreen: () => void;
  // Legacy compat
  violationCount: number;
  maxViolations: number;
  reportViolation: (type: string, severity?: string, metadata?: Record<string, unknown>) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAntiCheat(options: UseAntiCheatOptions): UseAntiCheatReturn {
  const {
    enabled,
    maxFullscreenViolations = 5,
    maxTabSwitchViolations = 5,
    maxCopyPasteViolations = 4,
    onKickedOut,
    onAutoSubmit,
    attemptId,
    attemptType,
    apiUrl,
    token,
  } = options;

  // ─── State ──────────────────────────────────────────────────────────────────

  const [violations, setViolations] = useState<Omit<ViolationCounts, "total">>({
    fullscreen: 0,
    tabSwitch: 0,
    copyPaste: 0,
    screenshot: 0,
    devtools: 0,
    rightClick: 0,
  });
  const [isKickedOut, setIsKickedOut] = useState(false);
  const [kickReason, setKickReason] = useState<ViolationType | null>(null);
  const [warning, setWarning] = useState<WarningState | null>(null);

  const isKickedOutRef = useRef(false);
  const violationsRef = useRef(violations);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurDebounceRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  // Total violations
  const totalViolations = useMemo(
    () =>
      violations.fullscreen +
      violations.tabSwitch +
      violations.copyPaste +
      violations.screenshot +
      violations.devtools +
      violations.rightClick,
    [violations]
  );

  const violationCounts: ViolationCounts = useMemo(
    () => ({ ...violations, total: totalViolations }),
    [violations, totalViolations]
  );

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const kick = useCallback(
    (reason: ViolationType) => {
      if (isKickedOutRef.current) return;
      isKickedOutRef.current = true;
      setIsKickedOut(true);
      setKickReason(reason);
      setWarning(null);

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Trigger callbacks
      setTimeout(() => {
        onKickedOut();
        onAutoSubmit?.();
      }, 500);
    },
    [onKickedOut, onAutoSubmit]
  );

  const showWarning = useCallback(
    (message: string, type: ViolationType, current: number, max: number) => {
      setWarning({ message, type, current, max });

      // Clear previous timer
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }

      // Auto-dismiss after 5 seconds
      warningTimerRef.current = setTimeout(() => {
        setWarning(null);
      }, 5000);
    },
    []
  );

  const dismissWarning = useCallback(() => {
    setWarning(null);
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  // ─── Backend reporting (optional) ──────────────────────────────────────────

  const reportToBackend = useCallback(
    async (type: string, severity: string = "warning", metadata?: Record<string, unknown>) => {
      if (!apiUrl || !token || !attemptId) return;
      try {
        await fetch(`${apiUrl}/user/anticheat/violations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attempt_id: attemptId,
            attempt_type: attemptType,
            type,
            severity,
            metadata,
          }),
        });
      } catch {
        // Network error
      }
    },
    [apiUrl, token, attemptId, attemptType]
  );

  // ─── Add violation ─────────────────────────────────────────────────────────

  const addViolation = useCallback(
    (type: ViolationType) => {
      if (isKickedOutRef.current || !enabled) return;

      const current = violationsRef.current;
      const newCount = current[type] + 1;

      // Update state
      const updated = { ...current, [type]: newCount };
      violationsRef.current = updated;
      setViolations(updated);

      // Determine max for this type
      let max = Infinity;
      let warningMsg = "";
      switch (type) {
        case "fullscreen": {
          max = maxFullscreenViolations;
          const remaining = max - newCount;
          warningMsg = `Iltimos, to'liq ekran rejimiga qayting. ${remaining} ta imkoniyatingiz qoldi`;
          break;
        }
        case "tabSwitch": {
          max = maxTabSwitchViolations;
          const remaining = max - newCount;
          warningMsg = `Boshqa oynaga o'tdingiz! ${remaining} ta imkoniyat qoldi`;
          break;
        }
        case "copyPaste": {
          max = maxCopyPasteViolations;
          warningMsg = "Nusxalash taqiqlangan!";
          break;
        }
        case "screenshot": {
          warningMsg = "Skrinshot olish taqiqlangan!";
          max = maxCopyPasteViolations;
          break;
        }
        case "devtools": {
          warningMsg = "Dasturchi vositalari taqiqlangan!";
          max = maxFullscreenViolations;
          break;
        }
        case "rightClick": {
          warningMsg = "Sichqoncha o'ng tugmasi taqiqlangan!";
          max = Infinity; // right-click alone doesn't cause kick
          break;
        }
      }

      // Report to backend
      const severityMap: Record<ViolationType, string> = {
        fullscreen: "warning",
        tabSwitch: "warning",
        copyPaste: "warning",
        screenshot: "critical",
        devtools: "critical",
        rightClick: "info",
      };
      reportToBackend(type, severityMap[type], { count: newCount });

      // Check if should kick
      if (newCount >= max) {
        kick(type);
        return;
      }

      // Show warning
      showWarning(warningMsg, type, newCount, max);
    },
    [
      enabled,
      maxFullscreenViolations,
      maxTabSwitchViolations,
      maxCopyPasteViolations,
      kick,
      showWarning,
      reportToBackend,
    ]
  );

  // ─── Fullscreen ────────────────────────────────────────────────────────────

  const requestFullscreen = useCallback(() => {
    if (!enabled) return;
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, [enabled]);

  // ─── Event handlers ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;

    // --- Fullscreen change ---
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isKickedOutRef.current) {
        addViolation("fullscreen");
      }
    };

    // --- Visibility change (tab switch) ---
    const handleVisibilityChange = () => {
      if (document.hidden && !isKickedOutRef.current) {
        addViolation("tabSwitch");
      }
    };

    // --- Window blur (alt-tab) ---
    const handleBlur = () => {
      if (isKickedOutRef.current) return;
      // Debounce to avoid double-counting with fullscreen exit
      if (blurDebounceRef.current) return;
      blurDebounceRef.current = true;
      setTimeout(() => {
        blurDebounceRef.current = false;
      }, 500);
      // Only count if not already counted as visibility change
      if (!document.hidden) {
        addViolation("tabSwitch");
      }
    };

    // --- Copy/Paste/Cut ---
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copyPaste");
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copyPaste");
    };
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copyPaste");
    };

    // --- Right click ---
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("rightClick");
    };

    // --- Select start ---
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // --- Keyboard shortcuts ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isKickedOutRef.current) return;

      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        addViolation("screenshot");
        return;
      }

      // Ctrl+Shift+S (screenshot / save)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        addViolation("screenshot");
        return;
      }

      // F12 (devtools)
      if (e.key === "F12") {
        e.preventDefault();
        addViolation("devtools");
        return;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (devtools)
      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["i", "j", "c"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        addViolation("devtools");
        return;
      }

      // Ctrl+U (view source)
      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        addViolation("devtools");
        return;
      }

      // Ctrl+A (select all)
      if (e.ctrlKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        addViolation("copyPaste");
        return;
      }

      // Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && ["c", "v", "x"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        addViolation("copyPaste");
        return;
      }
    };

    // --- DevTools detection (resize heuristic) ---
    let devToolsDetected = false;
    const handleResize = () => {
      if (isKickedOutRef.current) return;
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if ((widthThreshold || heightThreshold) && !devToolsDetected) {
        devToolsDetected = true;
        addViolation("devtools");
      } else if (!widthThreshold && !heightThreshold) {
        devToolsDetected = false;
      }
    };

    // --- Offline detection ---
    const handleOffline = () => {
      reportToBackend("offline", "warning");
    };

    // ─── Register events ─────────────────────────────────────────────────────

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize);
    window.addEventListener("offline", handleOffline);

    // CSS: prevent text selection
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("offline", handleOffline);

      // Restore CSS
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [enabled, addViolation, reportToBackend]);

  // Cleanup warning timer on unmount
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, []);

  // ─── Legacy reportViolation ────────────────────────────────────────────────

  const reportViolation = useCallback(
    (type: string, severity: string = "warning", metadata?: Record<string, unknown>) => {
      const typeMap: Record<string, ViolationType> = {
        copy_paste: "copyPaste",
        tab_switch: "tabSwitch",
        blur: "tabSwitch",
        devtools: "devtools",
        right_click: "rightClick",
        screenshot: "screenshot",
        fullscreen: "fullscreen",
      };
      const mapped = typeMap[type];
      if (mapped) {
        addViolation(mapped);
      } else {
        reportToBackend(type, severity, metadata);
      }
    },
    [addViolation, reportToBackend]
  );

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    violations: violationCounts,
    isKickedOut,
    kickReason,
    warning,
    dismissWarning,
    requestFullscreen,
    // Legacy compat
    violationCount: totalViolations,
    maxViolations:
      maxFullscreenViolations + maxTabSwitchViolations + maxCopyPasteViolations,
    reportViolation,
  };
}
