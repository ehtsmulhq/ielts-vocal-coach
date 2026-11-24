/**
 * Minimal typing for the Web Speech API recogniser (not in TypeScript's DOM lib).
 * Used only for an optional live transcript; the recorded audio is what gets scored.
 */

export interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

export interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => Recognition;

export function createRecognition(lang = "en-GB"): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;
  return rec;
}

export function resultsToText(event: RecognitionResultEvent): string {
  let text = "";
  for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript + " ";
  return text.trim();
}
