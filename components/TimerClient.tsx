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

const RING_SIZE = 256;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="6" y="4" width="4.5" height="16" rx="1.2" />
      <rect x="13.5" y="4" width="4.5" height="16" rx="1.2" />
    </svg>
  );
}

function RestartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3.4-7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 12S5.6 5 12 5s10.5 7 10.5 7-4.1 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M17 9h1.5a2.7 2.7 0 0 1 0 5.4H17" />
      <path d="M7 2.5v2M11 2.5v2M15 2.5v2" />
    </svg>
  );
}

function CircleIconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-muted transition-all hover:scale-105 hover:bg-surface-hover hover:text-foreground disabled:hover:scale-100"
    >
      <span className="h-5 w-5">{children}</span>
    </button>
  );
}

function PillButton({
  onClick,
  disabled,
  accent,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2.5 rounded-full bg-surface-hover px-9 py-3.5 text-sm font-semibold uppercase tracking-widest text-foreground transition-all hover:scale-105 disabled:hover:scale-100"
      style={{ boxShadow: `0 0 0 1px color-mix(in oklab, ${accent} 35%, var(--border)), 0 12px 30px -12px ${accent}` }}
    >
      {children}
    </button>
  );
}

export default function TimerClient({ initialState }: { initialState: ResolvedTimerState }) {
  const { state, remaining, error, banner, busy, start, pause, resume, restart, stop } = useTimer(initialState);

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

  const plannedForRing = isIdle ? workMinutes * 60 : state.plannedDuration;
  const remainingForRing = isIdle ? workMinutes * 60 : remaining;
  const progress = plannedForRing > 0 ? 1 - remainingForRing / plannedForRing : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <section id="timer" className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-12">
      {banner && (
        <div
          className="w-full rounded-2xl border px-4 py-3 text-center text-sm backdrop-blur-xl"
          style={{ borderColor: accent, backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)` }}
        >
          {banner}
        </div>
      )}

      <div className="flex w-full flex-col items-center gap-8 rounded-[2.5rem] border border-border bg-surface px-8 py-10 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:px-12">
        <div className="relative flex shrink-0 items-center justify-center" style={{ height: RING_SIZE, width: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={accent}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 14px ${accent})` }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span style={{ color: isIdle ? "var(--muted)" : accent }}>
              {isIdle ? (
                <PlayIcon className="h-5 w-5" />
              ) : state.mode === "work" ? (
                <EyeIcon className="h-5 w-5" />
              ) : (
                <CoffeeIcon className="h-5 w-5" />
              )}
            </span>
            <span className="font-mono text-5xl font-bold tabular-nums">{formatTime(remainingForRing)}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
              {isIdle ? "Ready" : state.mode === "work" ? "Focus" : "Break"}
            </span>
            {!isIdle && state.mode === "work" && state.workTitle && (
              <span className="max-w-40 truncate text-xs text-muted">{state.workTitle}</span>
            )}
          </div>
        </div>

        {!isIdle ? (
          <div className="flex items-center gap-5">
            <CircleIconButton onClick={() => void restart()} label="Restart">
              <RestartIcon className="h-full w-full" />
            </CircleIconButton>
            {isRunning && (
              <PillButton onClick={() => void pause()} accent={accent}>
                <PauseIcon className="h-4 w-4" />
                Pause
              </PillButton>
            )}
            {isPaused && (
              <PillButton onClick={() => void resume()} accent={accent}>
                <PlayIcon className="h-4 w-4" />
                Resume
              </PillButton>
            )}
            <CircleIconButton onClick={() => void stop()} label="Stop">
              <StopIcon className="h-full w-full" />
            </CircleIconButton>
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

            <PillButton onClick={() => void handleStart()} disabled={busy} accent={accent}>
              <PlayIcon className="h-4 w-4" />
              Start
            </PillButton>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
