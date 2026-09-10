"use client";

import { useState } from "react";
import type { ChartPeriod, WorkTimePoint } from "@/lib/stats";
import { formatDuration, formatMinutes } from "@/lib/format";

const VB_W = 640;
const VB_H = 180;
const MARGIN = { top: 14, right: 12, bottom: 28, left: 42 };
const PLOT_W = VB_W - MARGIN.left - MARGIN.right;
const PLOT_H = VB_H - MARGIN.top - MARGIN.bottom;
const BAR_GAP = 3;

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

function currentKey(period: ChartPeriod): string {
  const now = new Date();
  if (period === "year") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return now.toISOString().slice(0, 10);
}

// Only average over the selected range's elapsed days: drop not-yet-happened
// buckets (a month/year view renders the whole calendar, including days that
// haven't occurred yet) and any leading empty days before the user's first
// session in range - both would otherwise drag the average down artificially.
function statsSinceStart(points: WorkTimePoint[], period: ChartPeriod) {
  const today = currentKey(period);
  const elapsed = points.filter((p) => p.key <= today);
  const firstActive = elapsed.findIndex((p) => p.totalSeconds > 0);
  const active = firstActive === -1 ? [] : elapsed.slice(firstActive).map((p) => p.totalSeconds);
  const avg = mean(active);
  return { avg, std: sampleStdDev(active, avg) };
}

export default function WorkTimeChart({ points, period }: { points: WorkTimePoint[]; period: ChartPeriod }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxSeconds = Math.max(1, ...points.map((p) => p.totalSeconds));
  const total = points.reduce((sum, p) => sum + p.totalSeconds, 0);
  const { avg, std } = statsSinceStart(points, period);
  const stdColor = std < avg / 2 ? "#22c55e" : "#ef4444";

  const slotWidth = points.length > 0 ? PLOT_W / points.length : 0;
  const valueToY = (value: number) => MARGIN.top + PLOT_H - (Math.min(value, maxSeconds) / maxSeconds) * PLOT_H;

  const tickStep = Math.max(1, Math.ceil(points.length / 6));
  const xTicks = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % tickStep === 0 || i === points.length - 1);

  const yTicks = [0, 1 / 3, 2 / 3, 1].map((f) => f * maxSeconds);

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? MARGIN.left + hoverIndex * slotWidth + slotWidth / 2 : 0;
  const hoverY = hovered ? valueToY(hovered.totalSeconds) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <span className="text-muted">Total</span>
          <span className="font-medium">{formatDuration(total)}</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#9ca3af" }} />
          <span className="text-muted">Avg / day</span>
          <span className="font-medium">{formatDuration(avg)}</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stdColor }} />
          <span className="text-muted">Std dev / day</span>
          <span className="font-medium">{formatDuration(std)}</span>
        </span>
      </div>

      <div className="relative max-h-52 w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      <svg
        role="img"
        aria-label="Work time per period"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-full w-full overflow-visible"
      >
        {yTicks.map((value, idx) => {
          const y = valueToY(value);
          return (
            <g key={idx}>
              <line x1={MARGIN.left} x2={VB_W - MARGIN.right} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={MARGIN.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--muted)">
                {formatMinutes(value)}
              </text>
            </g>
          );
        })}

        {xTicks.map(({ p, i }) => (
          <text
            key={p.key}
            x={MARGIN.left + i * slotWidth + slotWidth / 2}
            y={VB_H - MARGIN.bottom + 18}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {formatLabel(p.key, period)}
          </text>
        ))}

        {points.map((p, i) => {
          const barHeight = Math.max(p.totalSeconds > 0 ? 2 : 0, (p.totalSeconds / maxSeconds) * PLOT_H);
          const x = MARGIN.left + i * slotWidth + BAR_GAP;
          const w = Math.max(0, slotWidth - BAR_GAP * 2);
          return (
            <rect
              key={p.key}
              x={x}
              y={MARGIN.top + PLOT_H - barHeight}
              width={w}
              height={barHeight}
              rx="3"
              fill={hoverIndex === i ? "var(--accent-break)" : "var(--accent)"}
              className="transition-[fill] duration-100"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
            />
          );
        })}

        <line
          x1={MARGIN.left}
          x2={VB_W - MARGIN.right}
          y1={valueToY(avg)}
          y2={valueToY(avg)}
          stroke="#9ca3af"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />

        <line
          x1={MARGIN.left}
          x2={VB_W - MARGIN.right}
          y1={valueToY(std)}
          y2={valueToY(std)}
          stroke={stdColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />

        {hovered && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={MARGIN.top}
            y2={VB_H - MARGIN.bottom}
            stroke="var(--foreground)"
            strokeOpacity="0.15"
            strokeWidth="1"
            pointerEvents="none"
          />
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg"
          style={{
            left: `${(hoverX / VB_W) * 100}%`,
            top: `${(hoverY / VB_H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
          }}
        >
          <div className="font-medium">{formatLabel(hovered.key, period)}</div>
          <div className="text-background/70">{formatMinutes(hovered.totalSeconds)}</div>
        </div>
      )}
      </div>
    </div>
  );
}
