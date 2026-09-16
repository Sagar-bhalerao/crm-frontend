/**
 * Tiny pub/sub so screens refresh after a change made elsewhere
 * (e.g. "Simulate enquiry" in the header updates the dashboard).
 * Later this can be fed by Socket.io / server-sent events.
 */
const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((fn) => fn(payload));
}

export const EVENTS = {
  LEADS_CHANGED: "leads:changed",
  NOTIFICATIONS_CHANGED: "notifications:changed",
};
