const LOCALE = "en-IN";

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true });
const longDateFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" });
const currencyFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const numberFmt = new Intl.NumberFormat(LOCALE);

const valid = (v) => v && !Number.isNaN(new Date(v).getTime());

export const formatDate = (v) => (valid(v) ? dateFmt.format(new Date(v)) : "—");
export const formatShortDate = (v) => (valid(v) ? shortDateFmt.format(new Date(v)) : "—");
export const formatLongDate = (v) => (valid(v) ? longDateFmt.format(new Date(v)) : "—");
export const formatWeekday = (v) => (valid(v) ? weekdayFmt.format(new Date(v)) : "—");
export const formatTime = (v) => (valid(v) ? timeFmt.format(new Date(v)).toUpperCase() : "—");
export const formatDateTime = (v) => (valid(v) ? `${formatDate(v)}, ${formatTime(v)}` : "—");
export const formatCurrency = (n) => currencyFmt.format(Number(n) || 0);
export const formatNumber = (n) => numberFmt.format(Number(n) || 0);

/** "5 min ago", "in 2 days", "Yesterday" */
export function formatRelative(v, now = Date.now()) {
  if (!valid(v)) return "—";
  const diff = new Date(v).getTime() - now;
  const abs = Math.abs(diff);
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  const future = diff > 0;

  if (abs < min) return "Just now";
  if (abs < hour) {
    const m = Math.round(abs / min);
    return future ? `in ${m} min` : `${m} min ago`;
  }
  if (abs < day && isSameDay(v, now)) {
    const h = Math.round(abs / hour);
    return future ? `in ${h} hr` : `${h} hr ago`;
  }
  const days = Math.round((startOfDay(v) - startOfDay(now)) / day);
  if (days === -1) return "Yesterday";
  if (days === 1) return "Tomorrow";
  if (Math.abs(days) < 7) return days > 0 ? `in ${days} days` : `${-days} days ago`;
  return formatDate(v);
}

export function formatPhone(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return mobile || "—";
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

/* ---------- date helpers ---------- */
export function startOfDay(v) {
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(v) {
  const d = new Date(v);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function isSameDay(a, b) {
  return startOfDay(a) === startOfDay(b);
}

export function addDays(v, days) {
  const d = new Date(v);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday as first day of the week */
export function startOfWeek(v) {
  const d = new Date(startOfDay(v));
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.getTime();
}

/** "2026-09-11" for <input type="date"> */
export function toDateInput(v) {
  if (!valid(v)) return "";
  const d = new Date(v);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-09-11T14:30" for <input type="datetime-local"> */
export function toDateTimeInput(v) {
  if (!valid(v)) return "";
  const d = new Date(v);
  const pad = (n) => String(n).padStart(2, "0");
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Read nested value: get(lead, "customer.name") */
export function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}
