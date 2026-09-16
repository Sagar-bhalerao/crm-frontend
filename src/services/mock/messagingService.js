import { delay, nowIso } from "./helpers";

/**
 * Customer messaging (WhatsApp + email).
 * Mock: pretends both channels delivered.
 * Later: POST /leads/:id/confirmation -> API queues WhatsApp Business API
 * template message + transactional email, and reports delivery via webhooks.
 */
export async function deliverBookingConfirmation(lead) {
  await delay(900);
  const at = nowIso();
  return {
    whatsapp: { status: "delivered", to: lead.customer.mobile, at },
    email: { status: "delivered", to: lead.customer.email, at },
  };
}
