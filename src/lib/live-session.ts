/**
 * Browser-side Gemini Live session: mic capture → WebSocket → tutor audio playback.
 *
 * Latency & responsiveness optimizations:
 *  - 50ms audio chunking via AudioWorklet.
 *  - Zero-lag playback buffer alignment (prevents drift backlog).
 *  - Dual Mic Mode: Hands-Free (Continuous with Noise Gate) + Push-To-Talk (Spacebar / Tap).
 *  - Instant Barge-In: cuts tutor playback immediately when student talks.
 *  - Live volume meter callback for visual feedback.
 */

const WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";

import type { NetworkTelemetry } from "./types";

export type LiveStatus = "idle" | "connecting" | "live" | "closed" | "error";
export type MicMode = "continuous" | "push-to-talk";

export interface LiveCallbacks {
  onStatus: (status: LiveStatus, detail?: string) => void;
  onTranscript: (role: "tutor" | "student", text: string) => void;
  onTurnComplete: () => void;
  onMicVolume?: (volume: number) => void;
  onTutorSpeaking?: (speaking: boolean) => void;
  onTelemetry?: (telemetry: NetworkTelemetry) => void;
}

export interface LiveConfig {
  token: string;
  model: string;
  voice: string;
  systemInstruction: string;
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private micCtx: AudioContext | null = null;
  private playCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private worklet: AudioWorkletNode | null = null;
  private playing = new Set<AudioBufferSourceNode>();
  private nextPlayTime = 0;
  private ready = false;
  private muted = false;
  private closedByUser = false;
  private decoder = new TextDecoder();

  // Mode & Audio state
  private micMode: MicMode = "continuous";
  private isPushToTalkActive = false;
  private tutorIsSpeaking = false;
  private speechProtection: "protected" | "barge-in" = "protected";
  private sustainedSpeechFrames = 0;
  private serverTurnCompleted = false;

  // Real-time Network & Packet Telemetry
  private packetsSent = 0;
  private packetsReceived = 0;
  private bufferUnderruns = 0;
  private lastPingMs = 0;
  private lastGoogleRttMs: number | null = null;
  private lastTtfb: number | null = null;
  private speechEndTime = 0;
  private isUserCurrentlySpeaking = false;
  private lastInboundChunkTime = 0;
  private currentJitter = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  /** Analysers for the voice orb visualisation. */
  micAnalyser: AnalyserNode | null = null;
  tutorAnalyser: AnalyserNode | null = null;

  constructor(private cb: LiveCallbacks) {}

  setMicMode(mode: MicMode) {
    this.micMode = mode;
  }

  setSpeechProtection(mode: "protected" | "barge-in") {
    this.speechProtection = mode;
  }

  getSpeechProtection(): "protected" | "barge-in" {
    return this.speechProtection;
  }

  setPushToTalkActive(active: boolean) {
    this.isPushToTalkActive = active;
    if (active) {
      this.isUserCurrentlySpeaking = true;
      this.interruptTutor();
    } else {
      this.isUserCurrentlySpeaking = false;
      this.speechEndTime = performance.now();
    }
  }

