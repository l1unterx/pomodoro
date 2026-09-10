"use client";

import { useState } from "react";
import type { ChartPeriod, SessionEntry, WorkTimePoint } from "@/lib/stats";
import { formatDurationShort, formatMinutes } from "@/lib/format";
import { updateSessionAction, deleteSessionAction } from "@/lib/actions/stats";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultSelectedKey(points: WorkTimePoint[], period: ChartPeriod): string | null {
  const now = new Date();
  const key =
    period === "year" ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` : todayKey();
  return points.some((p) => p.key === key) ? key : null;
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

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time, no timezone suffix.
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SessionRow({
  session,
  index,
  onChanged,
}: {
  session: SessionEntry;
  index: number;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  const [start, setStart] = useState(() => toLocalInputValue(session.startTime));
  const [end, setEnd] = useState(() => toLocalInputValue(session.endTime));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const del = async () => {
    if (!confirm(`Delete "${session.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteSessionAction(session.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  };

  if (!editing) {
    return (
      <>
        <tr>
          <td className="truncate overflow-hidden py-1 pr-2">
            {index}. {session.title}
          </td>
          <td className="whitespace-nowrap py-1 px-2 text-right tabular-nums">
            {formatDurationShort(session.duration)}
          </td>
          <td className="whitespace-nowrap py-1 pl-2 text-right">
            <button
              onClick={() => setEditing(true)}
              disabled={deleting}
              className="rounded-full px-2 py-0.5 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={del}
              disabled={deleting}
              className="rounded-full px-2 py-0.5 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-red-400 disabled:opacity-50"
            >
              {deleting ? "…" : "Del"}
            </button>
          </td>
        </tr>
        {error && (
          <tr>
            <td colSpan={3} className="pb-1 text-xs text-red-500">
              {error}
            </td>
          </tr>
        )}
      </>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSessionAction(session.id, {
        title,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td colSpan={3} className="py-1">
        <div className="flex flex-col gap-1.5 rounded-lg bg-background p-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
            />
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
            />
          </div>
          {error && <span className="text-xs text-red-500">{error}</span>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-accent px-3 py-1 text-xs text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-full bg-surface px-3 py-1 text-xs text-muted hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
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

export default function SessionHistory({
  points,
  period,
  onChanged,
}: {
  points: WorkTimePoint[];
  period: ChartPeriod;
  onChanged: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(() => defaultSelectedKey(points, period));

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="w-full shrink-0 rounded-3xl border border-border bg-surface p-3 shadow-lg shadow-black/20 backdrop-blur-xl sm:max-w-sm">
        {period === "year" ? (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {points.map((p) => cell(p, monthAbbrev(p.key), "wide"))}
          </div>
        ) : period === "week" ? (
          <div className="grid grid-cols-7 gap-1.5">
            {points.map((p) => (
              <div key={p.key} className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide text-muted">{WEEKDAYS[weekdayIndex(p.key)]}</span>
                {cell(p, dayNumber(p.key), "square", p.key === today)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-wide text-muted">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: points.length > 0 ? weekdayIndex(points[0].key) : 0 }).map((_, i) => (
                <div key={`lead-${i}`} />
              ))}
              {points.map((p) => cell(p, dayNumber(p.key), "square", p.key === today))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-3xl border border-border bg-surface p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {period === "year" ? monthCellLabel(selected.key) : dayCellLabel(selected.key)}
            </span>
            <span className="text-sm tabular-nums text-muted">{formatMinutes(selected.totalSeconds)}</span>
          </div>
          {selected.sessions.length > 0 ? (
            <table className="w-full table-fixed text-sm text-muted">
              <colgroup>
                <col />
                <col className="w-14" />
                <col className="w-24" />
              </colgroup>
              <tbody>
                {selected.sessions.map((session, i) => (
                  <SessionRow key={session.id} session={session} index={i + 1} onChanged={onChanged} />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">No completed work sessions.</p>
          )}
        </div>
      )}
    </div>
  );
}
