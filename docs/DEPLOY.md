# Deploying Sounds Like You to Vercel

This puts the app on a public HTTPS URL so testers can try it on their own phones, with no sign-in.
Because anyone with the link can use it, three things keep the Gemini bill under control:

1. **Shared rate limits** per visitor and per route, kept in Upstash Redis so every serverless
   instance sees the same counts.
2. **A daily budget** (`DAILY_AI_LIMIT`, default 2000) on the costly AI calls: Live coach and
   examiner sessions, model clips, shadowing coaching and interview feedback. Past it, those
   features answer "The AI service is busy" until midnight UTC.
3. **A spend cap on the Gemini key itself**, set in Google Cloud. This is the real backstop, as the
   app can't see your bill.

The steps below fit the free Vercel **Hobby** plan.

## 1. Import the repository

1. Push the branch you want to host to GitHub.
2. At <https://vercel.com/new>, choose **Import Git Repository** and pick this repo.
3. Framework preset: **Next.js** (detected). Leave the build command (`next build`) and output
   settings as they are.
4. Node.js version: 20.x or newer (the project needs `>=20.9`; Vercel's default is fine).
5. Don't deploy yet. Add the environment variables first (step 3), or redeploy after adding them.

## 2. Create a free Upstash Redis database

1. In the Vercel project, open **Storage** -> **Create Database** (Marketplace) -> **Upstash** ->
   **Upstash for Redis**. Pick the free plan and the region nearest your function region
   (Vercel's default is `iad1`, Washington D.C., so choose a US East region).
2. Connect it to the project for **Production** and **Preview**.
3. Vercel adds the connection variables automatically. The app accepts either
   `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_URL` +
   `KV_REST_API_TOKEN`, so no renaming is needed.

You can also create the database at <https://console.upstash.com> and paste the REST URL and
token in by hand.

Without Redis the app still runs, but limits are counted per serverless instance, so they don't
really hold.

## 3. Set the environment variables

Project -> **Settings** -> **Environment Variables** (Production and Preview):

| Name | Value | Why |
| --- | --- | --- |
| `GEMINI_API_KEY` | your key | Required. Server-only. |
| `TRUST_PROXY` | `1` | Vercel sets `X-Forwarded-For`, so each visitor gets their own limit. Without it, every tester shares one bucket and they will block each other. |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | from step 2 | Shared limits and daily budget. |
| `DAILY_AI_LIMIT` | e.g. `2000` | Costly AI calls allowed per UTC day, for the whole app. Lower it for a small test group. |
| `MODEL_AUDIO_ENGINE` | `tts` | Recommended on Hobby: model clips use TTS only, which is faster and cheaper than reading with the Live voice and stays well inside the 60 s function limit. |

All other variables in [`.env.example`](../.env.example) are optional.

Then **Deployments** -> **Redeploy** (or push a commit) so the new values take effect.

## 4. Put a spending limit on the Gemini key

The daily budget counts requests, not money. Set a hard limit where the money is:

1. Use a key from a Google Cloud project that only this app uses, so its bill is easy to read
   (AI Studio -> **Get API key** -> create the key in a new project).
2. In Google Cloud Console -> **Billing** -> **Budgets & alerts**, create a budget for that project
   (for example, $20 a month) with email alerts at 50%, 90% and 100%.
3. Budgets only alert by default. For a hard stop, lower the API quotas instead: **APIs & Services**
   -> **Generative Language API** -> **Quotas**, and reduce requests per minute and per day.
   (AI Studio's own spend-cap setting can also be used where it's available for your account.)
4. If the key ever leaks or the bill spikes, delete the key in AI Studio and add a new one in
   Vercel. The app keeps working once you redeploy.

## 5. Check it on a phone

1. Open the `https://<project>.vercel.app` URL on a phone. The microphone only works over HTTPS,
   which Vercel provides. A plain `http://` LAN address won't get mic access.
2. Allow the microphone when asked, then try: the coach conversation, a shadowing rep with a model
   clip, and a short interview with feedback.
3. In Vercel -> **Logs**, check for `[guard]` warnings (Redis failing, or the daily budget being
   reached) and `[api/...]` errors.
4. Optional: "Add to Home Screen" installs it like an app.

## Hobby plan limits the app is tuned for

- **4.5 MB request bodies**: recorded and model audio sent for coaching is capped at about 4 MB
  in total. Very long takes are refused with "This request is too large."
- **60 s function time**: `/api/model-audio` gives the Live voice about 32 s in total, then falls
  back to TTS. With `MODEL_AUDIO_ENGINE=tts` it goes straight to TTS.
- Live sessions run directly between the browser and Gemini using single-use tokens, so long
  coach conversations aren't affected by the function time limit.

## Changing the limits

- Per-route rate limits: `LIMITS` in [`src/server/guard.ts`](../src/server/guard.ts).
- Daily budget: the `DAILY_AI_LIMIT` variable (redeploy after changing it).
- To reset today's budget early, delete the `sly:budget:<YYYY-MM-DD>` key in the Upstash console.
