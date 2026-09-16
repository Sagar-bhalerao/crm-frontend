/** Join class names, skipping falsy values. */
export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Deterministic random generator for seed data. */
export function seededRandom(seed = 42) {
  let t = seed;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
  };
}

export class AppError extends Error {
  constructor(message, code = "ERROR", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
