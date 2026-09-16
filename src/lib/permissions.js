import { P } from "@/config/permissions";

/**
 * Permission helpers. The backend must enforce the same rules —
 * these only decide what the UI shows.
 */

/** @param {import('./types').SessionUser|null} user */
export function can(user, permission) {
  if (!user || !permission) return !permission;
  const perms = user.permissions || [];
  return perms.includes("*") || perms.includes(permission);
}

export function canAny(user, permissions = []) {
  return permissions.some((p) => can(user, p));
}

export function hasBrandAccess(user, brandId) {
  if (!user) return false;
  return user.brandIds.includes("*") || user.brandIds.includes(brandId);
}

export function hasOutletAccess(user, outlet) {
  if (!user || !outlet) return false;
  if (!hasBrandAccess(user, outlet.brandId)) return false;
  return user.outletIds.includes("*") || user.outletIds.includes(outlet.id);
}

/**
 * Role → Brand → Outlet → Permission
 * @param {import('./types').SessionUser} user
 * @param {import('./types').Lead} lead
 * @param {import('./types').Outlet} outlet  outlet of the lead
 */
export function canViewLead(user, lead, outlet) {
  if (!can(user, P.LEAD_VIEW)) return false;
  if (!hasBrandAccess(user, lead.brandId)) return false;
  if (can(user, P.LEAD_VIEW_ALL)) return true;
  if (can(user, P.LEAD_VIEW_OUTLET)) return hasOutletAccess(user, outlet);
  return lead.assignedToId === user.id;
}
