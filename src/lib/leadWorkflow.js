import { getStatus, LEAD_STATUSES } from "@/config/leadStatuses";
import { can } from "./permissions";

/** Open = still being worked on (not finalized / closed). */
export function isOpenLead(lead) {
  const s = getStatus(lead.status);
  return s.onPath && !s.terminal;
}

/** Statuses the user may move this lead to. */
export function getNextStatuses(lead, user) {
  return getStatus(lead.status)
    .next.map(getStatus)
    .filter((s) => !s.permission || can(user, s.permission));
}

/** Returns a message if the lead cannot enter `statusKey` yet, otherwise null. */
export function getRequirementError(lead, statusKey) {
  const target = getStatus(statusKey);
  if (target.requires === "quotation" && !lead.quotation) return "Create a quotation before moving to this stage.";
  if (target.requires === "invoice" && !lead.invoice) return "Generate a proforma invoice before moving to this stage.";
  return null;
}

/** Index on the pipeline (used by the stage rail). -1 when off-path. */
export function getStageIndex(statusKey) {
  return LEAD_STATUSES.filter((s) => s.onPath).findIndex((s) => s.key === statusKey);
}

export function isFollowUpOverdue(lead, now = Date.now()) {
  return Boolean(lead.nextFollowUpAt) && isOpenLead(lead) && new Date(lead.nextFollowUpAt).getTime() < now;
}
