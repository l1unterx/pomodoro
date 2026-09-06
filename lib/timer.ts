import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { ActiveTimerDoc, PomodoroSessionDoc, TimerMode } from "@/lib/types";

export type ResolvedTimerState =
  | { status: "idle"; justCompleted?: TimerMode }
  | {
      status: "running";
      mode: TimerMode;
      workTitle: string | null;
      plannedDuration: number;
      remainingSeconds: number;
      endsAt: string;
      justCompleted?: TimerMode;
    }
  | {
      status: "paused";
      mode: TimerMode;
      workTitle: string | null;
      plannedDuration: number;
      remainingSeconds: number;
    };

/**
 * The single source of truth for "what is this user's timer doing right now."
 * Computes state purely from stored timestamps - safe to call from a fresh
 * page load after the browser was closed for hours, and lazily finalizes /
 * cascades any phases (work -> break -> idle) that expired while nobody was
 * watching. No background interval or cron is involved; this is the entire
 * mechanism for "continuing" a timer server-side.
 */
export async function resolveActiveTimer(userId: string): Promise<ResolvedTimerState> {
  const db = await getDb();
  const timers = db.collection<ActiveTimerDoc>("activeTimers");
  const uid = new ObjectId(userId);

  let doc = await timers.findOne({ _id: uid });
  if (!doc) {
    return { status: "idle" };
  }

  if (doc.status === "paused") {
    return {
      status: "paused",
      mode: doc.mode,
      workTitle: doc.workTitle,
      plannedDuration: doc.plannedDuration,
      remainingSeconds: doc.remainingSeconds ?? 0,
    };
  }

  let justCompleted: TimerMode | undefined;

  // Cascade through at most two phase transitions (work -> break -> idle).
  for (let i = 0; i < 2; i++) {
    if (!doc.endsAt || doc.endsAt.getTime() > Date.now()) break;

    if (doc.mode === "work" && doc.workTitle) {
      await db.collection<PomodoroSessionDoc>("pomodoroSessions").insertOne({
        _id: new ObjectId(),
        userId: uid,
        title: doc.workTitle,
        startTime: doc.startedAt,
        endTime: doc.endsAt,
        duration: doc.plannedDuration,
        createdAt: new Date(),
      });
    }
    justCompleted = doc.mode;

    if (doc.mode === "work") {
      const nextStart = doc.endsAt;
      const nextEnds = new Date(nextStart.getTime() + doc.breakDuration * 1000);
      const updated: ActiveTimerDoc = {
        ...doc,
        mode: "break",
        workTitle: null,
        plannedDuration: doc.breakDuration,
        startedAt: nextStart,
        endsAt: nextEnds,
        remainingSeconds: null,
      };
      await timers.replaceOne({ _id: uid }, updated);
      doc = updated;
    } else {
      await timers.deleteOne({ _id: uid });
      return { status: "idle", justCompleted };
    }
  }

  const remainingSeconds = Math.max(0, (doc.endsAt!.getTime() - Date.now()) / 1000);

  return {
    status: "running",
    mode: doc.mode,
    workTitle: doc.workTitle,
    plannedDuration: doc.plannedDuration,
    remainingSeconds,
    endsAt: doc.endsAt!.toISOString(),
    justCompleted,
  };
}
