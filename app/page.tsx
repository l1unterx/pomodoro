import { getCurrentUser } from "@/lib/auth";
import { resolveActiveTimer } from "@/lib/timer";
import { getLeaderboard, getSessionHistory, getUserWorkTimeSeries, getUserStats } from "@/lib/stats";
import { formatDuration } from "@/lib/format";
import AuthPanel from "@/components/AuthPanel";
import AccountBar from "@/components/AccountBar";
import TimerClient from "@/components/TimerClient";
import SessionHistory from "@/components/SessionHistory";
import StatCard from "@/components/StatCard";
import WorkTimeChart from "@/components/WorkTimeChart";
import LeaderboardTable from "@/components/LeaderboardTable";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <AuthPanel />;
  }

  const [timerState, stats, monthlyPoints, leaderboard, history] = await Promise.all([
    resolveActiveTimer(user.id),
    getUserStats(user.id),
    getUserWorkTimeSeries(user.id, "month"),
    getLeaderboard(10),
    getSessionHistory(user.id, 20),
  ]);

  return (
    <div className="flex flex-col">
      <AccountBar username={user.username} />

      <TimerClient initialState={timerState} />

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12">
        <h2 className="text-sm uppercase tracking-widest text-muted">Session history</h2>
        <SessionHistory items={history} />
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <h2 className="text-sm uppercase tracking-widest text-muted">Your statistics</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total work time" value={formatDuration(stats.totalWorkSeconds)} />
          <StatCard label="Completed sessions" value={String(stats.completedSessions)} />
          <StatCard label="Avg. session" value={formatDuration(stats.averageDurationSeconds)} />
          <StatCard label="Std. deviation" value={formatDuration(stats.stdDevSeconds)} />
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-xs uppercase tracking-widest text-muted">Work time over time</h3>
          <WorkTimeChart initialPoints={monthlyPoints} initialPeriod="month" />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12">
        <h2 className="text-sm uppercase tracking-widest text-muted">Leaderboard</h2>
        <LeaderboardTable rows={leaderboard} highlightUserId={user.id} />
      </section>
    </div>
  );
}
