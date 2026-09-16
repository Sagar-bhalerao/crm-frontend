/**
 * Dropdown options for lead forms and filters.
 * Later these can come from a settings API per brand.
 */
export const LEAD_TYPES = [
  { key: "birthday_party", label: "Birthday party", fields: ["celebrant"] },
  { key: "party_booking", label: "Party booking", fields: [] },
  { key: "corporate_event", label: "Corporate event", fields: ["company"] },
];

export function getLeadType(key) {
  return LEAD_TYPES.find((t) => t.key === key) || { key, label: key, fields: [] };
}

export function leadTypeNeeds(typeKey, field) {
  return getLeadType(typeKey).fields.includes(field);
}

export const LEAD_SOURCES = [
  { key: "website", label: "Website form", manual: false },
  { key: "phone", label: "Phone call", manual: true },
  { key: "walk_in", label: "Walk-in", manual: true },
  { key: "email", label: "Email", manual: true },
  { key: "social", label: "Social media", manual: true },
  { key: "referral", label: "Referral", manual: true },
];

export function getLeadSource(key) {
  return LEAD_SOURCES.find((s) => s.key === key) || { key, label: key };
}

export const TIME_SLOTS = [
  { key: "lunch", label: "Lunch (12 – 3 PM)" },
  { key: "evening", label: "Evening (4 – 7 PM)" },
  { key: "night", label: "Night (7 – 11 PM)" },
];

export function getTimeSlot(key) {
  return TIME_SLOTS.find((s) => s.key === key)?.label || "—";
}

export const REQUIREMENTS = [
  "Food & beverages",
  "Game play cards",
  "Private area",
  "Decorations",
  "Cake",
  "Return gifts",
  "Bar package",
  "AV / projector",
];

export const FOLLOW_UP_CHANNELS = [
  { key: "call", label: "Phone call" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "meeting", label: "Meeting" },
  { key: "site_visit", label: "Outlet visit" },
];

export function getChannel(key) {
  return FOLLOW_UP_CHANNELS.find((c) => c.key === key)?.label || key;
}

export const FOLLOW_UP_OUTCOMES = [
  "Spoke with customer",
  "No answer",
  "Asked to call back",
  "Requested quotation",
  "Negotiating price",
  "Will visit outlet",
  "Confirmed verbally",
];

export const DATE_PRESETS = [
  { key: "", label: "Any time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "custom", label: "Custom range" },
];

export const SORT_OPTIONS = [
  { key: "createdAt:desc", label: "Newest first" },
  { key: "createdAt:asc", label: "Oldest first" },
  { key: "eventDate:asc", label: "Event date (soonest)" },
  { key: "lastFollowUpAt:desc", label: "Recently followed up" },
  { key: "customer.name:asc", label: "Customer name (A–Z)" },
];
