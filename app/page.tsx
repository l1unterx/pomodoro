import { getCurrentUser } from "@/lib/auth";
import { resolveActiveTimer } from "@/lib/timer";
import { getLeaderboard, getUserWorkTimeSeries, getUserStats, getTodayWorkSeconds } from "@/lib/stats";
import { formatDuration } from "@/lib/format";
import AuthPanel from "@/components/AuthPanel";
import AccountBar from "@/components/AccountBar";
import TimerClient from "@/components/TimerClient";
import WorkTimeSection from "@/components/WorkTimeSection";
import StatCard from "@/components/StatCard";
import LeaderboardTable from "@/components/LeaderboardTable";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <AuthPanel />;
  }

  const [timerState, stats, todaySeconds, monthlyPoints, leaderboard] = await Promise.all([
    resolveActiveTimer(user.id),
    getUserStats(user.id),
    getTodayWorkSeconds(user.id),
    getUserWorkTimeSeries(user.id, "month"),
    getLeaderboard(10),
  ]);

  return (
    <div className="flex flex-col">
      <AccountBar username={user.username} />

      <TimerClient initialState={timerState} />

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">Your statistics</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          <StatCard label="Today" value={formatDuration(todaySeconds)} />
          <StatCard label="Total work time" value={formatDuration(stats.totalWorkSeconds)} />
          <StatCard label="Completed sessions" value={String(stats.completedSessions)} />
          <StatCard label="Avg. session" value={formatDuration(stats.averageDurationSeconds)} />
          <StatCard label="Std. deviation" value={formatDuration(stats.stdDevSeconds)} />
        </div>
      </section>

      <WorkTimeSection initialPoints={monthlyPoints} initialPeriod="month" />

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">Leaderboard</h2>
        <LeaderboardTable rows={leaderboard} highlightUserId={user.id} />
      </section>
    </div>
  );
}
