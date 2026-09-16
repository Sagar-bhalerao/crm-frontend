import { http } from "./http";

export const listNotifications = () => http("/notifications");
export const markAllRead = () => http("/notifications/read-all", { method: "POST" });
