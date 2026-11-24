import "server-only";
import type { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { aiBusy, apiError } from "./errors";
import { ALLOWED_ORIGINS, DAILY_AI_LIMIT, REDIS_REST_TOKEN, REDIS_REST_URL, TRUST_PROXY } from "./config";

/**
 * Request guard for API routes: same-origin check, per-client and per-route
 * rate limits, a shared daily budget for the costly AI routes, body size cap
 * and schema validation. Limits live in Upstash Redis when it is configured
 * (shared by every serverless instance) and in memory otherwise (local dev, tests).
 */

export interface RateLimit {
  max: number;
  windowMs: number;
}

export interface GuardOptions {
  route: string;
  maxBytes: number;
  rateLimit: RateLimit;
  /** Counts against the app-wide DAILY_AI_LIMIT (routes that spend real Gemini money). */
  dailyBudget?: boolean;
}

export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

type Bucket = { count: number; resetAt: number };
const MAX_BUCKETS = 10_000;
const memoryBuckets = new Map<string, Bucket>();

/** Fixed-window rate limiter. Pure apart from the bucket map, which tests can inject. */
export function checkRateLimit(
  key: string,
  limit: RateLimit,
  now = Date.now(),
  store: Map<string, Bucket> = memoryBuckets
): RateResult {
  if (store.size > MAX_BUCKETS) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit.max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true };
}

/** Where limits are counted. Swappable so tests can inject one. */
export interface LimitStore {
  /** One hit against a fixed-window rate limit. */
  limit(key: string, limit: RateLimit, now: number): Promise<RateResult>;
  /** Increments a counter that expires `ttlMs` after its first hit; returns the new value. */
  incr(key: string, ttlMs: number, now: number): Promise<number>;
}

/** In-memory store, per server instance: local dev, tests, and the fallback when Redis fails. */
export function createMemoryStore(buckets: Map<string, Bucket> = new Map()): LimitStore {
  return {
    async limit(key, limit, now) {
      return checkRateLimit(key, limit, now, buckets);
    },
    async incr(key, ttlMs, now) {
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + ttlMs });
        return 1;
      }
      return ++b.count;
    },
  };
}

/** The slice of Redis the counter needs (lets tests use a fake). */
export interface CounterRedis {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
}

/** INCR + PEXPIRE on first hit. A Redis error falls back to the memory store. */
export async function redisCounter(
  redis: CounterRedis,
  fallback: LimitStore,
  key: string,
  ttlMs: number,
  now: number
): Promise<number> {
  try {
    const n = await redis.incr(`sly:${key}`);
    if (n === 1) await redis.pexpire(`sly:${key}`, ttlMs);
    return n;
  } catch (err) {
    console.warn("[guard] Redis counter failed, using memory:", (err as Error).message?.slice(0, 200));
    return fallback.incr(key, ttlMs, now);
  }
}

/**
 * Upstash store: rate limits via @upstash/ratelimit (fixed window, same
 * semantics as the memory limiter) and counters via INCR + PEXPIRE. Redis
 * errors fall back to memory, so an outage degrades to per-instance limits
 * instead of taking the app down.
 */
export function createRedisStore(redis: Redis, fallback: LimitStore = createMemoryStore(memoryBuckets)): LimitStore {
  const limiters = new Map<string, Ratelimit>();
  const limiterFor = (limit: RateLimit) => {
    const id = `${limit.max}/${limit.windowMs}`;
    let rl = limiters.get(id);
    if (!rl) {
      rl = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(limit.max, `${limit.windowMs} ms`),
        prefix: "sly:rl",
        analytics: false,
      });
      limiters.set(id, rl);
    }
    return rl;
  };
  return {
    async limit(key, limit, now) {
      try {
        const r = await limiterFor(limit).limit(key);
        return r.success ? { ok: true } : { ok: false, retryAfterSec: Math.max(1, Math.ceil((r.reset - now) / 1000)) };
      } catch (err) {
        console.warn("[guard] Redis rate limit failed, using memory:", (err as Error).message?.slice(0, 200));
        return fallback.limit(key, limit, now);
      }
    },
    incr: (key, ttlMs, now) => redisCounter(redis, fallback, key, ttlMs, now),
  };
}

let defaultStore: LimitStore | null = null;
function getStore(): LimitStore {
  defaultStore ??=
    REDIS_REST_URL && REDIS_REST_TOKEN
      ? createRedisStore(new Redis({ url: REDIS_REST_URL, token: REDIS_REST_TOKEN }))
      : createMemoryStore(memoryBuckets);
  return defaultStore;
}

/** Backstop: no matter how many client identities exist, one route has a total cap. */
const GLOBAL_FACTOR = 10;

/** Per-client bucket first, then the route-wide (`route:*`) bucket. */
export async function limitClient(
  route: string,
  client: string,
  rateLimit: RateLimit,
  store: LimitStore = getStore(),
  now = Date.now()
): Promise<RateResult> {
  const perClient = await store.limit(`${route}:${client}`, rateLimit, now);
  if (!perClient.ok) return perClient;
  return store.limit(`${route}:*`, { ...rateLimit, max: rateLimit.max * GLOBAL_FACTOR }, now);
}

const DAY_MS = 86_400_000;

/**
 * One shared counter per UTC day for the routes that spend Gemini money. Past
 * the cap, every costly call is refused until the next UTC midnight.
 */
