import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-subtle">404</p>
      <h1 className="font-serif text-3xl font-semibold">Page not found</h1>
      <p className="text-muted">That page doesn&apos;t exist. Your practice is still here.</p>
      <Link href="/" className="rounded-[var(--radius-control)] bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover">
        Back to today
      </Link>
    </main>
  );
}
