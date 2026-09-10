"use client";

import { useState, useTransition } from "react";
import { getWorkTimeSeriesAction } from "@/lib/actions/stats";
import type { ChartPeriod, SessionEntry, WorkTimePoint } from "@/lib/stats";
import { formatDuration } from "@/lib/format";
import StatCard from "@/components/StatCard";
import WorkTimeChart from "@/components/WorkTimeChart";
import SessionHistory from "@/components/SessionHistory";

const PERIODS: { key: ChartPeriod; label: string }[] = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "year", label: "Yearly" },
];

function periodStats(points: WorkTimePoint[]) {
  const durations = points.flatMap((p) =>
    p.sessions.map((s: SessionEntry) => s.duration),
  );
  const totalWorkSeconds = durations.reduce((a, b) => a + b, 0);
  const completedSessions = durations.length;
  const averageDurationSeconds =
    completedSessions > 0 ? totalWorkSeconds / completedSessions : 0;
  const stdDevSeconds =
    completedSessions > 1
      ? Math.sqrt(
          durations.reduce(
            (sum, d) => sum + (d - averageDurationSeconds) ** 2,
            0,
          ) /
            (completedSessions - 1),
        )
      : 0;
  return {
    totalWorkSeconds,
    completedSessions,
    averageDurationSeconds,
    stdDevSeconds,
  };
}

function rangeLabel(points: WorkTimePoint[], period: ChartPeriod): string {
  if (points.length === 0) return "";
  if (period === "year") return points[0].key.slice(0, 4);
  if (period === "month") {
    const [y, m] = points[0].key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const fmt = (key: string) =>
    new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(points[0].key)} – ${fmt(points[points.length - 1].key)}`;
}

export default function WorkTimeSection({
  initialPoints,
  initialPeriod,
  todaySeconds,
}: {
  initialPoints: WorkTimePoint[];
  initialPeriod: ChartPeriod;
  todaySeconds: number;
}) {
  const [period, setPeriod] = useState(initialPeriod);
  const [offset, setOffset] = useState(0);
  const [points, setPoints] = useState(initialPoints);
  const [isPending, startTransition] = useTransition();

  const stats = periodStats(points);

  const fetchPoints = (nextPeriod: ChartPeriod, nextOffset: number) => {
    startTransition(async () => {
      setPoints(await getWorkTimeSeriesAction(nextPeriod, nextOffset));
    });
  };

  const handlePeriodChange = (next: ChartPeriod) => {
    setPeriod(next);
    setOffset(0);
    fetchPoints(next, 0);
  };

  const handlePrev = () => {
    const next = offset + 1;
    setOffset(next);
    fetchPoints(period, next);
  };

  const handleNext = () => {
    if (offset === 0) return;
    const next = offset - 1;
    setOffset(next);
    fetchPoints(period, next);
  };

  return (
    <>
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 sm:gap-8 sm:pt-8">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">
          Your statistics
        </h2>
        <div
          className={`grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-4 ${isPending ? "opacity-50" : ""}`}
        >
          <StatCard
            className="col-span-2 sm:col-span-1"
            label="Today"
            value={formatDuration(todaySeconds)}
          />
          <StatCard
            label="Total time"
            value={formatDuration(stats.totalWorkSeconds)}
          />
          <StatCard label="Sessions" value={String(stats.completedSessions)} />
          <StatCard
            label="Avg. session"
            value={formatDuration(stats.averageDurationSeconds)}
          />
          <StatCard
            label="Std. deviation"
            value={formatDuration(stats.stdDevSeconds)}
          />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-6 sm:pt-8">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted">
          Work time over time
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <fieldset className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePeriodChange(p.key)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  period === p.key
                    ? "bg-accent text-white"
                    : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </fieldset>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={handlePrev}
              aria-label="Previous period"
              className="rounded-full bg-surface px-3 py-1.5 transition-colors hover:bg-surface-hover"
            >
              ‹
            </button>
            <span className="min-w-32 text-center text-muted">
              {rangeLabel(points, period)}
            </span>
            <button
              onClick={handleNext}
              disabled={offset === 0}
              aria-label="Next period"
              className="rounded-full bg-surface px-3 py-1.5 transition-colors hover:bg-surface-hover disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>

        <div
          className={`rounded-3xl border border-border bg-surface p-4 shadow-lg shadow-black/20 backdrop-blur-xl ${isPending ? "opacity-50" : ""}`}
        >
          <WorkTimeChart points={points} period={period} />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6 sm:pt-8">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">
          Session history
        </h2>
        <div className={isPending ? "opacity-50" : ""}>
          <SessionHistory
            points={points}
            period={period}
            onChanged={() => fetchPoints(period, offset)}
          />
        </div>
      </section>
    </>
  );
}
