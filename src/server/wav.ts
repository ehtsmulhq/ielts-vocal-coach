/** WAV helpers for TTS output (pure Buffer operations, unit-tested). */

export const DEFAULT_SAMPLE_RATE = 24000;

export function pcm16ToWav(pcm: Buffer, sampleRate = DEFAULT_SAMPLE_RATE): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Trims leading/trailing near-silence, keeping a short pad, so shadowing turns aren't stretched. */
export function trimSilence(pcm: Buffer, sampleRate = DEFAULT_SAMPLE_RATE, threshold = 600): Buffer {
  const samples = Math.floor(pcm.length / 2);
  let first = 0;
  while (first < samples && Math.abs(pcm.readInt16LE(first * 2)) < threshold) first++;
  let last = samples - 1;
  while (last > first && Math.abs(pcm.readInt16LE(last * 2)) < threshold) last--;
  if (first >= last) return pcm;
  const pad = Math.floor(sampleRate * 0.15);
  const start = Math.max(0, first - pad);
  const end = Math.min(samples, last + pad);
  return pcm.subarray(start * 2, end * 2);
}

/**
 * Normalises TTS output to 16-bit mono PCM. Some models return a complete WAV,
 * others raw PCM with the rate in the MIME type (e.g. `audio/L16;rate=24000`).
 */
export function extractPcm(raw: Buffer, mimeType = ""): { pcm: Buffer; sampleRate: number } {
  let sampleRate = Number(/rate=(\d+)/.exec(mimeType)?.[1]) || DEFAULT_SAMPLE_RATE;
  if (raw.length > 44 && raw.toString("ascii", 0, 4) === "RIFF") {
    const dataAt = raw.indexOf("data", 12, "ascii");
    if (dataAt < 0) throw new Error("Malformed WAV from TTS");
    sampleRate = raw.readUInt32LE(24) || sampleRate;
    return { pcm: raw.subarray(dataAt + 8), sampleRate };
  }
  return { pcm: raw, sampleRate };
}

/** Raw TTS bytes -> trimmed, single-header WAV. */
export function ttsToWav(raw: Buffer, mimeType = ""): Buffer {
  const { pcm, sampleRate } = extractPcm(raw, mimeType);
  return pcm16ToWav(trimSilence(pcm, sampleRate), sampleRate);
}
