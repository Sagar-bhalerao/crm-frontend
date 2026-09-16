import { isOpenLead } from "./leadWorkflow";

/**
 * Outlet-based assignment rules.
 * The Express API will run the same logic server-side when a website
 * enquiry arrives; the mock service calls it directly.
 */

/** Users who can receive leads for an outlet. */
export function getOutletAssignees(users, roles, outletId) {
  return users.filter((u) => {
    if (!u.active) return false;
    const role = roles.find((r) => r.id === u.roleId);
    return role?.receivesLeads && (u.outletIds.includes("*") || u.outletIds.includes(outletId));
  });
}

/**
 * Pick the Sales POC with the fewest open leads.
 * Ties go to whoever received a lead least recently (round-robin).
 */
export function pickAssignee({ users, roles, leads, outletId }) {
  const candidates = getOutletAssignees(users, roles, outletId);
  if (candidates.length === 0) return null;

  const stats = candidates.map((u) => {
    const theirs = leads.filter((l) => l.assignedToId === u.id);
    const open = theirs.filter(isOpenLead).length;
    const lastAssigned = theirs.reduce((max, l) => Math.max(max, new Date(l.createdAt).getTime()), 0);
    return { user: u, open, lastAssigned };
  });

  stats.sort((a, b) => a.open - b.open || a.lastAssigned - b.lastAssigned);
  return stats[0].user;
}
