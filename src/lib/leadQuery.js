import { endOfDay, getPath, startOfDay, addDays } from "./format";

/**
 * Filter + sort + paginate leads.
 * Mirrors the query string the Express API will accept:
 *   GET /leads?search=&status=&outletId=&type=&assignedToId=&date=7d&from=&to=&sort=createdAt:desc&page=1&pageSize=10
 */
export function applyLeadQuery(leads, query = {}, now = Date.now()) {
  const {
    search = "",
    status = "",
    outletId = "",
    type = "",
    assignedToId = "",
    date = "",
    from = "",
    to = "",
    sort = "createdAt:desc",
    page = 1,
    pageSize = 10,
  } = query;

  const term = search.trim().toLowerCase();
  const range = getDateRange(date, from, to, now);

  let rows = leads.filter((l) => {
    if (status && l.status !== status) return false;
    if (outletId && l.outletId !== outletId) return false;
    if (type && l.type !== type) return false;
    if (assignedToId === "unassigned" ? l.assignedToId : assignedToId && l.assignedToId !== assignedToId) return false;
    if (range) {
      const t = new Date(l.createdAt).getTime();
      if (t < range.start || t > range.end) return false;
    }
    if (term) {
      const haystack = [l.id, l.customer.name, l.customer.mobile, l.customer.email, l.company?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const [field, dir] = sort.split(":");
  rows = [...rows].sort((a, b) => {
    const av = sortValue(a, field);
    const bv = sortValue(b, field);
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av > bv ? 1 : -1;
    return dir === "asc" ? cmp : -cmp;
  });

  const total = rows.length;
  const size = Number(pageSize) || 10;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const items = rows.slice((current - 1) * size, current * size);

  return { items, total, page: current, pageSize: size, totalPages };
}

function sortValue(lead, field) {
  const v = field === "eventDate" ? lead.event.date : getPath(lead, field);
  if (v == null || v === "") return null;
  return typeof v === "string" ? v.toLowerCase() : v;
}

function getDateRange(preset, from, to, now) {
  if (preset === "today") return { start: startOfDay(now), end: endOfDay(now) };
  if (preset === "7d") return { start: startOfDay(addDays(now, -6)), end: endOfDay(now) };
  if (preset === "30d") return { start: startOfDay(addDays(now, -29)), end: endOfDay(now) };
  if (preset === "custom" && (from || to)) {
    return {
      start: from ? startOfDay(from) : -Infinity,
      end: to ? endOfDay(to) : Infinity,
    };
  }
  return null;
}
