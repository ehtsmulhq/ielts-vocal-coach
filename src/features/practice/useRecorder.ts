"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRecorder, openMic } from "./audio";
import { createRecognition, resultsToText, type Recognition } from "./speech-recognition";

export interface Take {
  blob: Blob;
  mimeType: string;
  seconds: number;
  transcript: string;
}

/**
 * Records a full delivery: MediaRecorder for the audio that gets scored, a level
 * meter for feedback, and (where the browser supports it) a live transcript.
 */
export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const activeRef = useRef(false);
  const startedAtRef = useRef(0);
  const transcriptRef = useRef("");

  const teardown = useCallback(() => {
    activeRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setIsRecording(false);
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    setSeconds(0);
    chunksRef.current = [];
    let stream: MediaStream;
    try {
      stream = await openMic();
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
    streamRef.current = stream;
    activeRef.current = true;

    // Level meter
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!activeRef.current) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (const v of data) sum += v;
        setLevel(Math.min(1, sum / data.length / 128));
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* meter is optional */
    }

    const recorder = createRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(250);
    recorderRef.current = recorder;

    const recognition = createRecognition();
    if (recognition) {
      recognition.onresult = (e) => {
        transcriptRef.current = resultsToText(e);
        setTranscript(transcriptRef.current);
      };
      recognition.onerror = () => {};
      recognition.onend = () => {
        if (activeRef.current && recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {
            /* already restarting */
          }
        }
      };
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        /* live transcript is optional */
      }
    }

    startedAtRef.current = performance.now();
    setIsRecording(true);
    return true;
  }, []);

  /** Stops recording and returns the take (or null if nothing usable was captured). */
  const stop = useCallback(async (): Promise<Take | null> => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    const secs = Math.round((performance.now() - startedAtRef.current) / 1000);
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }
    teardown();
    const mimeType = recorder?.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    if (blob.size <= 200 && !transcriptRef.current) return null;
    return { blob, mimeType, seconds: secs, transcript: transcriptRef.current };
  }, [teardown]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    teardown();
  }, [teardown]);

  // Stopwatch
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  useEffect(() => () => cancel(), [cancel]);

  return { isRecording, seconds, level, transcript, error, start, stop, cancel };
}