export async function consumeDailyBudget(
  store: LimitStore = getStore(),
  cap = DAILY_AI_LIMIT,
  now = Date.now()
): Promise<RateResult> {
  const day = new Date(now).toISOString().slice(0, 10);
  const used = await store.incr(`budget:${day}`, 2 * DAY_MS, now);
  if (used <= cap) return { ok: true };
  const nextMidnight = (Math.floor(now / DAY_MS) + 1) * DAY_MS;
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil((nextMidnight - now) / 1000)) };
}

/**
 * Who is calling. Behind a trusted proxy (TRUST_PROXY=1) the proxy's own hop,
 * the LAST X-Forwarded-For entry, is used; otherwise every caller shares one
 * bucket, so a spoofed header can't mint fresh rate-limit allowances.
 */
export function clientKey(request: Request, trustProxy = TRUST_PROXY): string {
  if (!trustProxy) return "local";
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean);
  return hops?.[hops.length - 1] || request.headers.get("x-real-ip") || "local";
}

/**
 * Browsers send `Origin` on cross-site and POST requests. Requests without it
 * (same-origin GETs, server-to-server) are allowed; the rate limit still applies.
 */
export function isAllowedOrigin(request: Request, allowed: readonly string[] = ALLOWED_ORIGINS): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host && originHost === host) return true;
  return allowed.some((a) => {
    try {
      return new URL(a).host === originHost;
    } catch {
      return a === origin;
    }
  });
}

type GuardFailure = { ok: false; response: Response };
type LimitOptions = Omit<GuardOptions, "maxBytes">;

async function preflight(request: Request, opts: LimitOptions): Promise<GuardFailure | null> {
  if (!isAllowedOrigin(request)) {
    return { ok: false, response: apiError("forbidden_origin", 403, "This API only accepts requests from the app.") };
  }
  const blocked = await limitClient(opts.route, clientKey(request), opts.rateLimit);
  if (!blocked.ok) {
    return {
      ok: false,
      response: apiError("rate_limited", 429, "Too many requests. Please slow down and try again shortly.", {
        "Retry-After": String(blocked.retryAfterSec),
      }),
    };
  }
  return null;
}

/** Checked only once a request is valid, so junk never spends the day's budget. */
async function budget(opts: LimitOptions): Promise<GuardFailure | null> {
  if (!opts.dailyBudget) return null;
  const spent = await consumeDailyBudget();
  if (spent.ok) return null;
  console.warn(`[guard] Daily AI budget (${DAILY_AI_LIMIT}) reached; refusing ${opts.route}.`);
  return { ok: false, response: aiBusy(spent.retryAfterSec) };
}

/** Guard for GET endpoints (origin + rate limit, plus the daily budget if asked). */
export async function guardRequest(request: Request, opts: LimitOptions): Promise<GuardFailure | { ok: true }> {
  return (await preflight(request, opts)) ?? (await budget(opts)) ?? { ok: true };
}

/** Guard + parse + validate a JSON body. */
export async function guardJson<S extends z.ZodType>(
  request: Request,
  opts: GuardOptions,
  schema: S
): Promise<GuardFailure | { ok: true; data: z.output<S> }> {
  const failed = await preflight(request, opts);
  if (failed) return failed;

  const tooLarge = () => ({
    ok: false as const,
    response: apiError("payload_too_large", 413, "This request is too large."),
  });
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > opts.maxBytes) return tooLarge();

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: apiError("bad_request", 400, "Could not read the request body.") };
  }
  if (Buffer.byteLength(text, "utf8") > opts.maxBytes) return tooLarge();

  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, response: apiError("bad_request", 400, "The request body must be valid JSON.") };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return { ok: false, response: apiError("bad_request", 400, `Invalid request. ${where}${issue?.message ?? ""}`.trim()) };
  }

  const overBudget = await budget(opts);
  if (overBudget) return overBudget;
  return { ok: true, data: parsed.data };
}

/**
 * Shared presets so limits are tuned in one place. Vercel rejects request
 * bodies over 4.5 MB before they reach the app, so nothing here allows more
 * than ~4 MB. `dailyBudget` marks the routes that spend real Gemini money.
 */
export const LIMITS = {
  coach: { maxBytes: 4_000_000, rateLimit: { max: 20, windowMs: 60_000 }, dailyBudget: true },
  modelAudio: { maxBytes: 32 * 1024, rateLimit: { max: 40, windowMs: 60_000 }, dailyBudget: true },
  feedback: { maxBytes: 1024 * 1024, rateLimit: { max: 6, windowMs: 60_000 }, dailyBudget: true },
  upgrade: { maxBytes: 1024 * 1024, rateLimit: { max: 6, windowMs: 60_000 } },
  lesson: { maxBytes: 64 * 1024, rateLimit: { max: 12, windowMs: 60_000 } },
  token: { maxBytes: 8 * 1024, rateLimit: { max: 6, windowMs: 60_000 }, dailyBudget: true },
  tutor: { maxBytes: 48 * 1024, rateLimit: { max: 6, windowMs: 60_000 }, dailyBudget: true },
  greeting: { maxBytes: 16 * 1024, rateLimit: { max: 10, windowMs: 60_000 } },
  ping: { rateLimit: { max: 60, windowMs: 60_000 } },
} as const;
