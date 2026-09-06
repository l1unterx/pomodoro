"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startTimerAction,
  pauseTimerAction,
  resumeTimerAction,
  resetTimerAction,
  syncTimerAction,
} from "@/lib/actions/timer";
import type { ResolvedTimerState } from "@/lib/timer";
import { unlockAudio, playWorkCompleteSound, playBreakCompleteSound } from "@/lib/sound";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";
import { validateTitle } from "@/lib/validation";

const BANNER_DURATION_MS = 8000;

function initialRemaining(state: ResolvedTimerState): number {
  if (state.status === "running") return Math.max(0, (new Date(state.endsAt).getTime() - Date.now()) / 1000);
  if (state.status === "paused") return state.remainingSeconds;
  return 0;
}

/**
 * Owns the active timer's state and its sync with the server. The server is
 * always the source of truth (see lib/timer.ts): this hook's local interval
 * only drives a smooth per-second display and asks the server to resolve the
 * authoritative state at zero, on tab focus, and on every user action.
 */
export function useTimer(initialState: ResolvedTimerState) {
  const router = useRouter();
  const [state, setState] = useState<ResolvedTimerState>(initialState);
  const [remaining, setRemaining] = useState(() => initialRemaining(initialState));
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const syncingRef = useRef(false);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyState = useCallback(
    (next: ResolvedTimerState) => {
      const justCompleted = next.status !== "paused" ? next.justCompleted : undefined;

      if (justCompleted === "work") {
        playWorkCompleteSound();
        showNotification("Work session complete", "Time for a break.");
        setBanner("Work session complete! Break started.");
      } else if (justCompleted === "break") {
        playBreakCompleteSound();
        showNotification("Break is over", "Ready for another session?");
        setBanner("Break is over. Start another session when you're ready.");
      }
      if (justCompleted) {
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = setTimeout(() => setBanner(null), BANNER_DURATION_MS);
        // A work session was just persisted (or a break just ended): refresh
        // the server-rendered history/stats/leaderboard sections so they
        // don't sit stale until the next full page load.
        router.refresh();
      }
      setState(next);
      setRemaining(initialRemaining(next));
    },
    [router],
  );

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      applyState(await syncTimerAction());
    } catch {
      // transient network error; the next tick or visibility change will retry
    } finally {
      syncingRef.current = false;
    }
  }, [applyState]);

  // Local per-second countdown for a smooth display; the server call above
  // (triggered at zero) is the authoritative source for phase transitions.
  useEffect(() => {
    if (state.status !== "running") return;
    const target = new Date(state.endsAt).getTime();

    const id = setInterval(() => {
      const msLeft = target - Date.now();
      setRemaining(Math.max(0, msLeft / 1000));
      if (msLeft <= 0) {
        void handleSync();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [state, handleSync]);

  // Safety net: resync whenever the tab regains focus/visibility, in case a
  // transition happened while the browser was backgrounded or closed.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") void handleSync();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [handleSync]);

  const start = async (workMinutes: number, breakMinutes: number, title: string) => {
    setError(null);
    const trimmedTitle = title.trim();
    const titleError = validateTitle(trimmedTitle);
    if (titleError) {
      setError(titleError);
      return false;
    }

    unlockAudio();
    requestNotificationPermission();
    setBusy(true);
    try {
      applyState(await startTimerAction(workMinutes, breakMinutes, trimmedTitle));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start session.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const pause = async () => {
    try {
      applyState(await pauseTimerAction());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not pause session.");
    }
  };

  const resume = async () => {
    try {
      applyState(await resumeTimerAction());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resume session.");
    }
  };

  const reset = async () => {
    try {
      applyState(await resetTimerAction());
      setBanner(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset session.");
    }
  };

  return { state, remaining, error, banner, busy, start, pause, resume, reset };
}
