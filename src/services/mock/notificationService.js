import { saveDb } from "@/mock/db";
import { clone, context } from "./helpers";

/** In-app notifications (header bell). */
export async function listNotifications() {
  const { db, user } = context();
  return clone(db.notifications.filter((n) => n.userId === user.id).slice(0, 20));
}

export async function markAllRead() {
  const { db, user } = context();
  db.notifications.forEach((n) => {
    if (n.userId === user.id) n.read = true;
  });
  saveDb();
}
