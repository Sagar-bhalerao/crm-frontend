/**
 * Sample quotation catalogue per brand.
 * These are placeholder rates for the prototype — replace with the
 * brand's real rate card (later served by the pricing API).
 */
export const PRICE_CATALOG = {
  "dnb-india": [
    { key: "pkg_birthday", label: "Birthday party package (per guest)", rate: 1299 },
    { key: "pkg_party", label: "Party package (per guest)", rate: 1499 },
    { key: "pkg_corporate", label: "Corporate package (per guest)", rate: 1899 },
    { key: "game_card", label: "Game play card top-up", rate: 500 },
    { key: "private_area", label: "Private area booking", rate: 10000 },
    { key: "decor", label: "Decoration setup", rate: 7500 },
    { key: "cake", label: "Custom cake", rate: 3000 },
    { key: "bar", label: "Bar package (per guest)", rate: 1200 },
  ],
};

/** Which package to suggest first for a lead type. */
export const DEFAULT_PACKAGE_BY_TYPE = {
  birthday_party: "pkg_birthday",
  party_booking: "pkg_party",
  corporate_event: "pkg_corporate",
};

export function getCatalog(brandId) {
  return PRICE_CATALOG[brandId] || [];
}
