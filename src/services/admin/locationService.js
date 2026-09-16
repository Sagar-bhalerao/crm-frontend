import { request, requestList } from "./client";

export const listLocations = (query = {}) => requestList("/locations", { query });

export const getLocation = (id) => request(`/locations/${id}`);

export const createLocation = (input) => request("/locations", { method: "POST", body: input });

export const updateLocation = (id, changes) => request(`/locations/${id}`, { method: "PUT", body: changes });

export const setLocationStatus = (id, status) => request(`/locations/${id}/status`, { method: "PATCH", body: { status } });

export const deleteLocation = (id) => request(`/locations/${id}`, { method: "DELETE" });
