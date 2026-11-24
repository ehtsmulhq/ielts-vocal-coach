"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/ui/primitives";
import { usePreferences } from "@/features/shared/stores";
import { updatePreferences, type ThemePreference } from "@/storage/preferences";
import { cleanupLegacyKeys } from "@/storage/wipe";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/library", label: "Library" },
  { href: "/progress", label: "Progress" },
  { href: "/capture", label: "Capture" },
  { href: "/settings", label: "Settings" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/library" && pathname.startsWith("/practice"));
}

const THEMES: { id: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { id: "system", label: "System theme", Icon: Monitor },
  { id: "light", label: "Light theme", Icon: Sun },
  { id: "dark", label: "Dark theme", Icon: Moon },
];

function applyTheme(pref: ThemePreference) {
  const resolved =
    pref === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : pref;
  document.documentElement.dataset.theme = resolved;
}

function ThemeToggle() {
  const { theme } = usePreferences();

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return (
    <div role="radiogroup" aria-label="Theme" className="flex items-center rounded-full border border-line p-0.5">
      {THEMES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          aria-label={label}
          title={label}
          onClick={() => updatePreferences({ theme: id })}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full cursor-pointer transition-colors",
            theme === id ? "bg-surface-2 text-fg" : "text-subtle hover:text-fg"
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    cleanupLegacyKeys();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight">
            Accent Shadowing Gym
          </Link>
          <div className="flex items-center gap-4">
            <nav aria-label="Main">
              <ul className="flex items-center gap-1">
                {NAV.map(({ href, label }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm transition-colors",
                          active ? "bg-surface-2 font-medium text-fg" : "text-muted hover:text-fg"
                        )}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
