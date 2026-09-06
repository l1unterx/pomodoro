import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "./mongodb";
import type { AuthSessionDoc, PublicUser, UserDoc } from "./types";

export const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toHexString(),
    username: user.username,
  };
}

export async function createSession(userId: ObjectId): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const db = await getDb();
  await db.collection<AuthSessionDoc>("authSessions").insertOne({
    _id: new ObjectId(),
    tokenHash,
    userId,
    createdAt: now,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const db = await getDb();
    await db.collection<AuthSessionDoc>("authSessions").deleteOne({
      tokenHash: hashToken(token),
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = await getDb();
  const authSession = await db.collection<AuthSessionDoc>("authSessions").findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!authSession) return null;

  const user = await db.collection<UserDoc>("users").findOne({ _id: authSession.userId });
  if (!user) return null;

  return toPublicUser(user);
}

/** Throws if there is no authenticated user. Use at the top of every server action / protected data fetch. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
