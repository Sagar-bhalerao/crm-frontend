import { request, requestList } from "./client";

/**
 * Brand configuration. Backed by PostgreSQL through the Express API,
 * never by mock data.
 */
export const listBrands = (query = {}) => requestList("/brands", { query });

export const getBrand = (id) => request(`/brands/${id}`);

export const createBrand = (input) => request("/brands", { method: "POST", body: input });

export const updateBrand = (id, changes) => request(`/brands/${id}`, { method: "PUT", body: changes });

export const setBrandStatus = (id, status) => request(`/brands/${id}/status`, { method: "PATCH", body: { status } });

export const listBrandLocations = (id, query = {}) => requestList(`/brands/${id}/locations`, { query });

/** Active brands only, for dropdowns. */
export const listActiveBrands = () => requestList("/brands", { query: { status: 1, pageSize: 100, sort: "name:asc" } });

export const deleteBrand = (id) => request(`/brands/${id}`, { method: "DELETE" });
