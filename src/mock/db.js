import { BRANDS, OUTLETS, ROLES, USERS } from "./organization";
import { buildSeedLeads } from "./seedLeads";

/**
 * In-browser mock database, persisted to localStorage so the demo
 * survives page reloads. Only services/mock/* should import this.
 *
 * Bump SEED_VERSION whenever mock data shapes change — browsers
 * holding the old data will reseed automatically.
 */
const STORAGE_KEY = "nucleus-crm:mock-db";
const SEED_VERSION = 4;

let db = null;

function seed() {
  const now = Date.now();
  const counters = { lead: 10001, quotation: 5001, invoice: 7001, booking: 9001 };
  const brand = BRANDS.find((b) => b.id === "dnb-india");
  const outlets = OUTLETS.filter((o) => o.brandId === brand.id);
  const users = USERS.map((u) => (u.mailbox ? { ...u, mailbox: { ...u.mailbox, lastSyncedAt: new Date(now - 12 * 60000).toISOString() } } : u));
  const leads = buildSeedLeads({ now, brand, outlets, users, roles: ROLES, counters });

  // A few unread in-app notifications for the newest leads
  const notifications = leads
    .filter((l) => l.status === "new")
    .slice(0, 5)
    .map((l, i) => ({
      id: `nt_seed_${i}`,
      userId: l.assignedToId,
      leadId: l.id,
      message: `New lead ${l.id} from ${l.customer.name} assigned to you`,
      at: l.createdAt,
      read: false,
    }));

  return {
    version: SEED_VERSION,
    seededAt: new Date(now).toISOString(),
    brands: BRANDS,
    outlets: OUTLETS,
    roles: ROLES,
    users,
    leads,
    notifications,
    counters,
  };
}

export function getDb() {
  if (db) return db;
  if (typeof window !== "undefined") {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.version === SEED_VERSION) db = saved;
    } catch {
      /* corrupted storage: reseed */
    }
  }
  if (!db) {
    db = seed();
    saveDb();
  }
  return db;
}

export function saveDb() {
  if (typeof window === "undefined" || !db) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full / private mode: keep in memory only */
  }
}

export function resetDb() {
  db = seed();
  saveDb();
  return db;
}
