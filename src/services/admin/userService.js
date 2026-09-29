import { request, requestList } from "./client";

export const listUsers = (query = {}) => requestList("/users", { query });

export const getUser = (id) => request(`/users/${id}`);

export const createUser = (input) => request("/users", { method: "POST", body: input });

export const updateUser = (id, changes) => request(`/users/${id}`, { method: "PUT", body: changes });

export const setUserStatus = (id, status) =>
  request(`/users/${id}/status`, { method: "PATCH", body: { status: Number(status) } });

export const setUserPassword = (id, password) =>
  request(`/users/${id}/password`, { method: "POST", body: { password } });

export const deleteUser = (id) => request(`/users/${id}`, { method: "DELETE" });