"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BookOpen, Home, LineChart, Mic, Monitor, Moon, Settings, Sun } from "lucide-react";
import { cn } from "@/ui/primitives";
import { usePreferences } from "@/features/shared/stores";
import { updatePreferences, type ThemePreference } from "@/storage/preferences";
import { cleanupLegacyKeys } from "@/storage/wipe";
import { CoachProvider } from "@/features/tutor/CoachProvider";
import { CoachDock } from "@/features/tutor/CoachChat";

const NAV = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/library", label: "Library", Icon: BookOpen },
  { href: "/progress", label: "Progress", Icon: LineChart },
  { href: "/capture", label: "Capture", Icon: Mic },
  { href: "/settings", label: "Settings", Icon: Settings },
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
            "grid h-9 w-9 place-items-center rounded-full cursor-pointer transition-colors sm:h-7 sm:w-7",
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
    // Offline shell + installability. Not in development, where it would fight hot reload.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);

  return (
    // The coach lives here, above the pages, so one lesson stays connected across navigation.
    <CoachProvider>
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header
        data-app-header
        className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-x-6 px-[max(1rem,env(safe-area-inset-left))] py-2.5 sm:py-3">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight">
            Sounds Like You
          </Link>
          <div className="flex items-center gap-4">
            {/* Desktop and tablet navigation; phones get the bottom tab bar below. */}
            <nav aria-label="Main" className="hidden sm:block">
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
      {/* On phones, leave room for the tab bar (and the coach bar above it) so nothing hides behind them. */}
      <main
        id="main"
        className="mx-auto w-full max-w-5xl flex-1 px-4 pb-[calc(var(--mobile-bottom-ui,4rem)+env(safe-area-inset-bottom)+1.5rem)] pt-5 sm:px-4 sm:pt-8 sm:pb-[calc(2rem+var(--landscape-room,0px))]"
      >
        {children}
      </main>
      <CoachDock />

      <nav
        aria-label="Main"
        data-app-tabbar
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-accent" : "text-muted"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
    </CoachProvider>
  );
}