  async start(cfg: LiveConfig): Promise<void> {
    this.closedByUser = false;
    this.teardownAudio();
    this.cb.onStatus("connecting");

    // Audio graph first with enhanced echo cancellation and low latency hints
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.micCtx = new AudioContext({ sampleRate: 16000, latencyHint: "interactive" });
    this.playCtx = new AudioContext({ sampleRate: 24000, latencyHint: "interactive" });
    await this.micCtx.audioWorklet.addModule("/worklets/mic-processor.js");

    const source = this.micCtx.createMediaStreamSource(this.stream);
    this.micAnalyser = this.micCtx.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.worklet = new AudioWorkletNode(this.micCtx, "mic-processor");
    source.connect(this.micAnalyser);
    source.connect(this.worklet);

    // Muted gain sink to keep audio worklet clock running
    const sink = this.micCtx.createGain();
    sink.gain.value = 0;
    this.worklet.connect(sink).connect(this.micCtx.destination);

    this.tutorAnalyser = this.playCtx.createAnalyser();
    this.tutorAnalyser.fftSize = 256;
    this.tutorAnalyser.connect(this.playCtx.destination);

    this.worklet.port.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer; rms: number }>) => {
      const { buffer, rms } = e.data;
      this.cb.onMicVolume?.(Math.min(1, rms * 5));

      if (!this.ready || this.muted || this.ws?.readyState !== WebSocket.OPEN) return;

      // In Push-to-Talk mode, only stream when button/spacebar is held
      if (this.micMode === "push-to-talk") {
        if (!this.isPushToTalkActive) return;
        if (this.tutorIsSpeaking) {
          this.interruptTutor();
        }
      }

      // In Continuous (Hands-Free) mode:
      if (this.micMode === "continuous") {
        if (this.tutorIsSpeaking) {
          if (this.speechProtection === "protected") {
            // Anti-Cutoff: Protect the coach's vocal guidance from mic bleed & breathing.
            // Do not send mic packets to Gemini (avoids server-side VAD abort).
            // Do not interrupt playback.
            return;
          } else {
            // Voice Barge-in mode: require sustained voice (rms > 0.08 for >= 4 frames / 200ms)
            if (rms > 0.08) {
              this.sustainedSpeechFrames++;
              if (this.sustainedSpeechFrames >= 4) {
                this.sustainedSpeechFrames = 0;
                this.isUserCurrentlySpeaking = true;
                this.interruptTutor();
              } else {
                return;
              }
            } else {
              this.sustainedSpeechFrames = 0;
              return;
            }
          }
        } else {
          // Tutor is idle: track candidate voice activity for turn latency (TTFB)
          this.sustainedSpeechFrames = 0;
          if (rms > 0.035) {
            this.isUserCurrentlySpeaking = true;
          } else if (rms < 0.015 && this.isUserCurrentlySpeaking) {
            this.isUserCurrentlySpeaking = false;
            this.speechEndTime = performance.now();
          }
        }
      }

      this.packetsSent++;

      this.send({
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: toBase64(buffer),
          },
        },
      });
    };

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${WS_BASE}?access_token=${encodeURIComponent(cfg.token)}`);
      ws.binaryType = "arraybuffer";
      this.ws = ws;

      ws.onopen = () => {
        this.send({
          setup: {
            model: `models/${cfg.model}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.voice } } },
            },
            systemInstruction: { parts: [{ text: cfg.systemInstruction }] },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        });
      };

      ws.onmessage = (ev) => {
        const raw = typeof ev.data === "string" ? ev.data : this.decoder.decode(ev.data as ArrayBuffer);
        let msg: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          msg = JSON.parse(raw);
        } catch {
          return;
        }
        if (msg.setupComplete) {
          this.ready = true;
          this.cb.onStatus("live");
          this.startPingLoop();
          resolve();
          return;
        }
        this.handleMessage(msg);
      };

      ws.onerror = () => {
        // ws close event carries specific detail
      };

      ws.onclose = (ev) => {
        const wasReady = this.ready;
        this.ready = false;
        const reason = ev.reason || `connection closed (code ${ev.code})`;
        if (!wasReady) reject(new Error(reason));
        if (this.closedByUser) this.cb.onStatus("closed");
        else this.cb.onStatus(ev.code === 1000 ? "closed" : "error", reason);
        this.teardownAudio();
      };
    });
  }

  private handleMessage(msg: Record<string, any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const sc = msg.serverContent;
    if (msg.goAway) {
      this.cb.onStatus("live", "Server session limit approaching.");
    }
    if (!sc) return;

    if (sc.interrupted) {
      this.interruptTutor();
    }

    const parts = sc.modelTurn?.parts ?? [];
    let hasAudio = false;
    for (const part of parts) {
      if (part.inlineData?.data) {
        hasAudio = true;
        this.packetsReceived++;

        const now = performance.now();
        if (this.lastInboundChunkTime > 0) {
          const delta = now - this.lastInboundChunkTime;
          const diff = Math.abs(delta - 50);
          this.currentJitter = Math.round(this.currentJitter * 0.85 + diff * 0.15);
        }
        this.lastInboundChunkTime = now;

        if (this.speechEndTime > 0) {
          this.lastTtfb = Math.round(now - this.speechEndTime);
          this.speechEndTime = 0;
          this.emitTelemetry();
        }

        this.play(part.inlineData.data);
      }
    }

    if (hasAudio && !this.tutorIsSpeaking) {
      this.tutorIsSpeaking = true;
      this.cb.onTutorSpeaking?.(true);
    }

    if (sc.inputTranscription?.text) {
      this.cb.onTranscript("student", sc.inputTranscription.text);
    }
    if (sc.outputTranscription?.text) {
      this.cb.onTranscript("tutor", sc.outputTranscription.text);
    }

    if (sc.turnComplete) {
      this.serverTurnCompleted = true;
      // If audio is finished or this was a text-only turn, complete immediately
      if (this.playing.size === 0) {
        this.tutorIsSpeaking = false;
        this.serverTurnCompleted = false;
        this.cb.onTutorSpeaking?.(false);
        this.cb.onTurnComplete();
        this.emitTelemetry();
      }
    }
  }

  private play(b64: string) {
    const ctx = this.playCtx;
    if (!ctx || !this.tutorAnalyser) return;
    if (ctx.state === "suspended") void ctx.resume();

    const pcm = fromBase64(b64);
    const buffer = ctx.createBuffer(1, pcm.length, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.tutorAnalyser);

    // Tight latency scheduling: prevent queue buildup and clock drift
    const now = ctx.currentTime;
    if (this.nextPlayTime < now) {
      if (this.tutorIsSpeaking) {
        this.bufferUnderruns++;
        this.emitTelemetry();
      }
      this.nextPlayTime = now + 0.015; // minimal 15ms lead-in
    }
    const startAt = this.nextPlayTime;
    src.start(startAt);
    this.nextPlayTime = startAt + buffer.duration;

    this.playing.add(src);
    src.onended = () => {
      this.playing.delete(src);
      if (this.playing.size === 0) {
        this.tutorIsSpeaking = false;
        this.cb.onTutorSpeaking?.(false);
        if (this.serverTurnCompleted) {
          this.serverTurnCompleted = false;
          this.cb.onTurnComplete();
          this.emitTelemetry();
        }
      }
    };
  }

  interruptTutor() {
    this.stopPlayback();
    this.tutorIsSpeaking = false;
    this.serverTurnCompleted = false;
    this.sustainedSpeechFrames = 0;
    this.cb.onTutorSpeaking?.(false);
  }

  private stopPlayback() {
    for (const src of this.playing) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    this.playing.clear();
    if (this.playCtx) {
      this.nextPlayTime = this.playCtx.currentTime;
    } else {
      this.nextPlayTime = 0;
    }
  }

  private send(payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
  }

  sendText(text: string) {
    this.speechEndTime = performance.now();
    this.send({ realtimeInput: { text } });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  stop() {
    this.closedByUser = true;
    this.teardownAudio();
  }

  private startPingLoop() {
    const runPing = async () => {
      try {
        const t0 = performance.now();
        const res = await fetch("/api/ping", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          this.lastPingMs = Math.round(performance.now() - t0);
          this.lastGoogleRttMs = json.googleRttMs ?? null;
          this.emitTelemetry();
        }
      } catch {
        // ignore
      }
    };

    void runPing();
    this.pingInterval = setInterval(() => {
      void runPing();
    }, 3500);
  }

  private emitTelemetry() {
    if (!this.cb.onTelemetry) return;
    const lossRate = Math.min(
      100,
      Math.round((this.bufferUnderruns / Math.max(1, this.packetsReceived)) * 1000) / 10
    );

    let quality: NetworkTelemetry["quality"] = "excellent";
    let diagnosis = "Fast, low-latency audio stream with stable packet cadence.";

    if (this.lastTtfb && this.lastTtfb > 2400) {
      quality = "poor";
      diagnosis = `Model inference latency (${(this.lastTtfb / 1000).toFixed(1)}s): Gemini is taking longer to process and synthesize speech tokens. Switch to Gemini 3 Flash Live for ~0.9s responses.`;
    } else if (this.bufferUnderruns > 3 || lossRate > 5) {
      quality = "poor";
      diagnosis = `Audio packet starvation detected (${this.bufferUnderruns} dropouts): Inbound audio chunks are arriving late, causing voice stutter or silence gaps.`;
    } else if (this.lastPingMs > 250) {
      quality = "fair";
      diagnosis = `High network latency (${this.lastPingMs}ms): Your connection to the server or Google WebSocket gateway is elevated.`;
    } else if (this.currentJitter > 60) {
      quality = "fair";
      diagnosis = `High packet jitter (±${this.currentJitter}ms): Audio chunks are arriving in irregular bursts.`;
    } else if (this.lastTtfb && this.lastTtfb > 1400) {
      quality = "good";
      diagnosis = `Moderate response delay (${(this.lastTtfb / 1000).toFixed(1)}s): Normal conversational turnaround time.`;
    }

    const wsBuffered = this.ws ? this.ws.bufferedAmount : 0;

    this.cb.onTelemetry({
      pingMs: this.lastPingMs,
      googleRttMs: this.lastGoogleRttMs,
      ttfbMs: this.lastTtfb,
      packetsSent: this.packetsSent,
      packetsReceived: this.packetsReceived,
      bufferUnderruns: this.bufferUnderruns,
      jitterMs: this.currentJitter,
      lossRatePercent: lossRate,
      wsBufferedAmount: wsBuffered,
      quality,
      diagnosis,
    });
  }

  private teardownAudio() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.stopPlayback();

    if (this.stream) {
      try {
        this.stream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.stream = null;
    }

    if (this.worklet) {
      try {
        this.worklet.port.onmessage = null;
        this.worklet.disconnect();
      } catch {}
      this.worklet = null;
    }

    if (this.micAnalyser) {
      try { this.micAnalyser.disconnect(); } catch {}
      this.micAnalyser = null;
    }
    if (this.tutorAnalyser) {
      try { this.tutorAnalyser.disconnect(); } catch {}
      this.tutorAnalyser = null;
    }

    if (this.micCtx && this.micCtx.state !== "closed") {
      void this.micCtx.close().catch(() => {});
      this.micCtx = null;
    }
    if (this.playCtx && this.playCtx.state !== "closed") {
      void this.playCtx.close().catch(() => {});
      this.playCtx = null;
    }

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(1000, "session terminated");
        }
      } catch {}
      this.ws = null;
    }
  }
}
