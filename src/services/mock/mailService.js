import { P } from "@/config/permissions";
import { AppError, createId } from "@/lib/utils";
import { addActivity, clone, commit, context, delay, findUser, loadLead, nowIso, requirePermission } from "./helpers";

/**
 * Lead email thread, synced from Sales POC mailboxes.
 * Later: Gmail / Microsoft 365 OAuth per user; the API matches messages to
 * leads by customer email address and stores them against the lead.
 */

export async function getLeadMail(leadId) {
  await delay();
  const { db, user } = context();
  requirePermission(user, P.MAIL_VIEW);
  const lead = loadLead(db, user, leadId);
  const me = findUser(db, user.id);
  return clone({
    mailbox: me.mailbox || null,
    canSend: Boolean(me.mailbox?.connected) && user.permissions.some((p) => p === "*" || p === P.MAIL_SEND),
    emails: [...lead.emails].sort((a, b) => new Date(a.at) - new Date(b.at)),
  });
}

export async function sendLeadEmail(leadId, { subject, body }) {
  await delay(600);
  const { db, user } = context();
  requirePermission(user, P.MAIL_SEND);
  const lead = loadLead(db, user, leadId);
  const me = findUser(db, user.id);
  if (!me.mailbox?.connected) throw new AppError("Connect your mailbox before sending emails.", "NO_MAILBOX");
  if (!subject?.trim() || !body?.trim()) throw new AppError("Add a subject and a message.", "VALIDATION");

  lead.emails.push({ id: createId("em"), direction: "out", from: me.mailbox.address, to: lead.customer.email, subject, body, at: nowIso() });
  addActivity(lead, "email_sent", `Email sent: ${subject}`, user.id);
  return commit(db, lead);
}

/** Pull new messages. Mock: the customer replies to the latest outgoing email. */
export async function syncMailbox(leadId) {
  await delay(1100);
  const { db, user } = context();
  const lead = loadLead(db, user, leadId);
  const me = findUser(db, user.id);
  if (me.mailbox) me.mailbox.lastSyncedAt = nowIso();

  const last = [...lead.emails].sort((a, b) => new Date(b.at) - new Date(a.at))[0];
  let newCount = 0;
  if (last && last.direction === "out") {
    lead.emails.push({
      id: createId("em"),
      direction: "in",
      from: lead.customer.email,
      to: last.from,
      subject: last.subject.startsWith("Re:") ? last.subject : `Re: ${last.subject}`,
      body: `Hi,\n\nThanks for sending this across. We are reviewing it and will get back to you by tomorrow.\n\nRegards,\n${lead.customer.name}`,
      at: nowIso(),
    });
    addActivity(lead, "email_received", "Customer replied by email", null);
    newCount = 1;
  }
  commit(db, lead);
  return { newCount, lastSyncedAt: me.mailbox?.lastSyncedAt || nowIso() };
}
