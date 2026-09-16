import { getDb } from "@/mock/db";
import { DEMO_PASSWORD } from "@/mock/organization";
import { AppError } from "@/lib/utils";
import { clearSession, delay, readSession, toSessionUser, writeSession } from "./helpers";

export async function login({ email, password, remember }) {
  await delay(600);
  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) {
    throw new AppError("Email or password is incorrect.", "INVALID_CREDENTIALS", 401);
  }
  if (!user.active) throw new AppError("This account is disabled. Contact your CRM admin.", "DISABLED", 403);
  writeSession({ userId: user.id, at: Date.now() }, remember);
  return toSessionUser(db, user);
}

export async function getSession() {
  const session = readSession();
  if (!session) return null;
  const db = getDb();
  const user = db.users.find((u) => u.id === session.userId && u.active);
  return user ? toSessionUser(db, user) : null;
}

export async function logout() {
  clearSession();
}

export async function requestPasswordReset(email) {
  await delay(700);
  return { sentTo: email };
}
