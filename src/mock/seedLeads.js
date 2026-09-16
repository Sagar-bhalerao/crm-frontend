import { getLeadType } from "@/config/leadOptions";
import { getStatus } from "@/config/leadStatuses";
import { DEFAULT_PACKAGE_BY_TYPE, getCatalog } from "@/config/pricing";
import { DEFAULT_ADVANCE_PERCENT, DEFAULT_TAX_RATE, QUOTATION_VALID_DAYS } from "@/config/app";
import { calcTotals } from "@/lib/quotation";
import { formatDate } from "@/lib/format";
import { seededRandom } from "@/lib/utils";

/**
 * Generates a realistic, internally consistent set of demo leads
 * relative to "now", so Today / This week always have data.
 */

const FIRST = ["Riya", "Karan", "Ananya", "Rahul", "Sneha", "Arjun", "Meera", "Siddharth", "Pooja", "Nikhil", "Isha", "Varun", "Tanvi", "Aman", "Divya", "Rohit", "Shreya", "Kunal", "Aditi", "Manish", "Nisha", "Harsh", "Kritika", "Yash", "Sana", "Gaurav", "Neha", "Abhishek"];
const LAST = ["Sharma", "Patel", "Iyer", "Gupta", "Desai", "Menon", "Joshi", "Kulkarni", "Bose", "Chopra", "Reddy", "Shetty", "Agarwal", "Pillai", "Verma", "Bhatia", "Rao", "Khanna"];
const COMPANIES = ["Northwind Analytics Pvt Ltd", "Bluepeak Technologies", "Crescent Advisory LLP", "Lumen Software Labs", "Harbor Logistics India", "Kestrel Pharma", "Orbit Fintech Pvt Ltd", "Summit Retail Group"];
const DESIGNATIONS = ["HR Manager", "Admin Lead", "People & Culture", "Office Manager", "Executive Assistant"];
const KIDS_NAMES = ["Aarav", "Myra", "Vihaan", "Kiara", "Reyansh", "Anika", "Kabir", "Sara", "Ishaan", "Zoya"];
const REMARKS = [
  "Want a separate area for kids and adults.",
  "Looking for veg-only menu.",
  "Need cake cutting slot around 7 PM.",
  "Please share package options with and without bar.",
  "Some guests are coming from out of town, evening slot preferred.",
  "Team outing for about half the office. Need GST invoice.",
  "",
  "",
];
const REQS_BY_TYPE = {
  birthday_party: ["Food & beverages", "Game play cards", "Cake", "Decorations", "Return gifts"],
  party_booking: ["Food & beverages", "Game play cards", "Private area", "Bar package"],
  corporate_event: ["Food & beverages", "Game play cards", "Private area", "AV / projector", "Bar package"],
};

// How many demo leads per status
const PLAN = [
  ["new", 9, [0.3, 30]],
  ["in_progress", 11, [8, 150]],
  ["quotation", 8, [24, 240]],
  ["proforma_invoice", 6, [72, 360]],
  ["finalized", 12, [120, 720]],
  ["not_interested", 6, [72, 600]],
];

const HOUR = 3600 * 1000;
const MIN = 60 * 1000;

