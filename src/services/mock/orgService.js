import { P } from "@/config/permissions";
import { getOutletAssignees } from "@/lib/assignment";
import { accessibleOutlets, clone, context, delay, publicUser, requirePermission } from "./helpers";

/** Outlets the current user can work with (for filters and forms). */
export async function listOutlets() {
  const { db, user } = context();
  return clone(accessibleOutlets(db, user));
}

export async function listBrands() {
  const { db } = context();
  return clone(db.brands);
}

/**
 * People a lead in this outlet can be assigned to:
 * outlet Sales POCs first, then Sales Heads covering the outlet.
 */
export async function listAssignees(outletId) {
  const { db } = context();
  const pocs = getOutletAssignees(db.users, db.roles, outletId);
  const heads = db.users.filter(
    (u) => u.active && u.roleId === "sales_head" && (u.outletIds.includes("*") || u.outletIds.includes(outletId))
  );
  return clone([...pocs, ...heads].map((u) => ({ ...publicUser(u), roleLabel: db.roles.find((r) => r.id === u.roleId)?.label })));
}

/** Users visible on the Sales POC filter. */
export async function listSalesTeam() {
  const { db, user } = context();
  const outlets = accessibleOutlets(db, user).map((o) => o.id);
  return clone(
    db.users
      .filter((u) => ["sales_poc", "sales_head"].includes(u.roleId))
      .filter((u) => u.outletIds.includes("*") || u.outletIds.some((id) => outlets.includes(id)))
      .map(publicUser)
  );
}

export async function listUsers() {
  await delay();
  const { db, user } = context();
  requirePermission(user, P.USER_MANAGE);
  return clone(
    db.users.map((u) => ({
      ...publicUser(u),
      active: u.active,
      brandIds: u.brandIds,
      roleLabel: db.roles.find((r) => r.id === u.roleId)?.label,
      outletNames: u.outletIds.includes("*") ? ["All outlets"] : u.outletIds.map((id) => db.outlets.find((o) => o.id === id)?.name),
    }))
  );
}

export async function listRoles() {
  await delay();
  const { db, user } = context();
  requirePermission(user, P.ROLE_MANAGE);
  return clone(db.roles);
}
