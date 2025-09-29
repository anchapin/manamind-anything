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
    toBe: () => {},
    toEqual: () => {},
    toBeGreaterThanOrEqual: () => {},
    toContainEqual: () => {},
  }));

// Shared mock state accessible from factory and tests
g.__alertsMock = {
  counts: { queued: 0, processing: 0, failed: 0, completed: 0 },
  workers: [],
};

// Mock SQL using factory; reads from global mock state
vi.mock("@/app/api/utils/sql", () => ({
  default: async (strings, ...values) => {
    const q = Array.isArray(strings) ? strings.join("") : String(strings || "");
    if (q.includes("FROM training_jobs") && q.includes("SELECT")) {
      return [g.__alertsMock.counts];
    }
    if (
      q.includes("FROM training_workers") &&
      q.includes("WHERE last_heartbeat")
    ) {
      return g.__alertsMock.workers;
    }
    return [];
  },
}));

// Mock fetch for Forge status
const originalFetch = globalThis.fetch;
const mockFetch = vi.fn(async (url, init) => {
  // default: forge ok
  return new Response(JSON.stringify({ success: true, status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

import { GET } from "./route.js";

describe("system alerts API", () => {
  it("returns error alert when there are failed jobs", async () => {
    // set counts to include failures
    g.__alertsMock.counts = {
      queued: 0,
      processing: 0,
      failed: 3,
      completed: 5,
    };
    g.__alertsMock.workers = [];
    globalThis.fetch = mockFetch;

    const res = await GET();
    const json = await res.json();
    expect(json.success).toBe(true);
    const errorAlert = json.alerts.find(
      (a) => a.severity === "error" && a.area === "training_jobs",
    );
    expect(!!errorAlert).toBe(true);
  });

  it("returns warning when queue is nonempty and no workers active", async () => {
    g.__alertsMock.counts = {
      queued: 4,
      processing: 0,
      failed: 0,
      completed: 0,
    };
    g.__alertsMock.workers = [];
    globalThis.fetch = mockFetch;

    const res = await GET();
    const json = await res.json();
    const warn = json.alerts.find(
      (a) => a.severity === "warning" && a.area === "workers",
    );
    expect(!!warn).toBe(true);
  });

  // cleanup
  it("cleanup fetch mock", () => {
    globalThis.fetch = originalFetch;
    expect(true).toBe(true);
  });
});
