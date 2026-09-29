import { request } from "./client";

/** Roles come back as a plain array, not a paged list. */
export const listRoles = (query = {}) => request("/roles", { query });

export const getRole = (id) => request(`/roles/${id}`);

export const createRole = (input) => request("/roles", { method: "POST", body: input });

export const updateRole = (id, changes) => request(`/roles/${id}`, { method: "PUT", body: changes });

export const setRoleStatus = (id, status) =>
  request(`/roles/${id}/status`, { method: "PATCH", body: { status: Number(status) } });

export const deleteRole = (id) => request(`/roles/${id}`, { method: "DELETE" });

/** The permission catalogue, for the checkbox list. */
export const listPermissions = () => request("/permissions");