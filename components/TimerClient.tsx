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

  useEffect(() => {
    document.title = isIdle ? "Pomodoro" : `${formatTime(remaining)} · ${state.mode === "work" ? "Timer" : "Break"}`;
  }, [isIdle, remaining, state]);

  return (
    <section id="timer" className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-4 py-12">
      {banner && (
        <div className="w-full border border-foreground px-4 py-3 text-center text-sm">{banner}</div>
      )}

      {!isIdle && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm uppercase tracking-[0.3em] text-muted">
            {state.mode === "work" ? "Work" : "Break"}
          </span>
          {state.mode === "work" && state.workTitle && (
            <span className="text-lg">{state.workTitle}</span>
          )}
          <span className="font-mono text-7xl font-bold tabular-nums sm:text-8xl">
            {formatTime(remaining)}
          </span>
        </div>
      )}

      {!isIdle ? (
        <div className="flex gap-4">
          {isRunning && (
            <button
              onClick={() => void pause()}
              className="border border-foreground px-6 py-2 text-sm uppercase tracking-wide hover:bg-foreground hover:text-background"
            >
              Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => void resume()}
              className="border border-foreground px-6 py-2 text-sm uppercase tracking-wide hover:bg-foreground hover:text-background"
            >
              Resume
            </button>
          )}
          <button
            onClick={() => void reset()}
            className="border border-foreground px-6 py-2 text-sm uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-6">
          <fieldset className="flex flex-wrap justify-center gap-3">
            {(Object.keys(PRESETS) as Array<Exclude<PresetKey, "custom">>).map((key) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`border border-foreground px-4 py-2 text-sm ${
                  preset === key ? "bg-foreground text-background" : "hover:bg-foreground hover:text-background"
                }`}
              >
                {PRESETS[key].label}
              </button>
            ))}
            <button
              onClick={() => setPreset("custom")}
              className={`border border-foreground px-4 py-2 text-sm ${
                preset === "custom" ? "bg-foreground text-background" : "hover:bg-foreground hover:text-background"
              }`}
            >
              Custom
            </button>
          </fieldset>

          {preset === "custom" && (
            <div className="flex flex-wrap justify-center gap-6">
              <label className="flex flex-col items-center gap-1 text-sm">
                Work (min)
                <input
                  type="number"
                  name="customWorkMinutes"
                  min={MIN_WORK_MINUTES}
                  max={MAX_WORK_MINUTES}
                  value={customWork}
                  onChange={(e) => setCustomWork(Number(e.target.value))}
                  className="w-24 border border-foreground px-2 py-1 text-center"
                />
              </label>
              <label className="flex flex-col items-center gap-1 text-sm">
                Break (min)
                <input
                  type="number"
                  name="customBreakMinutes"
                  min={MIN_BREAK_MINUTES}
                  max={MAX_BREAK_MINUTES}
                  value={customBreak}
                  onChange={(e) => setCustomBreak(Number(e.target.value))}
                  className="w-24 border border-foreground px-2 py-1 text-center"
                />
              </label>
            </div>
          )}

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="work-title" className="text-sm">
              What are you working on?
            </label>
            <input
              id="work-title"
              type="text"
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix authentication vulnerability"
              className="border border-foreground px-3 py-2 focus:outline-none"
            />
          </div>

          <button
            onClick={() => void handleStart()}
            disabled={busy}
            className="border border-foreground px-8 py-3 text-sm uppercase tracking-wide hover:bg-foreground hover:text-background disabled:hover:bg-transparent disabled:hover:text-foreground"
          >
            Start
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
