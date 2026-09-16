import { REQUIREMENTS } from "@/config/leadOptions";
import { addDays, toDateInput } from "@/lib/format";

/**
 * Prototype-only: random website enquiry for "Simulate website enquiry".
 * Delete this file once the website posts real enquiries to the API.
 */
const FIRST = ["Aisha", "Rohan", "Tara", "Dev", "Maya", "Kabir", "Naina", "Ayaan", "Ira", "Vivaan", "Zara", "Advait"];
const LAST = ["Kapoor", "Sethi", "Nair", "Mukherjee", "Saxena", "Hegde", "Dutta", "Bajaj", "Fernandes", "Chawla"];
const COMPANIES = ["Greenfield Consulting", "Arclight Media Pvt Ltd", "Quantum Loop Labs", "Meridian Healthcare"];
const KIDS = ["Anvi", "Rudra", "Aadya", "Shaurya", "Pari", "Arnav"];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const int = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function buildSampleEnquiry(outlets = []) {
  const type = pick(["birthday_party", "birthday_party", "party_booking", "corporate_event"]);
  const first = pick(FIRST);
  const last = pick(LAST);
  const company = type === "corporate_event" ? pick(COMPANIES) : "";
  const guests = type === "corporate_event" ? int(30, 100) : int(12, 45);

  return {
    type,
    outletId: pick(outlets)?.id || "",
    customer: {
      name: `${first} ${last}`,
      mobile: `9${int(100000000, 999999999)}`,
      email: company
        ? `${first.toLowerCase()}@${company.split(" ")[0].toLowerCase()}.example`
        : `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    },
    company: { name: company, gstin: "", contactPerson: "", designation: company ? "HR Manager" : "" },
    event: {
      date: toDateInput(addDays(new Date(), int(7, 40))),
      timeSlot: pick(["lunch", "evening", "night"]),
      guests,
      kids: type === "birthday_party" ? Math.round(guests * 0.6) : 0,
      celebrantName: type === "birthday_party" ? pick(KIDS) : "",
      celebrantAge: type === "birthday_party" ? int(5, 13) : "",
      requirements: REQUIREMENTS.filter(() => Math.random() < 0.35),
      remarks: pick(["", "Please call after 6 PM.", "Looking for a package with unlimited games.", "Need a quote by this week."]),
    },
  };
}
