"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveStatus, MicMode } from "@/lib/live-session";
import { Mic, MicOff, ShieldCheck, Radio, FastForward } from "lucide-react";

interface VoiceOrbProps {
  status: LiveStatus;
  micAnalyser: AnalyserNode | null;
  tutorAnalyser: AnalyserNode | null;
  isMuted: boolean;
  micMode: MicMode;
  micVolume: number;
  tutorSpeaking: boolean;
  speechProtection?: "protected" | "barge-in";
  onToggleMute: () => void;
  onChangeMicMode: (mode: MicMode) => void;
  onToggleSpeechProtection?: () => void;
  onPushToTalkChange: (active: boolean) => void;
  onInterruptTutor: () => void;
}

export function VoiceOrb({
  status,
  micAnalyser,
  tutorAnalyser,
  isMuted,
  micMode,
  tutorSpeaking,
  speechProtection = "protected",
  onToggleMute,
  onChangeMicMode,
  onToggleSpeechProtection,
  onPushToTalkChange,
  onInterruptTutor,
}: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<"tutor" | "student" | "idle">("idle");
  const [isPressingTalk, setIsPressingTalk] = useState(false);
  const [micDbLevel, setMicDbLevel] = useState("-60");

  // Spacebar hotkey for push-to-talk
  useEffect(() => {
    if (status !== "live") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body && !e.repeat) {
        e.preventDefault();
        if (tutorSpeaking) {
          onInterruptTutor();
          return;
        }
        if (micMode === "push-to-talk") {
          setIsPressingTalk(true);
          onPushToTalkChange(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (micMode === "push-to-talk") {
          setIsPressingTalk(false);
          onPushToTalkChange(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [status, tutorSpeaking, micMode, onInterruptTutor, onPushToTalkChange]);

  // Academic Oscilloscope & Spectrum Analyzer Canvas Renderer
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const micTimeData = new Uint8Array(256);
    const tutorFreqData = new Uint8Array(128);
    let phase = 0;

    const render = () => {
      phase += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      // Background Grid - Minimalist Academic Oscilloscope Screen
      ctx.fillStyle = "#09090b"; // Pitch dark zinc
      ctx.fillRect(0, 0, width, height);

      // Draw Fine Grid Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center Datum Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      let micEnergy = 0;
      let tutorEnergy = 0;

      if (micAnalyser && !isMuted) {
        micAnalyser.getByteTimeDomainData(micTimeData);
        let sum = 0;
        for (let i = 0; i < micTimeData.length; i++) {
          const v = (micTimeData[i] - 128) / 128;
          sum += v * v;
        }
        micEnergy = Math.sqrt(sum / micTimeData.length);
        const db = micEnergy > 0 ? (20 * Math.log10(micEnergy)).toFixed(1) : "-60.0";
        setMicDbLevel(db);
      }

      if (tutorAnalyser) {
        tutorAnalyser.getByteFrequencyData(tutorFreqData);
        let sum = 0;
        for (let i = 0; i < tutorFreqData.length; i++) sum += tutorFreqData[i];
        tutorEnergy = sum / tutorFreqData.length / 255;
      }

      if (tutorEnergy > 0.04 || tutorSpeaking) {
        setActiveSpeaker("tutor");
      } else if (micEnergy > 0.03 || isPressingTalk) {
        setActiveSpeaker("student");
      } else {
        setActiveSpeaker("idle");
      }

      // CHANNEL 1: Candidate Oscilloscope Waveform (Top Half)
      ctx.lineWidth = 1.5;
      if (status === "live" && (micEnergy > 0.01 || isPressingTalk)) {
        ctx.strokeStyle = "#10b981"; // Emerald monochrome line trace
      } else {
        ctx.strokeStyle = "rgba(161, 161, 170, 0.4)";
      }

      ctx.beginPath();
      const sliceWidth = width / micTimeData.length;
      let x = 0;
      for (let i = 0; i < micTimeData.length; i++) {
        const v = micTimeData[i] / 128.0;
        const y = (v * (height / 3)) / 2 + height / 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // CHANNEL 2: Examiner Acoustic Formant Spectrum Bars (Bottom Half)
      const numBars = 32;
      const barWidth = width / numBars - 2;
      for (let i = 0; i < numBars; i++) {
        const val = tutorFreqData[i * 2] || (tutorSpeaking ? Math.abs(Math.sin(phase + i * 0.4)) * 180 : 4);
        const barHeight = (val / 255) * (height / 2.5);

        ctx.fillStyle = tutorSpeaking ? "#f43f5e" : "rgba(113, 113, 122, 0.3)";
        ctx.fillRect(i * (barWidth + 2) + 1, height - barHeight - 4, barWidth, barHeight);
      }

      // Oscilloscope Telemetry Text Overlay
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(`CH1 RMS: ${micDbLevel} dBFS`, 8, 16);
      ctx.fillText(`CH2 EXAMINER: ${tutorSpeaking ? "ACTIVE" : "STANDBY"}`, 8, 30);
      ctx.fillText(`STATUS: ${status.toUpperCase()}`, width - 110, 16);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [status, micAnalyser, tutorAnalyser, isMuted, tutorSpeaking, isPressingTalk, micDbLevel]);

  return (
    <div className="flex flex-col items-center justify-between gap-4 w-full">
      {/* Oscilloscope Header */}
      <div className="w-full flex items-center justify-between font-mono text-[10px] tracking-widest text-zinc-500 uppercase border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <span className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
          <Radio className="w-3 h-3 text-zinc-500" />
          Acoustic Oscilloscope & Spectrum Monitor
        </span>
        <span>24.0 kHz PCM</span>
      </div>

      {/* Main Canvas Monitor */}
      <div className="relative w-full border border-zinc-800 rounded-sm overflow-hidden bg-zinc-950 shadow-inner">
        <canvas ref={canvasRef} width={420} height={180} className="w-full h-44 block" />

        {/* Live Status Overlay Badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 font-mono text-[9px] px-2 py-0.5 bg-zinc-900/90 border border-zinc-700 text-zinc-300">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeSpeaker === "student"
                ? "bg-emerald-500 animate-pulse"
                : activeSpeaker === "tutor"
                ? "bg-rose-500 animate-pulse"
                : "bg-zinc-500"
            }`}
          />
          <span>
            {activeSpeaker === "student"
              ? "CANDIDATE SPEAKING"
              : activeSpeaker === "tutor"
              ? "EXAMINER RESPONDING"
              : status === "live"
              ? "ACOUSTIC GRAPH READY"
              : "IDLE"}
          </span>
        </div>
      </div>

      {/* Interactive Micro-Console Controls */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {/* Mute Button */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 border font-mono text-[10px] uppercase transition-all cursor-pointer ${
            isMuted
              ? "bg-rose-900/20 border-rose-600 text-rose-400 font-bold"
              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
          }`}
        >
          {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          <span>{isMuted ? "MIC MUTED" : "MIC ACTIVE"}</span>
        </button>

        {/* Mic Mode Selector */}
        <button
          type="button"
          onClick={() => onChangeMicMode(micMode === "continuous" ? "push-to-talk" : "continuous")}
          className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] uppercase hover:border-zinc-400 transition-all cursor-pointer"
        >
          <Radio className="w-3 h-3" />
          <span>{micMode === "continuous" ? "CONTINUOUS" : "PUSH-TO-TALK"}</span>
        </button>

        {/* Speech Protection Mode */}
        {onToggleSpeechProtection && (
          <button
            type="button"
            onClick={onToggleSpeechProtection}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 border font-mono text-[10px] uppercase transition-all cursor-pointer ${
              speechProtection === "protected"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{speechProtection === "protected" ? "NO BARGE-IN" : "BARGE-IN ON"}</span>
          </button>
        )}

        {/* Interrupt Tutor */}
        <button
          type="button"
          onClick={onInterruptTutor}
          disabled={!tutorSpeaking}
          className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 font-mono text-[10px] uppercase hover:border-zinc-400 transition-all cursor-pointer"
        >
          <FastForward className="w-3 h-3" />
          <span>INTERRUPT</span>
        </button>
      </div>

      {/* Push to talk instruction bar */}
      {micMode === "push-to-talk" && (
        <div className="w-full text-center font-mono text-[10px] text-zinc-500 py-1 border-t border-zinc-200 dark:border-zinc-800">
          [ HOLD <kbd className="px-1 bg-zinc-200 dark:bg-zinc-800 font-bold">SPACEBAR</kbd> TO SPEAK ]
        </div>
      )}
    </div>
  );
}
