import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Joins class names, skipping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- Button
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap";
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-line bg-surface text-fg hover:border-line-strong",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "border border-danger/40 bg-danger-soft text-danger hover:border-danger",
};
const BUTTON_SIZES: Record<ButtonSize, string> = {
  // 40px tall on touch screens (comfortable to tap), compact 32px from the sm breakpoint up.
  sm: "h-10 px-3.5 text-sm sm:h-8 sm:px-3 sm:text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra?: string) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], extra);
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ---------------------------------------------------------------- Card
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("rounded-[var(--radius-card)] border border-line bg-surface p-5", className)} {...props} />
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs font-semibold uppercase tracking-wider text-subtle", className)}>{children}</p>;
}

// ---------------------------------------------------------------- Badge
type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
const BADGE_TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", BADGE_TONES[tone], className)}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Alert
export function Alert({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const urgent = tone === "danger" || tone === "warning";
  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn("rounded-[var(--radius-control)] px-4 py-3 text-sm", BADGE_TONES[tone], className)}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- ScoreBar
export function scoreTone(score: number): Tone {
  return score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
}

const BAR_TONES: Record<Tone, string> = {
  neutral: "bg-line-strong",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const value = Math.round(Math.max(0, Math.min(100, score)));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted capitalize">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div
        className="h-2 rounded-full bg-surface-2 overflow-hidden"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className={cn("h-full rounded-full", BAR_TONES[scoreTone(value)])} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
