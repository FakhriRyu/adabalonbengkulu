"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImageIcon, ImageUp, Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/admin/action";
import { resizeImage } from "@/lib/resize-image";
import { Card } from "./ui";

/** Pratinjau foto + tombol ganti foto. Foto diperkecil di browser dulu, lalu dikirim ke `upload` sebagai isian "image". */
export default function ImageUploader({
  image,
  alt,
  hint,
  upload,
}: {
  image: string | null;
  alt: string;
  hint: string;
  upload: (data: FormData) => Promise<ActionState>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onPick(file: File | undefined) {
    if (!file) return;
    setError(undefined);
    startTransition(async () => {
      const data = new FormData();
      data.set("image", await resizeImage(file));
      const r = await upload(data);
      if (r.error) setError(r.error);
    });
    if (input.current) input.current.value = "";
  }

  return (
    <Card className="flex items-center gap-4">
      <div className="relative shrink-0">
        {image ? (
          <Image src={image} alt={alt} width={900} height={1125} sizes="112px" className="h-36 w-28 rounded-2xl bg-cream object-cover" />
        ) : (
          <span className="flex h-36 w-28 items-center justify-center rounded-2xl bg-sky-pale text-brand/50">
            <ImageIcon className="h-8 w-8" aria-label="Belum ada foto" />
          </span>
        )}
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-brand" aria-label="Mengunggah foto" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-brand-deep">Foto</p>
        <p className="text-sm font-semibold text-brand-dark">{hint}</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => onPick(e.target.files?.[0])} />
        <button
          type="button"
          disabled={pending}
          onClick={() => input.current?.click()}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 font-display font-extrabold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <ImageUp className="h-5 w-5" aria-hidden /> {pending ? "Mengunggah…" : image ? "Ganti foto" : "Unggah foto"}
        </button>
        {error && <p role="alert" className="mt-2 text-sm font-bold text-peach-deep">{error}</p>}
      </div>
    </Card>
  );
}
