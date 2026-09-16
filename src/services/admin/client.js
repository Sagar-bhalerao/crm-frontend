import { http } from "../api/http.js";

/**
 * Calls the Express API and unwraps the { success, message, data } envelope.
 * Errors already arrive as AppError from http(), carrying the API's message.
 */
export async function request(path, options) {
  const body = await http(path, options);
  return body?.data ?? body;
}

/** List endpoints return { items, pagination }. */
export async function requestList(path, options) {
  const data = await request(path, options);
  return {
    items: data?.items ?? [],
    ...(data?.pagination ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 }),
  };
}
