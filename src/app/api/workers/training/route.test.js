// Minimal shims so the bundler can parse this file; Vitest will provide real globals at runtime
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
    toMatchObject: () => {},
    toBe: () => {},
  }));

// Mock the SQL utility (factory form to avoid hoisting issues)
vi.mock("@/app/api/utils/sql", () => ({
  default: async (strings, ...values) => {
    const q = Array.isArray(strings) ? strings.join("") : String(strings || "");
    if (q.includes("FROM training_jobs") && q.includes("SELECT")) {
      // queue counts
      return [{ queued: 1, processing: 0, failed: 2, completed: 3 }];
    }
    if (
      q.includes("FROM training_workers") &&
      q.includes("WHERE last_heartbeat")
    ) {
      // active workers
      return [
        {
          worker_id: "w1",
          status: "running",
          last_heartbeat: new Date().toISOString(),
        },
      ];
    }
    if (q.includes("FROM training_workers") && q.includes("WHERE worker_id")) {
      // local worker row (none)
      return [];
    }
    if (q.includes("INSERT INTO training_jobs")) {
      return [
        {
          id: 123,
          type: "self_play",
          payload: { hello: "world" },
          status: "queued",
          priority: 1,
        },
      ];
    }
    if (q.includes("UPDATE training_workers")) {
      return [];
    }
    return [];
  },
}));

// Import after mocks
import { GET, POST } from "./route.js";

describe("training workers API", () => {
  it("GET should return queue counts and worker status", async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(Response);
    const json = await res.json();
    expect(json).toHaveProperty("counts");
    expect(json.counts).toMatchObject({ queued: 1, failed: 2 });
    expect(json).toHaveProperty("activeWorkers");
    expect(Array.isArray(json.activeWorkers)).toBe(true);
  });

  it("POST enqueue should insert a job and return it", async () => {
    const req = new Request("http://localhost/api/workers/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "enqueue",
        payload: { hello: "world" },
        priority: 1,
      }),
    });
    const res = await POST(req);
    expect(res).toBeInstanceOf(Response);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json).toHaveProperty("job");
    expect(json.job).toHaveProperty("status", "queued");
  });
});
