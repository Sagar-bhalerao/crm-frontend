/**
 * Approved customer-facing templates, per brand.
 * The CRM only fills placeholders — it never composes its own wording.
 * Placeholders use {{path}} and are filled by lib/confirmation.js.
 *
 * In production: stored in DB with version + approval, and the WhatsApp
 * text must match the template registered with the WhatsApp Business API.
 */
export const TEMPLATES = {
  "dnb-india": {
    bookingConfirmation: {
      id: "dnb_booking_confirmation",
      version: 3,
      approvedOn: "2026-08-01",
      whatsapp: [
        "Hi {{customer.name}},",
        "",
        "Your {{event.typeLabelLower}} at Dave & Buster's {{outlet.name}} is confirmed.",
        "",
        "Confirmation no: {{booking.confirmationNumber}}",
        "Date: {{event.dateLabel}}",
        "Time: {{event.timeSlotLabel}}",
        "Guests: {{event.guests}}",
        "",
        "Booking amount: {{booking.totalLabel}}",
        "Advance received: {{booking.advanceLabel}}",
        "Balance payable at venue: {{booking.balanceLabel}}",
        "",
        "Your event coordinator: {{assignee.name}}, {{assignee.phoneLabel}}",
        "Venue: {{outlet.address}}",
        "",
        "Please carry this confirmation on the day. See you soon!",
      ].join("\n"),
      email: {
        subject: "Booking confirmed: {{booking.confirmationNumber}} | Dave & Buster's {{outlet.name}}",
        heading: "Your booking is confirmed",
        intro:
          "Hi {{customer.name}}, thank you for choosing Dave & Buster's {{outlet.name}}. Your booking details are below.",
        rows: [
          ["Confirmation no.", "{{booking.confirmationNumber}}"],
          ["Event", "{{event.typeLabel}}"],
          ["Company", "{{company.name}}"],
          ["Date", "{{event.dateLabel}}"],
          ["Time", "{{event.timeSlotLabel}}"],
          ["Guests", "{{event.guests}}"],
          ["Booking amount", "{{booking.totalLabel}}"],
          ["Advance received", "{{booking.advanceLabel}}"],
          ["Balance payable at venue", "{{booking.balanceLabel}}"],
          ["Venue", "{{outlet.address}}"],
        ],
        closing:
          "Your event coordinator {{assignee.name}} ({{assignee.phoneLabel}}, {{assignee.emailLabel}}) will reach out 48 hours before your event to confirm final arrangements.",
        footer: "Dave & Buster's India. This is an automated confirmation for booking {{booking.confirmationNumber}}.",
      },
    },
  },
};

export function getTemplate(brandId, key) {
  return TEMPLATES[brandId]?.[key] || null;
}
