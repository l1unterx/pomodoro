import { getCurrentUser } from "@/lib/auth";
import { resolveActiveTimer } from "@/lib/timer";
import {
  getLeaderboard,
  getUserWorkTimeSeries,
  getTodayWorkSeconds,
} from "@/lib/stats";
import AuthPanel from "@/components/AuthPanel";
import AccountBar from "@/components/AccountBar";
import TimerClient from "@/components/TimerClient";
import WorkTimeSection from "@/components/WorkTimeSection";
import LeaderboardTable from "@/components/LeaderboardTable";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <AuthPanel />;
  }

  const [timerState, todaySeconds, monthlyPoints, leaderboard] =
    await Promise.all([
      resolveActiveTimer(user.id),
      getTodayWorkSeconds(user.id),
      getUserWorkTimeSeries(user.id, "month"),
      getLeaderboard(10),
    ]);

  return (
    <div className="flex flex-col">
      <AccountBar
        username={user.username}
        initialThemeColor={user.themeColor}
      />

      <TimerClient initialState={timerState} />

      <WorkTimeSection
        initialPoints={monthlyPoints}
        initialPeriod="month"
        todaySeconds={todaySeconds}
      />

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6 pb-6 sm:pt-8 sm:pb-8">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">
          Leaderboard
        </h2>
        <LeaderboardTable rows={leaderboard} highlightUserId={user.id} />
      </section>
    </div>
  );
}
