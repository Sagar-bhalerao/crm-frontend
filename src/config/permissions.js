/**
 * Permission catalogue.
 *
 * The UI only ever checks permissions (never role names), so roles can be
 * edited later from the database without touching components.
 *
 * Lead visibility scope:
 *   lead.view            -> can open the leads module (sees leads assigned to them)
 *   lead.view.outlet     -> sees every lead in the outlets they belong to
 *   lead.view.all        -> sees every lead in the brands they belong to
 */
export const P = {
  LEAD_VIEW: "lead.view",
  LEAD_VIEW_OUTLET: "lead.view.outlet",
  LEAD_VIEW_ALL: "lead.view.all",
  LEAD_CREATE: "lead.create",
  LEAD_UPDATE: "lead.update",
  LEAD_ASSIGN: "lead.assign",
  LEAD_DELETE: "lead.delete",
  LEAD_FINALIZE: "lead.finalize",
  FOLLOWUP_CREATE: "followup.create",
  QUOTATION_VIEW: "quotation.view",
  QUOTATION_CREATE: "quotation.create",
  INVOICE_VIEW: "invoice.view",
  INVOICE_CREATE: "invoice.create",
  MAIL_VIEW: "mail.view",
  MAIL_SEND: "mail.send",
  REPORT_VIEW: "report.view",
  BRAND_VIEW: "brand.view",
  BRAND_CREATE: "brand.create",
  BRAND_UPDATE: "brand.update",
  BRAND_DELETE: "brand.delete",
  LOCATION_VIEW: "location.view",
  LOCATION_CREATE: "location.create",
  LOCATION_UPDATE: "location.update",
  LOCATION_DELETE: "location.delete",
  USER_MANAGE: "user.manage",
  ROLE_MANAGE: "role.manage",
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",
  DEMO_SIMULATE: "demo.simulate",
};

/** Grouped list used by the Roles & permissions screen. */
export const PERMISSION_GROUPS = [
  {
    label: "Leads",
    items: [
      { key: P.LEAD_VIEW, label: "View assigned leads" },
      { key: P.LEAD_VIEW_OUTLET, label: "View all leads in own outlets" },
      { key: P.LEAD_VIEW_ALL, label: "View all leads in own brands" },
      { key: P.LEAD_CREATE, label: "Create leads" },
      { key: P.LEAD_UPDATE, label: "Update leads and status" },
      { key: P.LEAD_ASSIGN, label: "Assign and reassign leads" },
      { key: P.LEAD_FINALIZE, label: "Finalize bookings" },
      { key: P.LEAD_DELETE, label: "Delete leads" },
      { key: P.FOLLOWUP_CREATE, label: "Log follow-ups" },
    ],
  },
  {
    label: "Quotations & invoices",
    items: [
      { key: P.QUOTATION_VIEW, label: "View quotations" },
      { key: P.QUOTATION_CREATE, label: "Create and share quotations" },
      { key: P.INVOICE_VIEW, label: "View proforma invoices" },
      { key: P.INVOICE_CREATE, label: "Generate proforma invoices" },
    ],
  },
  {
    label: "Email",
    items: [
      { key: P.MAIL_VIEW, label: "View lead emails" },
      { key: P.MAIL_SEND, label: "Send emails from own mailbox" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { key: P.BRAND_VIEW, label: "View brands" },
      { key: P.BRAND_CREATE, label: "Create brands" },
      { key: P.BRAND_UPDATE, label: "Update brands and their status" },
      { key: P.LOCATION_VIEW, label: "View locations" },
      { key: P.LOCATION_CREATE, label: "Create locations" },
      { key: P.LOCATION_UPDATE, label: "Update locations and their status" },
      { key: P.BRAND_DELETE, label: "Delete brands" },
      { key: P.LOCATION_DELETE, label: "Delete locations" },
      { key: P.SETTINGS_VIEW, label: "View global settings" },
      { key: P.SETTINGS_MANAGE, label: "Change global settings" },
    ],
  },
  {
    label: "Administration",
    items: [
      { key: P.REPORT_VIEW, label: "View reports" },
      { key: P.USER_MANAGE, label: "Manage users" },
      { key: P.ROLE_MANAGE, label: "Manage roles and permissions" },
      { key: P.DEMO_SIMULATE, label: "Simulate website enquiries (prototype)" },
    ],
  },
];
