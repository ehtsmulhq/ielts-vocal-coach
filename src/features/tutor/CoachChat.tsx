"use client";

import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronDown, GripVertical, Mic, MicOff, PhoneOff, Sparkles } from "lucide-react";
import { Alert, Button, cn } from "@/ui/primitives";
import { useHydrated, usePreferences } from "@/features/shared/stores";
import { updatePreferences } from "@/storage/preferences";
import { useVoiceCoach, type Tutor } from "./CoachProvider";
import { PHONE_QUERY, SHORT_QUERY, useMediaQuery } from "@/features/shared/useMediaQuery";
import { TutorAvatar } from "./TutorAvatar";
import { clampToViewport, nudge, type Point } from "./floating";

/** Height the conversation adds when it slides open (h-72 plus its top border). */
const THREAD_PX = 289;
/** Gap between the navbar and the window. */
const GAP_PX = 8;
/** Navbar height before it has been measured (one row on desktop). */
const NAV_FALLBACK_PX = 64;

/** Bottom edge of the app's sticky navbar, which wraps to two rows on small screens. */
function navBottom(): number {
  const nav = document.querySelector("[data-app-header]");
  return nav ? Math.round(nav.getBoundingClientRect().height) : NAV_FALLBACK_PX;
}

function stateLine(tutor: Tutor, name: string): string {
  if (tutor.status === "connecting") return `Calling ${name}…`;
  if (tutor.status === "reconnecting") return "Reconnecting…";
  if (tutor.status === "live") {
    if (tutor.audioBlocked) return `Tap anywhere to hear ${name}`;
    if (tutor.away) return "On hold while you browse";
    if (tutor.speaking) return "Speaking";
    if (tutor.held) return "Paused while you practise";
    if (tutor.micMuted) return "Your mic is muted";
    return "Listening. Ask anything out loud";
  }
  if (tutor.status === "ended") return "Lesson ended";
  return "Your voice coach";
}

function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3" aria-label={`${name} is speaking`}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-subtle motion-safe:animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

/**
 * The voice coach as a floating chat window. Drag it anywhere by its header
 * (or move it with the arrow keys on the grip); it remembers where you left it
 * and always stays on screen. Double-click the header to send it back to the
 * top of the page.
 *
 * Presentation only. The lesson itself (one connection for the whole app,
 * reconnecting on its own) lives in `CoachProvider`.
 */