export function buildSeedLeads({ now, brand, outlets, users, roles, counters }) {
  const rng = seededRandom(20260911);
  const receives = (u) => roles.find((r) => r.id === u.roleId)?.receivesLeads;
  const pocsByOutlet = Object.fromEntries(
    outlets.map((o) => [o.id, users.filter((u) => receives(u) && u.outletIds.includes(o.id))])
  );
  const headOf = (outletId) => users.find((u) => u.roleId === "sales_head" && u.outletIds.includes(outletId));
  const rr = {};
  const leads = [];

  PLAN.forEach(([status, count, [minH, maxH]]) => {
    for (let i = 0; i < count; i++) {
      const outlet = weightedOutlet(rng, outlets);
      const pocs = pocsByOutlet[outlet.id];
      rr[outlet.id] = ((rr[outlet.id] ?? -1) + 1) % pocs.length;
      const poc = pocs[rr[outlet.id]];

      const type = rng.pick(["birthday_party", "birthday_party", "party_booking", "corporate_event"]);
      const first = rng.pick(FIRST);
      const last = rng.pick(LAST);
      const name = `${first} ${last}`;
      const companyName = type === "corporate_event" ? rng.pick(COMPANIES) : null;
      const created = now - (minH + rng.next() * (maxH - minH)) * HOUR;
      const source = rng.chance(0.78) ? "website" : rng.pick(["phone", "walk_in", "email", "referral"]);
      const guests =
        type === "birthday_party" ? rng.int(12, 40) : type === "party_booking" ? rng.int(15, 60) : rng.int(25, 120);
      const eventDate = new Date(created + rng.int(6, 32) * 24 * HOUR);
      eventDate.setHours(12, 0, 0, 0);

      const lead = {
        id: `${brand.code}-${outlet.code}-${counters.lead++}`,
        brandId: brand.id,
        outletId: outlet.id,
        type,
        source,
        status: "new",
        customer: {
          name,
          mobile: `9${rng.int(100000000, 999999999)}`,
          email: companyName
            ? `${first.toLowerCase()}.${last.toLowerCase()}@${companyName.split(" ")[0].toLowerCase()}.example`
            : `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        },
        company: companyName
          ? {
              name: companyName,
              gstin: `27${randomLetters(rng, 5)}${rng.int(1000, 9999)}${randomLetters(rng, 1)}1Z${rng.int(1, 9)}`,
              contactPerson: name,
              designation: rng.pick(DESIGNATIONS),
            }
          : null,
        event: {
          date: eventDate.toISOString(),
          timeSlot: rng.pick(["lunch", "evening", "evening", "night"]),
          guests,
          kids: type === "birthday_party" ? Math.round(guests * 0.6) : 0,
          celebrantName: type === "birthday_party" ? rng.pick(KIDS_NAMES) : "",
          celebrantAge: type === "birthday_party" ? rng.int(4, 14) : null,
          requirements: REQS_BY_TYPE[type].filter(() => rng.chance(0.6)),
          remarks: rng.pick(REMARKS),
        },
        assignedToId: poc.id,
        notInterestedReason: null,
        createdAt: iso(created),
        updatedAt: iso(created),
        lastFollowUpAt: null,
        nextFollowUpAt: null,
        followUps: [],
        quotation: null,
        invoice: null,
        booking: null,
        activities: [],
        emails: [],
      };

      buildHistory({ lead, status, rng, now, poc, head: headOf(outlet.id), outlet, brand, counters });
      leads.push(lead);
    }
  });

  return leads;
}

/* ------------------------------------------------------------------ */

function buildHistory({ lead, status, rng, now, poc, head, outlet, brand, counters }) {
  let t = new Date(lead.createdAt).getTime();
  // Move the clock forward, never past "now" and never backwards
  const step = (minMin, maxMin) => {
    const target = Math.min(t + rng.int(minMin, maxMin) * MIN, now - rng.int(5, 40) * MIN);
    t = Math.min(Math.max(target, t + MIN), now - MIN);
    return iso(t);
  };
  const act = (type, message, byId = null, at = iso(t)) =>
    lead.activities.push({ id: `act_${lead.id}_${lead.activities.length}`, type, message, byId, at });
  const typeLabel = getLeadType(lead.type).label.toLowerCase();

  if (lead.source === "website") {
    act("lead_received", `Enquiry received from ${brand.website}`);
  } else {
    act("lead_created", `Lead created manually (${sourceLabel(lead.source)})`, poc.id);
  }
  step(1, 4);
  act("assigned", `Assigned to ${poc.name} (${outlet.name})`);

  const order = ["new", "in_progress", "quotation", "proforma_invoice", "finalized"];
  const reach = status === "not_interested" ? 1 : order.indexOf(status);

  if (status === "new") {
    lead.updatedAt = iso(t);
    return;
  }

  // First contact
  const firstAt = step(20, 240);
  addFollowUp(lead, { channel: "call", outcome: "Spoke with customer", note: `Discussed ${typeLabel} requirements for ${lead.event.guests} guests. Customer wants package options.`, at: firstAt, byId: poc.id });
  act("follow_up", "Called customer: Spoke with customer", poc.id);
  act("status_changed", "Status changed from New to In progress", poc.id);
  lead.status = "in_progress";

  if (reach >= 2) {
    const items = buildItems(lead, rng, brand);
    const discount = rng.chance(0.5) ? rng.pick([1000, 2000, 2500, 5000]) : 0;
    const createdAt = step(60, 600);
    lead.quotation = {
      number: `QT-${outlet.code}-${counters.quotation++}`,
      version: rng.chance(0.4) ? 2 : 1,
      items,
      discount,
      taxRate: DEFAULT_TAX_RATE,
      validUntil: iso(t + QUOTATION_VALID_DAYS * 24 * HOUR),
      notes: "Rates valid for the selected date and guest count.",
      status: "shared",
      updatedAt: createdAt,
      sharedAt: createdAt,
    };
    const total = calcTotals(lead.quotation).total;
    act("quotation_shared", `Quotation ${lead.quotation.number} shared by email and WhatsApp (₹${total.toLocaleString("en-IN")})`, poc.id);
    act("status_changed", "Status changed from In progress to Quotation", poc.id);
    lead.status = "quotation";
    lead.emails.push({
      id: `em_${lead.id}_1`,
      direction: "out",
      from: poc.mailbox.address,
      to: lead.customer.email,
      subject: `Quotation ${lead.quotation.number} for your ${typeLabel} at Dave & Buster's ${outlet.name}`,
      body: `Hi ${lead.customer.name.split(" ")[0]},\n\nThank you for your enquiry. Please find the quotation for ${lead.event.guests} guests on ${formatDate(lead.event.date)} attached.\n\nHappy to adjust the package if needed.\n\nRegards,\n${poc.name}\nDave & Buster's ${outlet.name}`,
      at: createdAt,
    });

    if (rng.chance(0.7)) {
      const replyAt = step(120, 900);
      lead.emails.push({
        id: `em_${lead.id}_2`,
        direction: "in",
        from: lead.customer.email,
        to: poc.mailbox.address,
        subject: `Re: Quotation ${lead.quotation.number} for your ${typeLabel} at Dave & Buster's ${outlet.name}`,
        body: `Hi ${poc.name.split(" ")[0]},\n\nThanks for the quick response. Is there any flexibility on the per-guest rate if we confirm this week?\n\nThanks,\n${lead.customer.name}`,
        at: replyAt,
      });
      act("email_received", "Customer replied to quotation email", null);
      const negAt = step(30, 300);
      addFollowUp(lead, { channel: "whatsapp", outcome: "Negotiating price", note: "Customer asked for a better rate. Offered additional discount on game cards.", at: negAt, byId: poc.id });
      act("follow_up", "WhatsApp: Negotiating price", poc.id);
    }
  } else if (status === "in_progress" && rng.chance(0.5)) {
    step(120, 1200);
    addFollowUp(lead, { channel: rng.pick(["call", "whatsapp"]), outcome: rng.pick(["No answer", "Asked to call back", "Requested quotation"]), note: "Will check with family and confirm date.", at: iso(t), byId: poc.id });
    act("follow_up", `Follow-up logged: ${lead.followUps.at(-1).outcome}`, poc.id);
  }

  if (reach >= 3) {
    const genAt = step(240, 1500);
    const q = lead.quotation;
    lead.invoice = {
      number: `PI-${outlet.code}-${counters.invoice++}`,
      items: q.items,
      discount: q.discount,
      taxRate: q.taxRate,
      advancePercent: DEFAULT_ADVANCE_PERCENT,
      dueDate: iso(t + 3 * 24 * HOUR),
      billingName: lead.company?.name || lead.customer.name,
      billingGstin: lead.company?.gstin || "",
      terms: "Advance payment confirms the booking. Balance payable at the venue on the event date.",
      generatedAt: genAt,
      sharedAt: genAt,
    };
    act("invoice_shared", `Proforma invoice ${lead.invoice.number} generated and shared`, poc.id);
    act("status_changed", "Status changed from Quotation to Proforma invoice", poc.id);
    lead.status = "proforma_invoice";
  }

  if (reach >= 4) {
    const finAt = step(240, 2400);
    const totals = calcTotals({ ...lead.invoice });
    const by = rng.chance(0.8) ? poc : head || poc;
    lead.booking = {
      confirmationNumber: `BK-${outlet.code}-${counters.booking++}`,
      totalAmount: totals.total,
      advancePaid: totals.advance,
      paymentReference: `UTR${rng.int(100000000, 999999999)}`,
      finalizedAt: finAt,
      finalizedById: by.id,
      notifications: {
        whatsapp: { status: "delivered", to: lead.customer.mobile, at: iso(t + 2 * MIN) },
        email: { status: "delivered", to: lead.customer.email, at: iso(t + 2 * MIN) },
      },
    };
    act("finalized", `Booking finalized. Confirmation ${lead.booking.confirmationNumber}`, by.id);
    t += 2 * MIN;
    act("confirmation_sent", "Booking confirmation sent on WhatsApp and email", null);
    lead.status = "finalized";
  }

  if (status === "not_interested") {
    step(600, 4000);
    const reason = rng.pick(["Budget too high", "Date not available", "Chose another venue", "No response from customer"]);
    lead.notInterestedReason = reason;
    act("status_changed", `Marked as Not interested: ${reason}`, poc.id);
    lead.status = "not_interested";
  }

  // Next follow-up for open leads
  if (getStatus(lead.status).onPath && !getStatus(lead.status).terminal) {
    const offsetH = rng.int(-40, 70);
    lead.nextFollowUpAt = iso(Math.max(t + HOUR, now + offsetH * HOUR));
  }
  lead.updatedAt = iso(t);
}

function addFollowUp(lead, { channel, outcome, note, at, byId }) {
  lead.followUps.push({ id: `fu_${lead.id}_${lead.followUps.length}`, channel, outcome, note, at, byId, nextFollowUpAt: null });
  lead.lastFollowUpAt = at;
}

function buildItems(lead, rng, brand) {
  const catalog = getCatalog(brand.id);
  const find = (key) => catalog.find((c) => c.key === key);
  const pkg = find(DEFAULT_PACKAGE_BY_TYPE[lead.type]);
  const items = [{ description: pkg.label, qty: lead.event.guests, rate: pkg.rate }];
  const cards = find("game_card");
  items.push({ description: cards.label, qty: Math.ceil(lead.event.guests / 2), rate: cards.rate });
  if (lead.event.requirements.includes("Decorations")) items.push({ description: find("decor").label, qty: 1, rate: find("decor").rate });
  if (lead.event.requirements.includes("Private area")) items.push({ description: find("private_area").label, qty: 1, rate: find("private_area").rate });
  if (lead.event.requirements.includes("Cake")) items.push({ description: find("cake").label, qty: 1, rate: find("cake").rate });
  return items;
}

function weightedOutlet(rng, outlets) {
  const r = rng.next();
  if (r < 0.45) return outlets[0];
  if (r < 0.75) return outlets[1] || outlets[0];
  return outlets[2] || outlets[0];
}

function randomLetters(rng, n) {
  return Array.from({ length: n }, () => String.fromCharCode(65 + rng.int(0, 25))).join("");
}

function sourceLabel(key) {
  return { phone: "Phone call", walk_in: "Walk-in", email: "Email", referral: "Referral", social: "Social media" }[key] || key;
}

const iso = (ms) => new Date(ms).toISOString();

