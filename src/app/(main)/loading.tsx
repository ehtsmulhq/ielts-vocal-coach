export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
    </div>
  );
}
