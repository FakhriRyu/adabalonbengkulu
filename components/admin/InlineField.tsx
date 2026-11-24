"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/admin/action";
import { inputClass } from "./ui";

/**
 * Isian yang langsung tersimpan saat ditinggalkan (atau Enter); pilihan tersimpan saat diganti.
 * Kalau gagal, isian kembali ke nilai tersimpan dan pesan error tampil.
 */
export default function InlineField({
  label,
  value,
  onSave,
  type = "text",
  options,
  required = false,
  maxLength,
  placeholder,
  inputMode,
  className = "",
}: {
  label: string;
  value: string;
  onSave: (value: string) => Promise<ActionState>;
  type?: "text" | "tel" | "date" | "textarea" | "select";
  /** untuk type="select" */
  options?: { value: string; label: string }[];
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  inputMode?: "numeric" | "text" | "tel";
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const focused = useRef(false);

  // data dari server berubah (mis. disimpan dari tempat lain): ikuti, kecuali sedang diketik
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  function save(next: string) {
    if (next.trim() === value.trim()) return;
    setError(undefined);
    startTransition(async () => {
      const r = await onSave(next);
      if (r.error) {
        setError(r.error);
        setDraft(value);
      } else setSaved(true);
    });
  }

  const common = {
    value: draft,
    required,
    "aria-invalid": error ? true : undefined,
    onFocus: () => (focused.current = true),
    onBlur: () => {
      focused.current = false;
      if (type !== "select") save(draft);
    },
    className: inputClass,
  };

  return (
    <label className={`block ${className}`}>
      <span className="mb-1 flex items-center gap-1.5 text-sm font-bold text-brand-deep">
        {label}
        <span aria-live="polite" className="inline-flex items-center gap-1 text-xs font-bold text-leaf-dark">
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" aria-label="Menyimpan" />
          ) : (
            saved && <><Check className="h-3.5 w-3.5" aria-hidden /> Tersimpan</>
          )}
        </span>
      </span>
      {type === "textarea" ? (
        <textarea {...common} rows={2} maxLength={maxLength} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} />
      ) : type === "select" ? (
        <select
          {...common}
          onChange={(e) => {
            setDraft(e.target.value);
            save(e.target.value);
          }}
        >
          {options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={type}
          maxLength={maxLength}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      )}
      {error && <span role="alert" className="mt-1 block text-sm font-bold text-peach-deep">{error}</span>}
    </label>
  );
}
