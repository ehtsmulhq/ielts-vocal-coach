"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-serif text-3xl font-semibold">Something went wrong</h1>
      <p className="text-muted">
        The page hit an unexpected error. Your saved practice is stored in this browser and has not been lost.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={retry}
          className="rounded-[var(--radius-control)] bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover cursor-pointer"
        >
          Try again
        </button>
        <Link href="/" className="rounded-[var(--radius-control)] border border-line px-4 py-2 font-medium hover:border-line-strong">
          Go to today
        </Link>
      </div>
    </main>
  );
}
