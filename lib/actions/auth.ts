"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { validateHexColor, validatePassword, validateUsername } from "@/lib/validation";
import type { UserDoc } from "@/lib/types";

export interface AuthFormState {
  error: string | null;
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  const existing = await users.findOne({ username });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await hashPassword(password);
  const userId = new ObjectId();

  try {
    await users.insertOne({
      _id: userId,
      username,
      passwordHash,
      createdAt: new Date(),
    });
  } catch {
    return { error: "That username is already taken." };
  }

  await createSession(userId);
  redirect("/");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Please enter your username and password." };
  }

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ username });

  if (!user) {
    return { error: "Invalid credentials." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid credentials." };
  }

  await createSession(user._id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function updateThemeColorAction(color: string): Promise<void> {
  const user = await requireUser();

  const colorError = validateHexColor(color);
  if (colorError) throw new Error(colorError);

  const db = await getDb();
  await db
    .collection<UserDoc>("users")
    .updateOne({ _id: new ObjectId(user.id) }, { $set: { themeColor: color } });
}
