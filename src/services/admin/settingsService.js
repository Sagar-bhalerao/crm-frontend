import { request } from "./client";

/** Global configuration stored in PostgreSQL. */
export const getSettings = () => request("/settings");

export const updateSettings = (changes) => request("/settings", { method: "PUT", body: changes });

export const resetSettings = () => request("/settings/reset", { method: "POST" });
