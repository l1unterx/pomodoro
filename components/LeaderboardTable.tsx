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
    <div className="rounded-3xl border border-border bg-surface shadow-lg shadow-black/20 backdrop-blur-xl">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="w-10 px-2 py-3 font-medium sm:w-auto sm:px-4">Rank</th>
            <th className="px-2 py-3 font-medium sm:px-4">Username</th>
            <th className="px-2 py-3 font-medium sm:px-4">Total time</th>
            <th className="px-2 py-3 font-medium sm:px-4">Sessions</th>
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
                className={`px-2 py-3 font-semibold sm:px-4 ${i === 0 ? "text-accent" : "text-muted"}`}
              >
                {i + 1}
              </td>
              <td className="truncate px-2 py-3 sm:px-4">{row.username}</td>
              <td className="truncate px-2 py-3 tabular-nums sm:px-4">
                {formatDuration(row.totalWorkSeconds)}
              </td>
              <td className="truncate px-2 py-3 tabular-nums sm:px-4">
                {row.completedSessions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
