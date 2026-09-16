/**
 * Super Admin configuration services.
 *
 * These always talk to the Express API (PostgreSQL). The lead module keeps
 * using @/services, which can still run on mock data.
 */
export * as brandService from "./brandService";
export * as locationService from "./locationService";
export * as settingsService from "./settingsService";
