import { describe, expect, it } from "vitest";
import {
  consumeDailyBudget,
  createMemoryStore,
  limitClient,
  redisCounter,
  type CounterRedis,
  type LimitStore,
  type RateLimit,
} from "./guard";

/** A shared store, as two serverless instances talking to one Redis would see it. */
function recordingStore() {
  const inner = createMemoryStore();
  const keys: string[] = [];
  const store: LimitStore = {
    limit: (key, limit, now) => {
      keys.push(key);
      return inner.limit(key, limit, now);
    },
    incr: (key, ttl, now) => {
      keys.push(key);
      return inner.incr(key, ttl, now);
    },
  };
  return { store, keys };
}

describe("limitClient with an injected store", () => {
  const limit: RateLimit = { max: 2, windowMs: 60_000 };

  it("uses a per-client bucket and a route-wide bucket", async () => {
    const { store, keys } = recordingStore();
    expect(await limitClient("token", "1.2.3.4", limit, store, 0)).toEqual({ ok: true });
    expect(keys).toEqual(["token:1.2.3.4", "token:*"]);
  });

  it("blocks a client past its limit with a retry time, while others still pass", async () => {
    const { store } = recordingStore();
    await limitClient("token", "a", limit, store, 0);
    await limitClient("token", "a", limit, store, 1_000);
    expect(await limitClient("token", "a", limit, store, 2_000)).toEqual({ ok: false, retryAfterSec: 58 });
    expect(await limitClient("token", "b", limit, store, 2_000)).toEqual({ ok: true });
  });

  it("caps the route overall at 10x the per-client limit", async () => {
    const { store } = recordingStore();
    const results = [];
    for (let i = 0; i < 25; i++) results.push(await limitClient("r", `ip${i}`, limit, store, 0));
    expect(results.filter((r) => r.ok)).toHaveLength(20);
  });

  it("shares limits across instances that use the same store", async () => {
    const { store } = recordingStore();
    const one = { max: 1, windowMs: 60_000 };
    expect((await limitClient("r", "x", one, store, 0)).ok).toBe(true);
    // A "second instance" is just another caller of the same store.
    expect((await limitClient("r", "x", one, store, 10)).ok).toBe(false);
  });
});

describe("daily AI budget", () => {
  const noon = Date.UTC(2026, 10, 25, 12, 0, 0);

  it("allows calls up to the cap, then refuses until the next UTC midnight", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < 3; i++) expect(await consumeDailyBudget(store, 3, noon)).toEqual({ ok: true });
    expect(await consumeDailyBudget(store, 3, noon)).toEqual({ ok: false, retryAfterSec: 12 * 3600 });
  });

  it("starts a fresh counter on a new UTC day", async () => {
    const store = createMemoryStore();
    await consumeDailyBudget(store, 1, noon);
    expect((await consumeDailyBudget(store, 1, noon)).ok).toBe(false);
    expect((await consumeDailyBudget(store, 1, noon + 12 * 3600 * 1000)).ok).toBe(true);
  });

  it("keys the counter by day", async () => {
    const { store, keys } = recordingStore();
    await consumeDailyBudget(store, 10, noon);
    expect(keys).toEqual(["budget:2026-11-25"]);
  });
});

describe("Redis counter", () => {
  it("sets an expiry only on the first hit", async () => {
    const calls: string[] = [];
    let n = 0;
    const redis: CounterRedis = {
      incr: async (k) => {
        calls.push(`incr ${k}`);
        return ++n;
      },
      pexpire: async (k, ms) => {
        calls.push(`pexpire ${k} ${ms}`);
        return 1;
      },
    };
    const fallback = createMemoryStore();
    expect(await redisCounter(redis, fallback, "budget:d", 1000, 0)).toBe(1);
    expect(await redisCounter(redis, fallback, "budget:d", 1000, 0)).toBe(2);
    expect(calls).toEqual(["incr sly:budget:d", "pexpire sly:budget:d 1000", "incr sly:budget:d"]);
  });

  it("falls back to memory when Redis is unreachable", async () => {
    const down: CounterRedis = {
      incr: async () => {
        throw new Error("ECONNREFUSED");
      },
      pexpire: async () => 0,
    };
    const fallback = createMemoryStore();
    const warn = console.warn;
    console.warn = () => {};
    try {
      expect(await redisCounter(down, fallback, "k", 1000, 0)).toBe(1);
      expect(await redisCounter(down, fallback, "k", 1000, 0)).toBe(2);
    } finally {
      console.warn = warn;
    }
  });
});
