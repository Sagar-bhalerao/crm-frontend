import { getPath } from "./format";

/**
 * Fill an approved template: "Hi {{customer.name}}" + data -> "Hi Riya".
 * Templates are owned by the brand (mock/templates.js now, DB later);
 * the CRM never builds its own confirmation wording.
 */
export function fillTemplate(template, data) {
  return String(template).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const v = getPath(data, path);
    return v == null || v === "" ? "—" : String(v);
  });
}
