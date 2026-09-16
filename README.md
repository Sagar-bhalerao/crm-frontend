# Nucleus CRM: frontend

Next.js app for the multi-brand CRM, starting with **Dave & Buster's India** (Mumbai, Bangalore, Delhi).

Two modules:

- **Super Admin configuration** (Brands, Locations, Configuration) — reads and writes PostgreSQL through the Express API in `../backend`.
- **Lead Management** — still runs on in-browser mock data, and can be switched to the API later without changing screens.

For installing and running both apps together, see the README one level up.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, JavaScript (JSDoc types), lucide-react icons, IBM Plex Sans.

---

## Run it

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Copy `.env.example` to `.env.local` and check `NEXT_PUBLIC_API_BASE_URL` points at the Express API
(`http://localhost:5000/api/v1` by default).

The lead module works without the backend. The **Brands** and **Locations** screens need it running,
otherwise they show an error with a Retry button.

## Sample logins

All accounts use the password **`demo@123`**. The login page also has one-click buttons for each role.

| Role        | Email                    | Leads                  | Global settings                      |
|-------------|--------------------------|------------------------|--------------------------------------|
| Super Admin | superadmin@crm.example   | All brands and outlets | Full access, the only role that can change anything |
| Admin       | admin@crm.example        | D&B India, all outlets | Read-only                            |
| Sales Head  | saleshead@crm.example    | Mumbai and Delhi       | Locations read-only                  |
| Sales POC   | priya@crm.example        | Own leads, Mumbai      | None                                 |
| Sales POC   | aditya@crm.example       | Own leads, Mumbai      | None                                 |
| Sales POC   | kavya@crm.example        | Own leads, Bangalore   | None                                 |
| Sales POC   | arjun@crm.example        | Own leads, Delhi       | None                                 |

Lead data is saved in the browser (localStorage), so changes survive a refresh.
Use **User menu → Restore sample data** to reset it. Brands and Locations live in PostgreSQL
and are not affected by that reset.

## Try the full flow

1. Log in as Admin and click **Simulate website enquiry** in the header. This acts like the website form posting a lead.
2. The lead is assigned automatically to the outlet's Sales POC with the fewest open leads, and they get a notification.
3. Open the lead from **Leads** and **Log follow-up**. A New lead moves to In progress.
4. **Create quotation** → **Share with customer**. The lead moves to Quotation.
5. **Generate proforma invoice**. The lead moves to Proforma invoice.
6. **Finalize booking**. The confirmation preview opens with the brand's approved template.
7. **Send confirmation**. WhatsApp and email show as delivered (simulated), and the email appears in the lead's Emails tab.

Sales POCs can also add leads by hand from **New lead** (phone, walk-in, email, referral).

---

## Folder structure

```
src/
  app/                  Routes only. Pages are thin and render a view component.
    login/
    (crm)/              Everything behind login: dashboard, leads, leads/new, leads/[id],
                        follow-ups, brands, locations, users, roles, and Phase 2 placeholders
  components/
    ui/                 Button, Field, Input, Select, Modal, Tabs, Panel, Pagination, states…
    layout/ sidebar/ header/
    dashboard/          Dashboard view and widgets
    leads/              List, filters, detail, and all workflow dialogs
    admin/              Brands and Locations: views, form dialogs, shared toolbar and list hook
    auth/ common/
  config/               Business rules as data (edit these first)
    leadStatuses.js     Statuses, allowed transitions, requirements, tone
    permissions.js      Permission catalogue
    leadOptions.js      Lead types, sources, time slots, requirements, follow-up options
    navigation.js       Sidebar items and the permission each needs
    pricing.js          Sample rate card per brand
    app.js              App name, data source, defaults (GST %, advance %, page size)
  services/
    index.js            The ONE place that chooses mock or API (lead module)
    mock/               In-browser implementation of the backend
    api/                Same functions, calling the REST API
    admin/              Brands and Locations. Always the real API, never mock.
  mock/                 Sample brands, outlets, users, seed leads, approved templates
  lib/                  Pure helpers: permissions, assignment, workflow, filtering, formatting
  hooks/                useQuery (load + auto refresh), useAction (busy + toast)
  context/              AuthContext, ToastContext
  app/globals.css       Design tokens and reusable classes (.btn, .input, .panel, .table…)
```

Rule of thumb: **components never import from `mock/`** and never call `fetch` directly.
Lead screens use `@/services`; configuration screens use `@/services/admin`.

## Common changes

**Add a lead status.** Add an entry in `config/leadStatuses.js` with a key, label, tone and `next` transitions.
Badges, filters, the dashboard strip and the status dialog pick it up automatically.

**Add a permission or role.** Add the key in `config/permissions.js`, then grant it to roles.
Screens check permissions (`can(P.LEAD_ASSIGN)`), never role names.

