"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Panel yang muncul dari bawah layar, dibangun di atas <dialog> supaya fokus terkunci
 * di dalam panel dan tombol Esc menutupnya. Isi tetap ter-mount saat tertutup,
 * jadi isian form yang belum disimpan tidak hilang kalau panel tertutup tanpa sengaja.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // ketuk area gelap di luar panel untuk menutup
      onClick={(e) => e.target === ref.current && onClose()}
      className="sheet mx-auto mb-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-3xl bg-sky-pale p-0 shadow-polaroid backdrop:bg-brand-deep/45 sm:max-w-2xl"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="shrink-0 px-4 pb-2 pt-2 sm:px-5">
          <span className="mx-auto block h-1.5 w-12 rounded-full bg-brand/25" aria-hidden />
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-2xl font-extrabold text-brand-deep">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-full text-brand-deep hover:bg-sky-soft">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-5">{children}</div>
      </div>
    </dialog>
  );
}
