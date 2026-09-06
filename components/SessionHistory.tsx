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
    <ul className="flex flex-col divide-y divide-foreground/20 border border-foreground">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm">{item.title}</span>
            <span className="text-xs text-muted">{formatDateTime(item.startTime)}</span>
          </div>
          <span className="shrink-0 text-sm tabular-nums">{formatMinutes(item.duration)}</span>
        </li>
      ))}
    </ul>
  );
}
