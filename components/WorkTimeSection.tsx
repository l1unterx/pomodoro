"use client";

import { useState, useTransition } from "react";
import { getWorkTimeSeriesAction } from "@/lib/actions/stats";
import type { ChartPeriod, WorkTimePoint } from "@/lib/stats";
import WorkTimeChart from "@/components/WorkTimeChart";
import SessionHistory from "@/components/SessionHistory";

const PERIODS: { key: ChartPeriod; label: string }[] = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "year", label: "Yearly" },
];

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
    new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(points[0].key)} – ${fmt(points[points.length - 1].key)}`;
}

export default function WorkTimeSection({
  initialPoints,
  initialPeriod,
}: {
  initialPoints: WorkTimePoint[];
  initialPeriod: ChartPeriod;
}) {
  const [period, setPeriod] = useState(initialPeriod);
  const [offset, setOffset] = useState(0);
  const [points, setPoints] = useState(initialPoints);
  const [isPending, startTransition] = useTransition();

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
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-4">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted">Work time over time</h3>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <fieldset className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePeriodChange(p.key)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  period === p.key
                    ? "bg-accent text-background"
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
            <span className="min-w-32 text-center text-muted">{rangeLabel(points, period)}</span>
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

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">Session history</h2>
        <div className={isPending ? "opacity-50" : ""}>
          <SessionHistory points={points} period={period} />
        </div>
      </section>
    </>
  );
}
