import type { SessionHistoryItem } from "@/lib/stats";
import { formatMinutes } from "@/lib/format";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SessionHistory({ items }: { items: SessionHistoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No completed work sessions yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/20">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-hover"
        >
          <div className="flex flex-col">
            <span className="text-sm">{item.title}</span>
            <span className="text-xs text-muted">{formatDateTime(item.startTime)}</span>
          </div>
          <span className="shrink-0 rounded-full bg-background px-3 py-1 text-sm tabular-nums text-muted">
            {formatMinutes(item.duration)}
          </span>
        </li>
      ))}
    </ul>
  );
}
