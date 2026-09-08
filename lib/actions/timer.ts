"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { resolveActiveTimer, type ResolvedTimerState } from "@/lib/timer";
import type { ActiveTimerDoc, PomodoroSessionDoc } from "@/lib/types";
import {
  validateDurationMinutes,
  validateTitle,
  MIN_WORK_MINUTES,
  MAX_WORK_MINUTES,
  MIN_BREAK_MINUTES,
  MAX_BREAK_MINUTES,
} from "@/lib/validation";

export async function startTimerAction(
  workMinutes: number,
  breakMinutes: number,
  title: string,
): Promise<ResolvedTimerState> {
  const user = await requireUser();

  const workError = validateDurationMinutes(workMinutes, MIN_WORK_MINUTES, MAX_WORK_MINUTES);
  if (workError) throw new Error(workError);

  const breakError = validateDurationMinutes(breakMinutes, MIN_BREAK_MINUTES, MAX_BREAK_MINUTES);
  if (breakError) throw new Error(breakError);

  const trimmedTitle = title.trim();
  const titleError = validateTitle(trimmedTitle);
  if (titleError) throw new Error(titleError);

  const current = await resolveActiveTimer(user.id);
  if (current.status !== "idle") {
    throw new Error("A timer is already active. Reset it before starting a new one.");
  }

  const db = await getDb();
  const uid = new ObjectId(user.id);
  const now = new Date();
  const plannedDuration = workMinutes * 60;
  const endsAt = new Date(now.getTime() + plannedDuration * 1000);
  const doc: ActiveTimerDoc = {
    _id: uid,
    userId: uid,
    status: "running",
    mode: "work",
    workTitle: trimmedTitle,
    plannedDuration,
    breakDuration: breakMinutes * 60,
    startedAt: now,
    endsAt,
    remainingSeconds: null,
  };

  await db.collection<ActiveTimerDoc>("activeTimers").replaceOne({ _id: uid }, doc, { upsert: true });

  return {
    status: "running",
    mode: "work",
    workTitle: trimmedTitle,
    plannedDuration,
    remainingSeconds: plannedDuration,
    endsAt: endsAt.toISOString(),
  };
}

export async function pauseTimerAction(): Promise<ResolvedTimerState> {
  const user = await requireUser();
  const uid = new ObjectId(user.id);
  const current = await resolveActiveTimer(user.id);

  if (current.status !== "running") {
    return current;
  }

  const db = await getDb();
  await db.collection<ActiveTimerDoc>("activeTimers").updateOne(
    { _id: uid },
    {
      $set: {
        status: "paused",
        remainingSeconds: current.remainingSeconds,
        endsAt: null,
      },
    },
  );

  return {
    status: "paused",
    mode: current.mode,
    workTitle: current.workTitle,
    plannedDuration: current.plannedDuration,
    remainingSeconds: current.remainingSeconds,
  };
}

export async function resumeTimerAction(): Promise<ResolvedTimerState> {
  const user = await requireUser();
  const uid = new ObjectId(user.id);
  const current = await resolveActiveTimer(user.id);

  if (current.status !== "paused") {
    return current;
  }

  const db = await getDb();
  const now = new Date();
  const endsAt = new Date(now.getTime() + current.remainingSeconds * 1000);
  await db.collection<ActiveTimerDoc>("activeTimers").updateOne(
    { _id: uid },
    {
      $set: {
        status: "running",
        startedAt: now,
        endsAt,
        remainingSeconds: null,
      },
    },
  );

  return {
    status: "running",
    mode: current.mode,
    workTitle: current.workTitle,
    plannedDuration: current.plannedDuration,
    remainingSeconds: current.remainingSeconds,
    endsAt: endsAt.toISOString(),
  };
}

export async function restartTimerAction(): Promise<ResolvedTimerState> {
  const user = await requireUser();
  const uid = new ObjectId(user.id);
  const current = await resolveActiveTimer(user.id);

  if (current.status === "idle") {
    return current;
  }

  const db = await getDb();
  const now = new Date();
  const endsAt = new Date(now.getTime() + current.plannedDuration * 1000);
  await db.collection<ActiveTimerDoc>("activeTimers").updateOne(
    { _id: uid },
    {
      $set: {
        status: "running",
        startedAt: now,
        endsAt,
        remainingSeconds: null,
      },
    },
  );

  return {
    status: "running",
    mode: current.mode,
    workTitle: current.workTitle,
    plannedDuration: current.plannedDuration,
    remainingSeconds: current.plannedDuration,
    endsAt: endsAt.toISOString(),
  };
}

export async function resetTimerAction(): Promise<ResolvedTimerState> {
  const user = await requireUser();
  const uid = new ObjectId(user.id);
  const current = await resolveActiveTimer(user.id);
  const db = await getDb();

  if (current.status !== "idle" && current.mode === "work" && current.workTitle) {
    const elapsed = Math.round(current.plannedDuration - current.remainingSeconds);
    if (elapsed > 0) {
      const now = new Date();
      await db.collection<PomodoroSessionDoc>("pomodoroSessions").insertOne({
        _id: new ObjectId(),
        userId: uid,
        title: current.workTitle,
        startTime: new Date(now.getTime() - elapsed * 1000),
        endTime: now,
        duration: elapsed,
        createdAt: now,
      });
    }
  }

  await db.collection<ActiveTimerDoc>("activeTimers").deleteOne({ _id: uid });
  return { status: "idle" };
}

export async function syncTimerAction(): Promise<ResolvedTimerState> {
  const user = await requireUser();
  return resolveActiveTimer(user.id);
}
