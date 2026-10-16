export async function GET() {
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
