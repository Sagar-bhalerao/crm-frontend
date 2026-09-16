import {
  LayoutDashboard,
  Inbox,
  CalendarClock,
  FileText,
  Receipt,
  BarChart3,
  Users,
  Building2,
  MapPin,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { P } from "./permissions";

/**
 * Sidebar navigation. Items are shown only if the user has `permission`.
 * `phase: 2` marks modules that are placeholders in Phase 1.
 */
export const NAV_SECTIONS = [
  {
    label: "Sales",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: P.LEAD_VIEW },
      { href: "/leads", label: "Leads", icon: Inbox, permission: P.LEAD_VIEW },
      { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock, permission: P.LEAD_VIEW },
      { href: "/quotations", label: "Quotations", icon: FileText, permission: P.QUOTATION_VIEW, phase: 2 },
      { href: "/invoices", label: "Proforma invoices", icon: Receipt, permission: P.INVOICE_VIEW, phase: 2 },
      { href: "/reports", label: "Reports", icon: BarChart3, permission: P.REPORT_VIEW, phase: 2 },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users", icon: Users, permission: P.USER_MANAGE },
      { href: "/roles", label: "Roles & permissions", icon: ShieldCheck, permission: P.ROLE_MANAGE },
    ],
  },
  {
    label: "Global settings",
    items: [
      { href: "/brands", label: "Brands", icon: Building2, permission: P.BRAND_VIEW },
      { href: "/locations", label: "Locations", icon: MapPin, permission: P.LOCATION_VIEW },
      { href: "/settings", label: "Configuration", icon: Settings, permission: P.SETTINGS_VIEW },
    ],
  },
];

/** Labels for breadcrumb segments. Dynamic segments (lead IDs) show as-is. */
export const BREADCRUMB_LABELS = {
  dashboard: "Dashboard",
  leads: "Leads",
  new: "New lead",
  "follow-ups": "Follow-ups",
  quotations: "Quotations",
  invoices: "Proforma invoices",
  reports: "Reports",
  brands: "Brands",
  locations: "Locations",
  users: "Users",
  roles: "Roles & permissions",
  settings: "Configuration",
};
