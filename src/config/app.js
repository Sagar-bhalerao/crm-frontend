/**
 * App-wide settings. Values that change per environment live in .env.
 */
export const APP_NAME = "Nucleus CRM";

/** "mock" (default) or "api" — see services/index.js */
export const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";

/**
 * Express API base URL.
 * Brands and Locations always go through this API, whatever DATA_SOURCE is set to.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const MOCK_LATENCY_MS = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 250);

export const DEFAULT_PAGE_SIZE = 10;

/** Default tax rate applied to quotations & proforma invoices (GST). */
export const DEFAULT_TAX_RATE = 18;

/** Default advance (%) requested on a proforma invoice. */
export const DEFAULT_ADVANCE_PERCENT = 50;

/** Quotation validity in days. */
export const QUOTATION_VALID_DAYS = 7;
