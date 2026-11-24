import type { z } from "zod";
import { ApiErrorSchema } from "@/domain/contracts";

/** An API failure with a message that is safe to show the learner. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** Reads the `{ error: { code, message } }` body routes return, with a fallback message. */
export async function readApiError(res: Response, fallback: string): Promise<ApiRequestError> {
  const body = await res.json().catch(() => null);
  const parsed = ApiErrorSchema.safeParse(body);
  if (parsed.success) return new ApiRequestError(parsed.data.error.message, res.status, parsed.data.error.code);
  return new ApiRequestError(fallback, res.status);
}

/**
 * POSTs JSON and returns the parsed response. When a schema is given, the
 * response is validated so the UI never renders a malformed payload.
 */
export async function postJson<T>(
  url: string,
  body: unknown,
  opts: { schema?: z.ZodType<T>; fallbackError?: string; signal?: AbortSignal } = {}
): Promise<T> {
  const fallback = opts.fallbackError ?? "The request failed. Please try again.";
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch {
    throw new ApiRequestError("Network error. Check your connection and try again.", 0, "network");
  }
  if (!res.ok) throw await readApiError(res, fallback);
  const json: unknown = await res.json().catch(() => null);
  if (!opts.schema) return json as T;
  const parsed = opts.schema.safeParse(json);
  if (!parsed.success) throw new ApiRequestError("The server sent an unexpected response.", res.status, "bad_response");
  return parsed.data;
}
