import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { PomodoroSessionDoc } from "@/lib/types";

export type ChartPeriod = "week" | "month" | "year";

export interface SessionEntry {
  id: string;
  title: string;
  startTime: string; // ISO
  endTime: string; // ISO
  duration: number; // seconds
}

export interface WorkTimePoint {
  key: string; // "YYYY-MM-DD" for week/month, "YYYY-MM" for year
  totalSeconds: number;
  sessions: SessionEntry[];
}

export interface LeaderboardRow {
  userId: string;
  username: string;
  totalWorkSeconds: number;
  completedSessions: number;
}

export async function getTodayWorkSeconds(userId: string): Promise<number> {
  const db = await getDb();
  const uid = new ObjectId(userId);
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const until = new Date(since);
  until.setDate(until.getDate() + 1);

  const [result] = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .aggregate<{ totalSeconds: number }>([
      { $match: { userId: uid, endTime: { $gte: since, $lt: until } } },
      { $group: { _id: null, totalSeconds: { $sum: "$duration" } } },
    ])
    .toArray();

  return result?.totalSeconds ?? 0;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// week: 7-day window, `offset` weeks back from the current one. month: a
// calendar month (1st through its last day), `offset` months back. year: a
// calendar year, January through December, `offset` years back. Anchoring
// month/year to real calendar boundaries - rather than a rolling window -
// keeps them from spilling into periods before the app had any data.
function periodBounds(
  period: ChartPeriod,
  now: Date,
  offset: number,
): { since: Date; until: Date; buckets: number; granularity: "day" | "month" } {
  if (period === "week") {
    const since = new Date(now);
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 6 - offset * 7);
    const until = new Date(since);
    until.setDate(until.getDate() + 7);
    return { since, until, buckets: 7, granularity: "day" };
  }
  if (period === "month") {
    const since = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const until = new Date(since.getFullYear(), since.getMonth() + 1, 1);
    const daysInMonth = new Date(since.getFullYear(), since.getMonth() + 1, 0).getDate();
    return { since, until, buckets: daysInMonth, granularity: "day" };
  }
  const since = new Date(now.getFullYear() - offset, 0, 1);
  const until = new Date(since.getFullYear() + 1, 0, 1);
  return { since, until, buckets: 12, granularity: "month" };
}

export async function getUserWorkTimeSeries(
  userId: string,
  period: ChartPeriod,
  offset = 0,
): Promise<WorkTimePoint[]> {
  const db = await getDb();
  const uid = new ObjectId(userId);
  const { since, until, buckets, granularity } = periodBounds(period, new Date(), offset);

  const dateFormat = granularity === "month" ? "%Y-%m" : "%Y-%m-%d";

  const rows = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .aggregate<{
      _id: string;
      totalSeconds: number;
      sessions: { id: ObjectId; title: string; startTime: Date; endTime: Date; duration: number }[];
    }>([
      { $match: { userId: uid, endTime: { $gte: since, $lt: until } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$endTime" } },
          totalSeconds: { $sum: "$duration" },
          sessions: {
            $push: { id: "$_id", title: "$title", startTime: "$startTime", endTime: "$endTime", duration: "$duration" },
          },
        },
      },
    ])
    .toArray();

  const byKey = new Map(rows.map((r) => [r._id, r]));

  const points: WorkTimePoint[] = [];
  for (let i = 0; i < buckets; i++) {
    const d = new Date(since);
    let key: string;
    if (granularity === "month") {
      d.setMonth(d.getMonth() + i);
      key = monthKey(d);
    } else {
      d.setDate(d.getDate() + i);
      key = dayKey(d);
    }
    const found = byKey.get(key);
    points.push({
      key,
      totalSeconds: found?.totalSeconds ?? 0,
      sessions: (found?.sessions ?? []).map((s) => ({
        id: s.id.toHexString(),
        title: s.title,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        duration: s.duration,
      })),
    });
  }
  return points;
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const db = await getDb();

  const rows = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .aggregate<{
      _id: ObjectId;
      totalWorkSeconds: number;
      completedSessions: number;
      username: string;
    }>([
      {
        $group: {
          _id: "$userId",
          totalWorkSeconds: { $sum: "$duration" },
          completedSessions: { $sum: 1 },
        },
      },
      { $sort: { totalWorkSeconds: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          totalWorkSeconds: 1,
          completedSessions: 1,
          username: "$user.username",
        },
      },
    ])
    .toArray();

  return rows.map((r) => ({
    userId: r._id.toHexString(),
    username: r.username,
    totalWorkSeconds: r.totalWorkSeconds,
    completedSessions: r.completedSessions,
  }));
}
