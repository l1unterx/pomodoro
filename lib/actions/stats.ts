"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { validateTitle } from "@/lib/validation";
import type { PomodoroSessionDoc } from "@/lib/types";
import { getUserWorkTimeSeries, type ChartPeriod, type WorkTimePoint } from "@/lib/stats";

const MAX_OFFSET = 1000;
const MAX_SESSION_SECONDS = 24 * 60 * 60;

export async function getWorkTimeSeriesAction(period: ChartPeriod, offset = 0): Promise<WorkTimePoint[]> {
  const user = await requireUser();
  const safeOffset = Number.isInteger(offset) ? Math.min(Math.max(offset, 0), MAX_OFFSET) : 0;
  return getUserWorkTimeSeries(user.id, period, safeOffset);
}

export async function updateSessionAction(
  id: string,
  updates: { title: string; startTime: string; endTime: string },
): Promise<void> {
  const user = await requireUser();

  const titleError = validateTitle(updates.title);
  if (titleError) throw new Error(titleError);

  const startTime = new Date(updates.startTime);
  const endTime = new Date(updates.endTime);
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;
  if (Number.isNaN(duration) || duration <= 0 || duration > MAX_SESSION_SECONDS) {
    throw new Error("End time must be after start time, and the session must be under 24 hours.");
  }

  const db = await getDb();
  const result = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(user.id) },
      { $set: { title: updates.title, startTime, endTime, duration } },
    );

  if (result.matchedCount === 0) {
    throw new Error("Session not found.");
  }
}

export async function deleteSessionAction(id: string): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  const result = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .deleteOne({ _id: new ObjectId(id), userId: new ObjectId(user.id) });

  if (result.deletedCount === 0) {
    throw new Error("Session not found.");
  }
}
