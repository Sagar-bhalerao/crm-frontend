/**
 * Mock organisation data: brands, outlets, roles, users.
 * In production these come from PostgreSQL via the Express API.
 *
 * Adding a brand = add a brand + its outlets + give users access.
 * No component changes needed.
 */

export const BRANDS = [
  {
    id: "dnb-india",
    name: "Dave & Buster's India",
    shortName: "D&B India",
    code: "DNB",
    active: true,
    website: "Dave & Buster's India website",
    supportEmail: "events@dnbindia.example",
    supportPhone: "1800 000 0000",
  },
  // Future brands — present in data, inactive in Phase 1
  { id: "imagicaa", name: "Imagicaa", shortName: "Imagicaa", code: "IMG", active: false },
  { id: "wetnjoy", name: "Wet'nJoy", shortName: "Wet'nJoy", code: "WNJ", active: false },
];

export const OUTLETS = [
  {
    id: "dnb-mumbai",
    brandId: "dnb-india",
    name: "Mumbai",
    code: "MUM",
    city: "Mumbai",
    address: "Sample address, Mumbai, Maharashtra",
    phone: "+91 22 0000 0001",
    active: true,
  },
  {
    id: "dnb-bangalore",
    brandId: "dnb-india",
    name: "Bangalore",
    code: "BLR",
    city: "Bengaluru",
    address: "Sample address, Bengaluru, Karnataka",
    phone: "+91 80 0000 0002",
    active: true,
  },
  {
    id: "dnb-delhi",
    brandId: "dnb-india",
    name: "Delhi",
    code: "DEL",
    city: "New Delhi",
    address: "Sample address, New Delhi",
    phone: "+91 11 0000 0003",
    active: true,
  },
];

/**
 * receivesLeads: users with this role are candidates for automatic
 * outlet-based assignment.
 */
export const ROLES = [
  {
    id: "super_admin",
    label: "Super Admin",
    description: "The only role that can change brands, locations and global settings.",
    permissions: ["*"],
    receivesLeads: false,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Runs CRM operations for their brands. Global settings are read-only.",
    permissions: [
      "lead.view", "lead.view.all", "lead.create", "lead.update", "lead.assign", "lead.finalize", "lead.delete",
      "followup.create", "quotation.view", "quotation.create", "invoice.view", "invoice.create",
      "mail.view", "report.view", "user.manage", "demo.simulate",
      "brand.view", "location.view", "settings.view",
    ],
    receivesLeads: false,
  },
  {
    id: "sales_head",
    label: "Sales Head",
    description: "Oversees Sales POCs and leads in their outlets.",
    permissions: [
      "lead.view", "lead.view.outlet", "lead.create", "lead.update", "lead.assign", "lead.finalize",
      "followup.create", "quotation.view", "quotation.create", "invoice.view", "invoice.create",
      "mail.view", "mail.send", "report.view", "demo.simulate", "location.view",
    ],
    receivesLeads: false,
  },
  {
    id: "sales_poc",
    label: "Sales POC",
    description: "Works leads assigned to them at their outlet.",
    permissions: [
      "lead.view", "lead.create", "lead.update", "lead.finalize",
      "followup.create", "quotation.view", "quotation.create", "invoice.view", "invoice.create",
      "mail.view", "mail.send", "demo.simulate",
    ],
    receivesLeads: true,
  },
];

const mailbox = (address) => ({ address, provider: "google", connected: true, lastSyncedAt: null });

/** Mock users — every account uses the password: demo@123 */
export const USERS = [
  {
    id: "u_superadmin",
    name: "Rohan Mehta",
    email: "superadmin@crm.example",
    phone: "9820000001",
    title: "CRM Super Admin",
    roleId: "super_admin",
    brandIds: ["*"],
    outletIds: ["*"],
    active: true,
  },
  {
    id: "u_admin",
    name: "Neha Kapoor",
    email: "admin@crm.example",
    phone: "9820000002",
    title: "CRM Admin, D&B India",
    roleId: "admin",
    brandIds: ["dnb-india"],
    outletIds: ["*"],
    active: true,
  },
  {
    id: "u_saleshead",
    name: "Vikram Singh",
    email: "saleshead@crm.example",
    phone: "9820000003",
    title: "Sales Head, West & North",
    roleId: "sales_head",
    brandIds: ["dnb-india"],
    outletIds: ["dnb-mumbai", "dnb-delhi"],
    active: true,
    mailbox: mailbox("vikram.singh@dnbindia.example"),
  },
  {
    id: "u_poc_mum_1",
    name: "Priya Nair",
    email: "priya@crm.example",
    phone: "9820000004",
    title: "Sales POC, Mumbai",
    roleId: "sales_poc",
    brandIds: ["dnb-india"],
    outletIds: ["dnb-mumbai"],
    active: true,
    mailbox: mailbox("priya.nair@dnbindia.example"),
  },
  {
    id: "u_poc_mum_2",
    name: "Aditya Rao",
    email: "aditya@crm.example",
    phone: "9820000005",
    title: "Sales POC, Mumbai",
    roleId: "sales_poc",
    brandIds: ["dnb-india"],
    outletIds: ["dnb-mumbai"],
    active: true,
    mailbox: mailbox("aditya.rao@dnbindia.example"),
  },
  {
    id: "u_poc_blr",
    name: "Kavya Reddy",
    email: "kavya@crm.example",
    phone: "9820000006",
    title: "Sales POC, Bangalore",
    roleId: "sales_poc",
    brandIds: ["dnb-india"],
    outletIds: ["dnb-bangalore"],
    active: true,
    mailbox: mailbox("kavya.reddy@dnbindia.example"),
  },
  {
    id: "u_poc_del",
    name: "Arjun Malhotra",
    email: "arjun@crm.example",
    phone: "9820000007",
    title: "Sales POC, Delhi",
    roleId: "sales_poc",
    brandIds: ["dnb-india"],
    outletIds: ["dnb-delhi"],
    active: true,
    mailbox: mailbox("arjun.malhotra@dnbindia.example"),
  },
];

export const DEMO_PASSWORD = "demo@123";

/** Shown as quick-fill buttons on the login screen. */
export const DEMO_ACCOUNTS = [
  { userId: "u_superadmin", hint: "All brands and outlets" },
  { userId: "u_admin", hint: "D&B India, all outlets" },
  { userId: "u_saleshead", hint: "Mumbai and Delhi" },
  { userId: "u_poc_mum_1", hint: "Own leads, Mumbai" },
];