export function CoachChat() {
  const tutor = useVoiceCoach();
  const { persona, log } = tutor;
  // Phones get a bottom sheet above the tab bar instead of a draggable floating window.
  const narrow = useMediaQuery(PHONE_QUERY); // tab bar showing
  const short = useMediaQuery(SHORT_QUERY); // landscape phone
  const phone = narrow || short;
  const { coachPosition } = usePreferences();
  const [pos, setPos] = useState<Point | null>(coachPosition);
  const [dragging, setDragging] = useState(false);
  // Only mounted after hydration (see CoachDock), so the navbar is already on the page here.
  const [navHeight, setNavHeight] = useState(() => (typeof document === "undefined" ? NAV_FALLBACK_PX : navBottom()));
  const [open, setOpenState] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const threadId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const unread = !open && log.length > readCount;
  const lessonOn = tutor.status === "live" || tutor.status === "connecting" || tutor.status === "reconnecting";
  const needsStart = tutor.status === "idle" || tutor.status === "ended" || tutor.status === "error";
  const last = log[log.length - 1];
  const showTyping = lessonOn && tutor.speaking && last?.role !== "coach";
  // While the chat is folded away, show what the coach is saying right in the header.
  const preview = !open && tutor.speaking && last?.role === "coach" ? `“${last.text}”` : null;

  /** Places the window so it's fully visible, optionally as if it were `extraHeight` taller. */
  const fit = (p: Point, extraHeight = 0): Point => {
    const rect = panelRef.current?.getBoundingClientRect();
    const size = { width: rect?.width ?? 0, height: (rect?.height ?? 0) + extraHeight };
    return clampToViewport(p, size, viewport(), { margin: GAP_PX, top: navBottom() + GAP_PX });
  };
  const currentPoint = (): Point => {
    const rect = panelRef.current?.getBoundingClientRect();
    return { x: rect?.left ?? 0, y: rect?.top ?? 0 };
  };
  const place = (p: Point | null, save = true) => {
    setPos(p);
    if (save) updatePreferences({ coachPosition: p });
  };

  const setOpen = (value: boolean) => {
    // Opening near the bottom of the screen nudges the window up so the conversation isn't cut off.
    if (value && !open && pos && !phone) place(fit(pos, THREAD_PX));
    setOpenState(value);
    setReadCount(log.length);
  };

  // Keep the window on screen and below the navbar when the browser or the navbar resizes
  // (or the saved spot came from a bigger screen).
  useEffect(() => {
    const refit = () => {
      setNavHeight(navBottom());
      setPos((p) => (p ? fit(p) : p));
    };
    const frame = requestAnimationFrame(refit);
    window.addEventListener("resize", refit);
    const nav = document.querySelector("[data-app-header]");
    const observer = nav ? new ResizeObserver(refit) : null;
    if (nav) observer?.observe(nav);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", refit);
      observer?.disconnect();
    };
  }, []);

  // On phones the sheet sits above the tab bar: tell the page how much room to leave at the bottom.
  useEffect(() => {
    if (!phone) return;
    const root = document.documentElement;
    // Portrait: tab bar + sheet. Landscape (no tab bar): the sheet alone.
    const name = narrow ? "--mobile-bottom-ui" : "--landscape-room";
    root.style.setProperty(name, narrow ? "8.5rem" : "4.5rem");
    return () => {
      root.style.removeProperty(name);
    };
  }, [phone, narrow]);

  // Keep the newest message in view (scrolls the thread only, never the page).
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, log, showTyping]);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const start = currentPoint();
    dragRef.current = { dx: e.clientX - start.x, dy: e.clientY - start.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (d) setPos(fit({ x: e.clientX - d.dx, y: e.clientY - d.dy }));
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    if (pos) updatePreferences({ coachPosition: pos });
  };

  const start = () => {
    setOpen(true);
    void tutor.start();
  };

  return (
    <section
      ref={panelRef}
      aria-label={`Chat with ${persona.name}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) setOpen(false);
      }}
      // Phones: a sheet pinned above the tab bar. Desktop: default spot centred just under the navbar.
      style={
        phone
          ? { bottom: narrow ? "calc(4rem + env(safe-area-inset-bottom))" : "env(safe-area-inset-bottom)" }
          : pos
            ? { left: pos.x, top: pos.y }
            : { top: navHeight + GAP_PX }
      }
      className={cn(
        "fixed z-40 overflow-hidden bg-surface",
        phone
          ? "inset-x-0 rounded-t-2xl border-t border-line shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.45)]"
          : "w-[min(26rem,calc(100vw-1rem))] rounded-2xl border border-line shadow-xl",
        !phone && !pos && "left-1/2 -translate-x-1/2",
        dragging && "shadow-2xl ring-2 ring-accent/30"
      )}
    >
      <header
        {...(phone
          ? {}
          : {
              onPointerDown,
              onPointerMove,
              onPointerUp: endDrag,
              onPointerCancel: endDrag,
              onDoubleClick: (e: ReactMouseEvent) => {
                if (!(e.target as HTMLElement).closest("button")) place(null);
              },
              title: "Drag to move. Double-click to put it back.",
            })}
        className={cn(
          "flex items-center gap-2",
          phone
            ? "min-h-16 px-3 py-2"
            : cn("min-h-[4.5rem] touch-none select-none py-3 pl-1.5 pr-3", dragging ? "cursor-grabbing" : "cursor-grab")
        )}
      >
        {!phone && (
        <button
          type="button"
          aria-label="Move chat window. Use the arrow keys; Home puts it back."
          onKeyDown={(e) => {
            if (e.key === "Home") {
              e.preventDefault();
              place(null);
              return;
            }
            const next = nudge(pos ?? currentPoint(), e.key, e.shiftKey);
            if (next) {
              e.preventDefault();
              place(fit(next));
            }
          }}
          className="grid h-8 w-5 shrink-0 cursor-grab place-items-center rounded text-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        )}
        <span className="relative">
          <TutorAvatar persona={persona} speaking={tutor.speaking} />
          {unread && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-danger ring-2 ring-surface" aria-label="New message" />
          )}
        </span>
        <div className="min-w-0 flex-1 pl-1">
          <p className="font-serif text-lg font-semibold leading-tight">{persona.name}</p>
          <p className="flex min-w-0 items-center gap-2 text-sm text-muted" aria-live="polite">
            {tutor.status === "live" && (
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  !tutor.micMuted && !tutor.held && !tutor.away && !tutor.audioBlocked
                    ? "bg-success motion-safe:animate-pulse"
                    : "bg-line-strong"
                )}
              />
            )}
            <span className="truncate">{preview ?? stateLine(tutor, persona.name)}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {tutor.status === "reconnecting" && (
            <Button size="sm" variant="danger" onClick={tutor.end} aria-label="End lesson" className="px-2.5">
              <PhoneOff className="h-4 w-4" aria-hidden />
            </Button>
          )}
          {tutor.status === "live" && (
            <>
              <Button
                size="sm"
                onClick={tutor.toggleMic}
                aria-pressed={tutor.micMuted}
                aria-label={tutor.micMuted ? "Unmute microphone" : "Mute microphone"}
                className="px-2.5"
              >
                {tutor.micMuted ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
              </Button>
              <Button size="sm" variant="danger" onClick={tutor.end} aria-label="End lesson" className="px-2.5">
                <PhoneOff className="h-4 w-4" aria-hidden />
              </Button>
            </>
          )}
          {needsStart && (
            <Button size="sm" variant="primary" onClick={start}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {tutor.status === "ended" ? "Start again" : "Start lesson"}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={threadId}
            aria-label={open ? "Hide conversation" : "Show conversation"}
            className="px-2"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")}
              aria-hidden
            />
          </Button>
        </div>
      </header>

      {tutor.error && (
        <Alert tone="warning" className="mx-4 mb-3">
          {tutor.error}
        </Alert>
      )}

      {/* Slides open and closed smoothly; the height is fixed so it always takes the same space. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div
            id={threadId}
            ref={threadRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className={cn("flex flex-col gap-2 overflow-y-auto border-t border-line px-4 py-4", phone ? "h-[min(18rem,45dvh)]" : "h-72")}
          >
            {log.length === 0 && !lessonOn && (
              <p className="m-auto max-w-sm text-center text-sm text-muted">
                {persona.name} talks you through this script, and you can ask questions any time, out loud. Your
                conversation shows up here. Headphones help.
              </p>
            )}
            {log.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  m.role === "coach"
                    ? "self-start rounded-bl-md bg-surface-2 text-fg"
                    : "self-end rounded-br-md bg-accent text-on-accent"
                )}
              >
                <span className="sr-only">{m.role === "coach" ? `${persona.name}: ` : "You: "}</span>
                {m.text}
              </div>
            ))}
            {(showTyping || (tutor.status !== "live" && lessonOn && log.length === 0)) && <TypingBubble name={persona.name} />}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Where the coach window appears: on every practice page, and on any other page
 * while a lesson is running (on hold), so the learner can always see and end it.
 */
export function CoachDock() {
  const hydrated = useHydrated();
  const { attachedScriptId, status } = useVoiceCoach();
  const visible = attachedScriptId !== null || (status !== "idle" && status !== "ended");
  return hydrated && visible ? <CoachChat /> : null;
}
