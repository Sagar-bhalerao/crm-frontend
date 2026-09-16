/**
 * Global settings in a plain module, so code outside React (the mock
 * services and the helpers they use) can read them too.
 *
 * SettingsProvider keeps this in step with the API. The values here are only
 * the fallback used before the first load, or if the API cannot be reached.
 */
let current = {
  taxRate: 18,
  advancePercent: 50,
  quotationValidDays: 7,
  pageSize: 10,
  currency: "INR",
  leadResponseHours: 2,
};

export const getRuntimeSettings = () => current;

export const setRuntimeSettings = (next) => {
  current = { ...current, ...next };
};
