import type { LeaderboardRow } from "@/lib/stats";
import { formatDuration } from "@/lib/format";

export default function LeaderboardTable({
  rows,
  highlightUserId,
}: {
  rows: LeaderboardRow[];
  highlightUserId?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">No completed work sessions yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-surface shadow-lg shadow-black/20 backdrop-blur-xl">
      <table className="w-full min-w-120 border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Username</th>
            <th className="px-4 py-3 font-medium">Total time</th>
            <th className="px-4 py-3 font-medium">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.userId}
              className={`border-b border-border/60 transition-colors last:border-0 hover:bg-surface-hover ${
                row.userId === highlightUserId ? "bg-accent/10" : ""
              }`}
            >
              <td
                className={`px-4 py-3 font-semibold ${i === 0 ? "text-accent" : "text-muted"}`}
              >
                {i + 1}
              </td>
              <td className="px-4 py-3">{row.username}</td>
              <td className="px-4 py-3 tabular-nums">
                {formatDuration(row.totalWorkSeconds)}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {row.completedSessions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
