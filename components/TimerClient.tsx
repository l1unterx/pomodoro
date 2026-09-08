"use client";

import { useEffect, useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import type { ResolvedTimerState } from "@/lib/timer";
import {
  MIN_WORK_MINUTES,
  MAX_WORK_MINUTES,
  MIN_BREAK_MINUTES,
  MAX_BREAK_MINUTES,
  MAX_TITLE_LENGTH,
} from "@/lib/validation";

type PresetKey = "30-5" | "45-10" | "60-15" | "custom";

const PRESETS: Record<Exclude<PresetKey, "custom">, { work: number; brk: number; label: string }> = {
  "30-5": { work: 30, brk: 5, label: "30 / 5" },
  "45-10": { work: 45, brk: 10, label: "45 / 10" },
  "60-15": { work: 60, brk: 15, label: "60 / 15" },
};

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function TimerClient({ initialState }: { initialState: ResolvedTimerState }) {
  const { state, remaining, error, banner, busy, start, pause, resume, reset } = useTimer(initialState);

  const [preset, setPreset] = useState<PresetKey>("30-5");
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [title, setTitle] = useState("");

  const workMinutes = preset === "custom" ? customWork : PRESETS[preset].work;
  const breakMinutes = preset === "custom" ? customBreak : PRESETS[preset].brk;

  const handleStart = async () => {
    const started = await start(workMinutes, breakMinutes, title);
    if (started) setTitle("");
  };

  const isIdle = state.status === "idle";
  const isRunning = state.status === "running";
  const isPaused = state.status === "paused";
  const accent = !isIdle && state.mode === "break" ? "var(--accent-break)" : "var(--accent)";

  useEffect(() => {
    document.title = isIdle ? "Pomodoro" : `${formatTime(remaining)} · ${state.mode === "work" ? "Timer" : "Break"}`;
  }, [isIdle, remaining, state]);

  return (
    <section id="timer" className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-4 py-12">
      {banner && (
        <div
          className="w-full rounded-2xl border px-4 py-3 text-center text-sm backdrop-blur-xl"
          style={{ borderColor: accent, backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)` }}
        >
          {banner}
        </div>
      )}

      {!isIdle && (
        <div
          className="flex h-72 w-72 flex-col items-center justify-center gap-2 rounded-full border-2 bg-surface backdrop-blur-2xl"
          style={{ borderColor: accent, boxShadow: `0 0 70px -20px ${accent}` }}
        >
          <span className="rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: accent }}>
            {state.mode === "work" ? "Work" : "Break"}
          </span>
          <span className="font-mono text-6xl font-bold tabular-nums">{formatTime(remaining)}</span>
          {state.mode === "work" && state.workTitle && (
            <span className="max-w-56 truncate text-sm text-muted">{state.workTitle}</span>
          )}
        </div>
      )}

      {!isIdle ? (
        <div className="flex gap-3">
          {isRunning && (
            <button
              onClick={() => void pause()}
              className="rounded-full px-6 py-2 text-sm font-medium uppercase tracking-wide text-background transition-transform hover:scale-105"
              style={{ backgroundColor: accent }}
            >
              Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => void resume()}
              className="rounded-full px-6 py-2 text-sm font-medium uppercase tracking-wide text-background transition-transform hover:scale-105"
              style={{ backgroundColor: accent }}
            >
              Resume
            </button>
          )}
          <button
            onClick={() => void reset()}
            className="rounded-full border border-border bg-surface px-6 py-2 text-sm font-medium uppercase tracking-wide transition-colors hover:bg-surface-hover"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-6">
          <fieldset className="flex flex-wrap justify-center gap-2">
            {(Object.keys(PRESETS) as Array<Exclude<PresetKey, "custom">>).map((key) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  preset === key
                    ? "bg-accent text-background"
                    : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {PRESETS[key].label}
              </button>
            ))}
            <button
              onClick={() => setPreset("custom")}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                preset === "custom"
                  ? "bg-accent text-background"
                  : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              Custom
            </button>
          </fieldset>

          {preset === "custom" && (
            <div className="flex flex-wrap justify-center gap-6">
              <label className="flex flex-col items-center gap-1 text-sm text-muted">
                Work (min)
                <input
                  type="number"
                  name="customWorkMinutes"
                  min={MIN_WORK_MINUTES}
                  max={MAX_WORK_MINUTES}
                  value={customWork}
                  onChange={(e) => setCustomWork(Number(e.target.value))}
                  className="w-24 rounded-xl border border-border bg-surface px-2 py-1.5 text-center text-foreground focus:border-accent focus:outline-none"
                />
              </label>
              <label className="flex flex-col items-center gap-1 text-sm text-muted">
                Break (min)
                <input
                  type="number"
                  name="customBreakMinutes"
                  min={MIN_BREAK_MINUTES}
                  max={MAX_BREAK_MINUTES}
                  value={customBreak}
                  onChange={(e) => setCustomBreak(Number(e.target.value))}
                  className="w-24 rounded-xl border border-border bg-surface px-2 py-1.5 text-center text-foreground focus:border-accent focus:outline-none"
                />
              </label>
            </div>
          )}

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="work-title" className="text-sm text-muted">
              What are you working on?
            </label>
            <input
              id="work-title"
              type="text"
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix authentication vulnerability"
              className="rounded-xl border border-border bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </div>

          <button
            onClick={() => void handleStart()}
            disabled={busy}
            className="rounded-full bg-accent px-10 py-3 text-sm font-semibold uppercase tracking-wide text-background shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:hover:scale-100"
          >
            Start
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
