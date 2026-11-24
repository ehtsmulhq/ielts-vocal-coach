import "server-only";
import type { z } from "zod";
import { apiError } from "./errors";
import { ALLOWED_ORIGINS } from "./config";

/**
 * Request guard for API routes: same-origin check, per-client rate limit, body
 * size cap and schema validation. Rate limits are in-memory, so they apply per
 * server instance (enough for local and single-instance hosting).
 */

export interface RateLimit {
  max: number;
  windowMs: number;
}

export interface GuardOptions {
  route: string;
  maxBytes: number;
  rateLimit: RateLimit;
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Fixed-window rate limiter. Pure apart from the bucket map, which tests can inject. */
export function checkRateLimit(
  key: string,
  limit: RateLimit,
  now = Date.now(),
  store: Map<string, Bucket> = buckets
): { ok: true } | { ok: false; retryAfterSec: number } {
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

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
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

function preflight(request: Request, opts: GuardOptions): GuardFailure | null {
  if (!isAllowedOrigin(request)) {
    return { ok: false, response: apiError("forbidden_origin", 403, "This API only accepts requests from the app.") };
  }
  const limited = checkRateLimit(`${opts.route}:${clientKey(request)}`, opts.rateLimit);
  if (!limited.ok) {
    return {
      ok: false,
      response: apiError("rate_limited", 429, "Too many requests. Please slow down and try again shortly.", {
        "Retry-After": String(limited.retryAfterSec),
      }),
    };
  }
  return null;
}

/** Guard for GET endpoints (origin + rate limit only). */
export function guardRequest(request: Request, opts: Omit<GuardOptions, "maxBytes">): GuardFailure | { ok: true } {
  return preflight(request, { ...opts, maxBytes: 0 }) ?? { ok: true };
}

/** Guard + parse + validate a JSON body. */
export async function guardJson<S extends z.ZodType>(
  request: Request,
  opts: GuardOptions,
  schema: S
): Promise<GuardFailure | { ok: true; data: z.output<S> }> {
  const failed = preflight(request, opts);
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
  return { ok: true, data: parsed.data };
}

/** Shared presets so limits are tuned in one place. */
export const LIMITS = {
  coach: { maxBytes: 16 * 1024 * 1024, rateLimit: { max: 20, windowMs: 60_000 } },
  modelAudio: { maxBytes: 32 * 1024, rateLimit: { max: 40, windowMs: 60_000 } },
  feedback: { maxBytes: 1024 * 1024, rateLimit: { max: 6, windowMs: 60_000 } },
  upgrade: { maxBytes: 1024 * 1024, rateLimit: { max: 6, windowMs: 60_000 } },
  lesson: { maxBytes: 64 * 1024, rateLimit: { max: 12, windowMs: 60_000 } },
  token: { maxBytes: 8 * 1024, rateLimit: { max: 6, windowMs: 60_000 } },
  tutor: { maxBytes: 48 * 1024, rateLimit: { max: 6, windowMs: 60_000 } },
  ping: { rateLimit: { max: 60, windowMs: 60_000 } },
} as const;
