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
    return <p className="text-sm text-muted">No completed work sessions yet.</p>;
  }

  return (
    <div className="overflow-x-auto border border-foreground">
      <table className="w-full min-w-120 border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-foreground uppercase tracking-wide">
            <th className="px-4 py-3 font-normal">Rank</th>
            <th className="px-4 py-3 font-normal">Username</th>
            <th className="px-4 py-3 font-normal">Total work time</th>
            <th className="px-4 py-3 font-normal">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.userId}
              className={`border-b border-foreground/30 last:border-0 ${
                row.userId === highlightUserId ? "bg-foreground text-background" : ""
              }`}
            >
              <td className="px-4 py-3">{i + 1}</td>
              <td className="px-4 py-3">{row.username}</td>
              <td className="px-4 py-3">{formatDuration(row.totalWorkSeconds)}</td>
              <td className="px-4 py-3">{row.completedSessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