**Add a brand or location (e.g. Imagicaa, Wet'nJoy).** Use **Global settings → Brands** and **Locations**.
That writes to PostgreSQL through the API.

The lead module still reads brands and outlets from `mock/organization.js`, so a brand added in the
admin screens does not appear in the lead screens yet. Those two join up when leads move onto the API.
A new brand also needs a rate card in `config/pricing.js` and an approved template in `mock/templates.js`.

**Change a global default (GST, advance, page size).** Use **Global settings → Configuration**.
The built-in fallbacks live in `config/app.js` and `services/settings.service.js` on the backend.

**Change colours or spacing.** Edit the tokens at the top of `app/globals.css`.

---

## Connecting the Express API

Set in `.env.local`:

```
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

The files in `services/api/` already call these endpoints. Each function has the same name, arguments and return shape as its mock twin.
The API needs to return the same shapes, which are documented in `src/lib/types.js`.

| Method | Endpoint                          | Service function            |
|--------|-----------------------------------|-----------------------------|
| POST   | /auth/login                       | authService.login           |
| GET    | /auth/me                          | authService.getSession      |
| POST   | /auth/logout                      | authService.logout          |
| POST   | /auth/forgot-password             | authService.requestPasswordReset |
| GET    | /dashboard                        | leadService.getDashboard    |
| GET    | /leads?search=&status=&outletId=&type=&assignedToId=&date=&from=&to=&sort=&page=&pageSize= | leadService.listLeads |
| POST   | /leads                            | leadService.createLead      |
| GET    | /leads/:id                        | leadService.getLead         |
| PATCH  | /leads/:id                        | leadService.updateLeadDetails |
| POST   | /leads/:id/status                 | leadService.changeStatus    |
| POST   | /leads/:id/assign                 | leadService.assignLead      |
| POST   | /leads/:id/follow-ups             | leadService.addFollowUp     |
| PUT    | /leads/:id/quotation              | leadService.saveQuotation   |
| POST   | /leads/:id/proforma-invoice       | leadService.generateInvoice |
| POST   | /leads/:id/finalize               | leadService.finalizeLead    |
| GET    | /leads/:id/confirmation           | leadService.getConfirmationPreview |
| POST   | /leads/:id/confirmation           | leadService.sendConfirmation |
| GET    | /follow-ups                       | leadService.listFollowUps   |
| POST   | /public/enquiries                 | website form (simulateWebsiteEnquiry) |
| GET    | /leads/:id/emails                 | mailService.getLeadMail     |
| POST   | /leads/:id/emails                 | mailService.sendLeadEmail   |
| POST   | /leads/:id/emails/sync            | mailService.syncMailbox     |
| GET    | /brands, /outlets, /users, /users/sales-team, /roles, /outlets/:id/assignees | orgService.* |
| GET    | /notifications, POST /notifications/read-all | notificationService.* |

Check the exact paths in `services/api/*.js`, which is the source of truth.

**What must move to the server** (the mock does these in the browser today):

- Permission and outlet checks on every request. The UI hides actions, but the API must enforce them.
- Status transition rules (mirror `config/leadStatuses.js`) and the assignment rule (`lib/assignment.js`).
- Rendering confirmations from the approved template (`lib/confirmation.js`), and sending them through the WhatsApp provider and email.
- Mailbox sync for each Sales POC (Gmail / Microsoft 365 OAuth), matching emails to leads by customer address.
- Lead, quotation, invoice and confirmation numbering.

Errors should return JSON `{ "message": "...", "code": "..." }` with a proper HTTP status. The UI shows `message` to the user.

---

## Super Admin configuration

The sidebar has a **Global settings** section: **Brands**, **Locations** and **Configuration**.
Users and Roles stay under Administration.

**Brands** (`/brands`) — list with search, status filter, sorting and pagination, showing the code,
location count, and created and updated dates. Each row has an actions menu: View details,
Manage locations, Edit, Activate/Deactivate, Delete.

**Brand details** (`/brands/[id]`) — the brand's fields and history, its locations, and the same actions.
You can add a location straight from here.

**Locations** (`/locations`) — the same pattern, with a brand filter. `/locations?brandId=3` opens
pre-filtered, which is where the location count on the Brands list links to.

**Configuration** (`/settings`) — global values stored in PostgreSQL, shared by everyone:

| Setting | Where it is used |
|---------|------------------|
| GST rate | Starting tax rate on a new quotation |
| Advance required | Default advance on a new proforma invoice |
| Quotation validity | Valid-until date on a new quotation |
| First response target | When the dashboard flags a new lead as not contacted |
| Rows per page | Page size on the configuration lists |

They set the starting point for new documents; quotations and invoices already created keep the
numbers they were made with. The page also shows the lead statuses, types and sources, which are
still defined in code.

**Deactivate rather than delete.** A deactivated brand keeps its locations, leads and history and simply
stops being offered for new work. Delete is permanent, and the API refuses to delete a brand that still
has locations. A location cannot be created under an inactive brand.

Where things live:

```
src/services/admin/     brandService, locationService, settingsService, and the client that unwraps { success, message, data }
src/components/admin/   BrandsView, BrandDetailView, LocationsView, SettingsView, the form dialogs,
                        ListToolbar, ReadOnlyNotice, useAdminList
src/components/ui/      DataTable (table on desktop, cards on mobile), DropdownMenu, StatusBadge
src/context/            SettingsContext, loaded once per session
src/app/(crm)/brands, .../brands/[id], .../locations, .../settings
```

Validation runs in the form for quick feedback and again in the API, which is what actually enforces it:
duplicate codes, unknown brand ids and out-of-range settings are rejected server-side and shown as an
error toast.

### Who can change what

Only the Super Admin. Other roles either do not see these screens or see them read-only, with a note
explaining why and no create, edit, status or delete controls rendered.

Permissions used: `brand.view/create/update/delete`, `location.view/create/update/delete`,
`settings.view/manage`. They are granted per role in `mock/organization.js` for now and will come from
the database with the user module. Screens check permissions, never role names.

## Known limits of the prototype

- Mock login only. Passwords and sessions are not secure.
- Rate card prices, outlet addresses and email domains are placeholders.
- Quotations, invoices, reports and settings list pages are Phase 2 placeholders.
  The lead workflow already captures that data.
- No PDF generation yet. Quotations and invoices are shown on screen.
- Brands, Locations and Configuration are real; Users and Roles are still read-only.
- Delete does not yet check for leads, because leads are not in PostgreSQL. Add that check when they are.
- Brand logo is a URL field. File upload comes later.
