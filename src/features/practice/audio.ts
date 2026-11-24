/** Browser audio helpers for practice (no React). */

export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

export const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};

export class MicError extends Error {
  constructor(message = "Microphone access was blocked. Allow the microphone in your browser's site settings, then try again.") {
    super(message);
    this.name = "MicError";
  }
}

export async function openMic(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new MicError("This browser can't record audio. Try a recent version of Chrome, Edge, Firefox or Safari.");
  }
  try {
    return await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
  } catch {
    throw new MicError();
  }
}

export function createRecorder(stream: MediaStream): MediaRecorder {
  const mime = pickRecorderMime();
  return mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
}

/** Resolves after `ms`, or early (polled every 100 ms) once `shouldStop` returns true. */
export async function waitMs(ms: number, shouldStop: () => boolean): Promise<void> {
  const end = performance.now() + ms;
  while (performance.now() < end && !shouldStop()) {
    await new Promise((r) => setTimeout(r, 100));
  }
}

/** Records the microphone for `ms` (stoppable), returning the take or null if nothing was captured. */
export async function recordFor(ms: number, shouldStop: () => boolean): Promise<Blob | null> {
  const stream = await openMic();
  try {
    const rec = createRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<void>((r) => {
      rec.onstop = () => r();
    });
    rec.start();
    await waitMs(ms, shouldStop);
    if (rec.state !== "inactive") rec.stop();
    await stopped;
    const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
    return blob.size > 200 ? blob : null;
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

/** Splits a script's breath groups ("... |") into clean phrases. */
export function cleanChunks(thoughtChunks: string[]): string[] {
  return thoughtChunks.map((c) => c.replace(/\|/g, "").trim()).filter(Boolean);
}
