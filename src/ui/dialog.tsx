"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Modal dialog on the native <dialog> element: the browser provides the focus
 * trap, Escape to close, and makes the rest of the page inert.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] rounded-[var(--radius-card)] border border-line bg-surface p-0 text-fg backdrop:bg-black/50"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id={titleId} className="font-serif text-xl font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-subtle hover:bg-surface-2 hover:text-fg cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
