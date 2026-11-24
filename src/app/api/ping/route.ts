import { guardRequest, LIMITS } from "@/server/guard";

export async function GET(request: Request) {
  const guarded = await guardRequest(request, { route: "ping", ...LIMITS.ping });
  if (!guarded.ok) return guarded.response;
  const start = Date.now();
  let googleRttMs: number | null = null;
  try {
    const gStart = Date.now();
    await fetch("https://generativelanguage.googleapis.com", {
      method: "HEAD",
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
    });
    googleRttMs = Date.now() - gStart;
  } catch {
    googleRttMs = null;
  }

  return Response.json(
    {
      serverTimestamp: start,
      googleRttMs,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
