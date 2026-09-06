"use client";

import { useState, useTransition } from "react";
import { getWorkTimeSeriesAction } from "@/lib/actions/stats";
import type { ChartPeriod, WorkTimePoint } from "@/lib/stats";
import { formatDuration, formatMinutes } from "@/lib/format";

const CHART_HEIGHT = 160;
const BAR_GAP = 4;

const PERIODS: { key: ChartPeriod; label: string }[] = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "year", label: "Yearly" },
];

function formatLabel(key: string, period: ChartPeriod): string {
  if (period === "year") {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sampleStdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export default function WorkTimeChart({
  initialPoints,
  initialPeriod,
}: {
  initialPoints: WorkTimePoint[];
  initialPeriod: ChartPeriod;
}) {
  const [period, setPeriod] = useState(initialPeriod);
  const [points, setPoints] = useState(initialPoints);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (next: ChartPeriod) => {
    setPeriod(next);
    startTransition(async () => {
      const data = await getWorkTimeSeriesAction(next);
      setPoints(data);
    });
  };

  const totals = points.map((p) => p.totalSeconds);
  const maxSeconds = Math.max(1, ...totals);
  const avg = mean(totals);
  const std = sampleStdDev(totals, avg);
  const stdIsLow = std < avg;
  const stdColor = stdIsLow ? "#ef4444" : "#22c55e";

  const barWidth = points.length > 0 ? 100 / points.length : 0;

  const valueToY = (value: number) => {
    const clamped = Math.max(0, Math.min(value, maxSeconds));
    return CHART_HEIGHT - (clamped / maxSeconds) * (CHART_HEIGHT - 8);
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap gap-3">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePeriodChange(p.key)}
            className={`border border-foreground px-4 py-1.5 text-sm ${
              period === p.key ? "bg-foreground text-background" : "hover:bg-foreground hover:text-background"
            }`}
          >
            {p.label}
          </button>
        ))}
      </fieldset>

      <div className={`flex flex-col gap-3 ${isPending ? "opacity-50" : ""}`}>
        <svg
          role="img"
          aria-label="Work time per period"
          viewBox={`0 0 100 ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-40 w-full"
        >
          <line
            x1="0"
            y1={CHART_HEIGHT - 0.5}
            x2="100"
            y2={CHART_HEIGHT - 0.5}
            stroke="var(--muted)"
            strokeWidth="0.5"
          />

          {points.map((p, i) => {
            const heightRatio = p.totalSeconds / maxSeconds;
            const barHeight = Math.max(p.totalSeconds > 0 ? 2 : 0, heightRatio * (CHART_HEIGHT - 8));
            const x = i * barWidth + BAR_GAP / 4;
            const w = Math.max(0, barWidth - BAR_GAP / 2);
            const titleText = p.titles.length > 0 ? ` — ${p.titles.join(", ")}` : "";
            return (
              <rect key={p.key} x={x} y={CHART_HEIGHT - barHeight} width={w} height={barHeight} fill="var(--foreground)">
                <title>{`${formatLabel(p.key, period)}: ${formatMinutes(p.totalSeconds)}${titleText}`}</title>
              </rect>
            );
          })}

          <line
            x1="0"
            x2="100"
            y1={valueToY(avg)}
            y2={valueToY(avg)}
            stroke="#9ca3af"
            strokeWidth="0.6"
            strokeDasharray="3 2"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            x2="100"
            y1={valueToY(std)}
            y2={valueToY(std)}
            stroke={stdColor}
            strokeWidth="0.6"
            strokeDasharray="3 2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: "#9ca3af" }} />
            Average: {formatDuration(avg)}
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: stdColor }} />
            Std. deviation: {formatDuration(std)}
          </span>
        </div>

        <div className="flex justify-between text-xs text-muted">
          <span>{points.length > 0 ? formatLabel(points[0].key, period) : ""}</span>
          <span>{points.length > 0 ? formatLabel(points[points.length - 1].key, period) : ""}</span>
        </div>
      </div>

      <details>
        <summary className="cursor-pointer text-xs text-muted hover:text-foreground">View as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-120 border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-foreground/30">
                <th className="py-1 pr-4 font-normal">Date</th>
                <th className="py-1 pr-4 font-normal">Title</th>
                <th className="py-1 font-normal">Work time</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.key} className="border-b border-foreground/10">
                  <td className="py-1 pr-4 align-top">{formatLabel(p.key, period)}</td>
                  <td className="py-1 pr-4 align-top text-muted">{p.titles.length > 0 ? p.titles.join(", ") : "—"}</td>
                  <td className="py-1 align-top">{formatMinutes(p.totalSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
