// Minimal shims so the bundler can parse; Vitest provides real globals
const g = globalThis;
const vi = g.vi || {
  fn:
    (impl) =>
    (...args) =>
      impl ? impl(...args) : undefined,
  mock: () => {},
};
const describe = g.describe || ((name, fn) => fn());
const it = g.it || ((name, fn) => fn());
const expect =
  g.expect ||
  ((val) => ({
    toBeInstanceOf: () => {},
    toHaveProperty: () => {},
    toBe: () => {},
    toEqual: () => {},
  }));

// Shared mock state
g.__healthMock = { dbShouldFail: false };

// Mock SQL utility; throw when instructed
vi.mock("@/app/api/utils/sql", () => ({
  default: async (strings, ...values) => {
    if (g.__healthMock.dbShouldFail) {
      throw new Error("database unavailable");
    }
    // normal success case
    return [{ ok: 1 }];
  },
}));

import { GET } from "./route.js";

describe("system health API", () => {
  it("GET returns ok when database responds", async () => {
    g.__healthMock.dbShouldFail = false;
    const res = await GET();
    expect(res).toBeInstanceOf(Response);
    const json = await res.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("status", "ok");
    expect(json.checks.database.ok).toBe(true);
  });

  it("GET returns error status when database fails", async () => {
    g.__healthMock.dbShouldFail = true;
    const res = await GET();
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.checks.database.ok).toBe(false);
    expect(typeof json.checks.database.error).toBe("string");
  });
});
