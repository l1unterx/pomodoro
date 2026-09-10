import type { ObjectId } from "mongodb";

export interface UserDoc {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
  themeColor?: string; // hex, e.g. "#a855f7" - the accent color the user picked
}

export interface AuthSessionDoc {
  _id: ObjectId;
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export type TimerMode = "work" | "break";
export type TimerStatus = "running" | "paused";

/** One document per user: the single source of truth for their in-progress timer. */
export interface ActiveTimerDoc {
  _id: ObjectId; // equal to the user's ObjectId
  userId: ObjectId;
  status: TimerStatus;
  mode: TimerMode;
  workTitle: string | null;
  plannedDuration: number; // seconds, current phase
  breakDuration: number; // seconds, used to auto-start the break after work
  startedAt: Date; // when the current run segment began
  endsAt: Date | null; // absolute completion time while running; null while paused
  remainingSeconds: number | null; // frozen remaining time while paused; null while running
}

/** A completed work session. Breaks are not persisted. */
export interface PomodoroSessionDoc {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  username: string;
  themeColor: string | null;
}
