import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { PomodoroSessionDoc } from "@/lib/types";

export interface UserStats {
  totalWorkSeconds: number;
  completedSessions: number;
  averageDurationSeconds: number;
  stdDevSeconds: number;
}

export type ChartPeriod = "week" | "month" | "year";

export interface WorkTimePoint {
  key: string; // "YYYY-MM-DD" for week/month, "YYYY-MM" for year
  totalSeconds: number;
  titles: string[];
}

export interface LeaderboardRow {
  userId: string;
  username: string;
  totalWorkSeconds: number;
  completedSessions: number;
}

export interface SessionHistoryItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const db = await getDb();
  const uid = new ObjectId(userId);

  const [result] = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .aggregate<{
      totalWorkSeconds: number;
      completedSessions: number;
      averageDurationSeconds: number;
      stdDevSeconds: number | null;
    }>([
      { $match: { userId: uid } },
      {
        $group: {
          _id: null,
          totalWorkSeconds: { $sum: "$duration" },
          completedSessions: { $sum: 1 },
          averageDurationSeconds: { $avg: "$duration" },
          stdDevSeconds: { $stdDevSamp: "$duration" },
        },
      },
    ])
    .toArray();

  if (!result) {
    return {
      totalWorkSeconds: 0,
      completedSessions: 0,
      averageDurationSeconds: 0,
      stdDevSeconds: 0,
    };
  }

  return {
    totalWorkSeconds: result.totalWorkSeconds,
    completedSessions: result.completedSessions,
    averageDurationSeconds: result.averageDurationSeconds,
    stdDevSeconds: result.stdDevSeconds ?? 0,
  };
}

const PERIOD_CONFIG: Record<ChartPeriod, { buckets: number; granularity: "day" | "month" }> = {
  week: { buckets: 7, granularity: "day" },
  month: { buckets: 30, granularity: "day" },
  year: { buckets: 12, granularity: "month" },
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUserWorkTimeSeries(userId: string, period: ChartPeriod): Promise<WorkTimePoint[]> {
  const db = await getDb();
  const uid = new ObjectId(userId);
  const { buckets, granularity } = PERIOD_CONFIG[period];

  const since = new Date();
  if (granularity === "month") {
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    since.setMonth(since.getMonth() - (buckets - 1));
  } else {
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (buckets - 1));
  }

  const dateFormat = granularity === "month" ? "%Y-%m" : "%Y-%m-%d";

  const rows = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .aggregate<{ _id: string; totalSeconds: number; titles: string[] }>([
      { $match: { userId: uid, endTime: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$endTime" } },
          totalSeconds: { $sum: "$duration" },
          titles: { $push: "$title" },
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
    points.push({ key, totalSeconds: found?.totalSeconds ?? 0, titles: found?.titles ?? [] });
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

export async function getSessionHistory(userId: string, limit = 20): Promise<SessionHistoryItem[]> {
  const db = await getDb();
  const uid = new ObjectId(userId);

  const rows = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .find({ userId: uid }, { projection: { title: 1, startTime: 1, endTime: 1, duration: 1 } })
    .sort({ startTime: -1 })
    .limit(limit)
    .toArray();

  return rows.map((r) => ({
    id: r._id.toHexString(),
    title: r.title,
    startTime: r.startTime.toISOString(),
    endTime: r.endTime.toISOString(),
    duration: r.duration,
  }));
}
