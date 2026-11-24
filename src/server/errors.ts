import "server-only";

export type ApiErrorCode =
  | "bad_request"
  | "payload_too_large"
  | "rate_limited"
  | "forbidden_origin"
  | "not_configured"
  | "upstream_unavailable"
  | "internal";

/** Structured error response: `{ error: { code, message } }`. Messages are safe to show users. */
export function apiError(code: ApiErrorCode, status: number, message: string, headers?: HeadersInit): Response {
  return Response.json({ error: { code, message } }, { status, headers });
}

/** Thrown by the Gemini helpers when every configured model failed. */
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export class NotConfiguredError extends Error {
  constructor(message = "GEMINI_API_KEY is not set on the server.") {
    super(message);
    this.name = "NotConfiguredError";
  }
}

/** Logs the real error server-side and returns a response that leaks no internals. */
export function handleRouteError(route: string, err: unknown): Response {
  console.error(`[api/${route}]`, err);
  if (err instanceof NotConfiguredError) {
    return apiError("not_configured", 503, "The AI service is not configured on this server.");
  }
  if (err instanceof UpstreamError) {
    return err.status === 429
      ? apiError("upstream_unavailable", 503, "The AI service is busy right now. Please try again in a minute.", {
          "Retry-After": "60",
        })
      : apiError("upstream_unavailable", 502, "The AI service could not complete this request. Please try again.");
  }
  return apiError("internal", 500, "Something went wrong on our side. Please try again.");
}
