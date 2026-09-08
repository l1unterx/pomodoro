"use client";

import { useState } from "react";
import type { ChartPeriod, WorkTimePoint } from "@/lib/stats";
import { formatMinutes } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayNumber(key: string): string {
  return String(Number(key.slice(8, 10)));
}

function weekdayIndex(key: string): number {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}

function dayCellLabel(key: string): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function monthCellLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function monthAbbrev(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}

function intensityStyle(totalSeconds: number, maxSeconds: number, isToday: boolean) {
  const ratio = maxSeconds > 0 ? totalSeconds / maxSeconds : 0;
  const bg =
    ratio > 0
      ? `color-mix(in oklab, var(--accent) ${Math.round(15 + ratio * 85)}%, var(--surface))`
      : "var(--surface)";
  return {
    backgroundColor: bg,
    boxShadow: isToday ? "inset 0 0 0 2px var(--accent)" : undefined,
  };
}

export default function SessionHistory({ points, period }: { points: WorkTimePoint[]; period: ChartPeriod }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const maxSeconds = Math.max(1, ...points.map((p) => p.totalSeconds));
  const selected = points.find((p) => p.key === selectedKey) ?? null;
  const today = todayKey();

  const cell = (p: WorkTimePoint, label: string, shape: "square" | "wide", isToday = false) => (
    <button
      key={p.key}
      onClick={() => setSelectedKey(p.key === selectedKey ? null : p.key)}
      style={intensityStyle(p.totalSeconds, maxSeconds, isToday)}
      className={`group relative flex flex-col items-center justify-center gap-1 rounded-lg text-xs transition-transform hover:scale-105 hover:z-10 ${
        shape === "square" ? "aspect-square" : "py-3"
      } ${p.key === selectedKey ? "ring-2 ring-foreground" : ""}`}
    >
      <span className={p.totalSeconds > 0 ? "font-semibold" : "text-muted"}>{label}</span>

      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        <span className="block font-medium">{period === "year" ? monthCellLabel(p.key) : dayCellLabel(p.key)}</span>
        <span className="block text-background/70">{formatMinutes(p.totalSeconds)}</span>
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
        {period === "year" ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {points.map((p) => cell(p, monthAbbrev(p.key), "wide"))}
          </div>
        ) : period === "week" ? (
          <div className="grid grid-cols-7 gap-2">
            {points.map((p) => (
              <div key={p.key} className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide text-muted">{WEEKDAYS[weekdayIndex(p.key)]}</span>
                {cell(p, dayNumber(p.key), "square", p.key === today)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-wide text-muted">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: points.length > 0 ? weekdayIndex(points[0].key) : 0 }).map((_, i) => (
                <div key={`lead-${i}`} />
              ))}
              {points.map((p) => cell(p, dayNumber(p.key), "square", p.key === today))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {period === "year" ? monthCellLabel(selected.key) : dayCellLabel(selected.key)}
            </span>
            <span className="text-sm tabular-nums text-muted">{formatMinutes(selected.totalSeconds)}</span>
          </div>
          {selected.titles.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm text-muted">
              {selected.titles.map((title, i) => (
                <li key={i}>· {title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No completed work sessions.</p>
          )}
        </div>
      )}
    </div>
  );
}
