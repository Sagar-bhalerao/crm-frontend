/** Choices and labels shared by the WhatsApp and mail configuration screens. */

export const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

export const AUTH_TYPE_OPTIONS = [
  { value: "bearer", label: "Bearer token" },
  { value: "api_key", label: "API key header" },
  { value: "basic", label: "Basic auth" },
  { value: "none", label: "None" },
];

export const authTypeLabel = (value) => AUTH_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;

export const SMTP_SECURITY_OPTIONS = [
  { value: "starttls", label: "STARTTLS (port 587)" },
  { value: "ssl", label: "SSL/TLS (port 465)" },
  { value: "none", label: "None (port 25)" },
];

export const smtpSecurityLabel = (value) => SMTP_SECURITY_OPTIONS.find((o) => o.value === value)?.label ?? value;

/** The port each encryption type normally uses, filled in when the type changes. */
export const DEFAULT_SMTP_PORT = { starttls: 587, ssl: 465, none: 25 };

export const CONFIG_SORT_OPTIONS = [
  { value: "brand:asc", label: "Brand A–Z" },
  { value: "brand:desc", label: "Brand Z–A" },
  { value: "location:asc", label: "Location A–Z" },
  { value: "updatedAt:desc", label: "Recently updated" },
];

export const PLACEHOLDER_HINT =
  "Placeholders such as {{customer.name}}, {{brand.name}} and {{location.name}} are filled in when it is sent.";

/** "Lonavala (Wet n Joy)" */
export const configName = (c) => (c ? `${c.locationName} (${c.brandName})` : "");

/** Sending skips a configuration whose location or brand has been deactivated. */
export const masterInactive = (c) =>
  (c.locationStatus !== undefined && c.locationStatus !== 1) || (c.brandStatus !== undefined && c.brandStatus !== 1);

/** Saved secrets are only ever described, never shown. */
export const savedSecretText = (isSet, hint) => (isSet ? (hint ? `Saved, ends in ${hint}` : "Saved") : "Not set");

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
export const isValidHttpUrl = (v) => /^https?:\/\/\S+$/i.test(String(v).trim());
