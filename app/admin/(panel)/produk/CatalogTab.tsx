"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { CircleCheck, EyeOff, ImageUp, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/admin/BottomSheet";
import { ToggleButton } from "@/components/admin/forms";
import InlineField from "@/components/admin/InlineField";
import { Card } from "@/components/admin/ui";
import { formatRupiah } from "@/data/products";
import type { schema } from "@/db";
import { resizeImage } from "@/lib/resize-image";
import { setProductActive, updateProductField, uploadProductImage, type ProductField } from "./actions";

type ProductRow = typeof schema.products.$inferSelect;

const THEMES = {
  blue: { label: "Biru", dot: "bg-sky" },
  pink: { label: "Pink", dot: "bg-[#f4b8cd]" },
  teal: { label: "Teal", dot: "bg-[#7cbbb4]" },
} as const;

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft py-0.5 pl-1 pr-2.5 text-sm font-extrabold text-leaf-dark">
      <CircleCheck className="h-4 w-4 fill-leaf text-white" aria-hidden /> Tampil
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream py-0.5 pl-1.5 pr-2.5 text-sm font-extrabold text-brand-dark">
      <EyeOff className="h-3.5 w-3.5" aria-hidden /> Sembunyi
    </span>
  );
}

export default function CatalogTab({ products }: { products: ProductRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = products.find((p) => p.id === openId);

  return (
    <>
      <ul className="divide-y-2 divide-sky-pale overflow-hidden rounded-3xl bg-white shadow-soft">
        {products.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => setOpenId(p.id)} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-cream-light">
              <Image src={p.image} alt="" width={900} height={1125} sizes="80px" className={`h-20 w-20 shrink-0 rounded-2xl bg-cream object-cover ${p.isActive ? "" : "opacity-60"}`} />
              <span className="min-w-0 flex-1">
                <StatusPill active={p.isActive} />
                <span className="mt-1 block truncate text-lg font-bold text-brand-deep">{p.name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-dark">
                  <span className="font-extrabold text-brand-deep">{formatRupiah(p.price)}</span>
                  <span aria-hidden>·</span>
                  <span className={`h-3 w-3 rounded ${THEMES[p.theme].dot}`} aria-hidden />
                  <span className="font-semibold">{THEMES[p.theme].label}</span>
                  {p.tagline && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="truncate font-semibold">{p.tagline}</span>
                    </>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <BottomSheet open={Boolean(selected)} onClose={() => setOpenId(null)} title="Detail produk">
        {selected && <ProductEditor key={selected.id} product={selected} />}
      </BottomSheet>
    </>
  );
}

function ProductEditor({ product: p }: { product: ProductRow }) {
  const save = (field: ProductField) => (value: string) => updateProductField(p.id, field, value);

  return (
    <div className="space-y-4">
      <ImageUploader product={p} />

      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-brand-deep">Tampil di toko</p>
          <p className="text-sm font-semibold text-brand-dark">Produk yang disembunyikan tidak muncul di katalog.</p>
        </div>
        <ToggleButton action={setProductActive.bind(null, p.id, !p.isActive)} on={p.isActive} onLabel="Tampil" offLabel="Sembunyi" label={p.name} />
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-brand-dark">Ubah langsung, tersimpan otomatis.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineField label="Nama produk" value={p.name} onSave={save("name")} required maxLength={60} />
          <InlineField label="Harga (Rp)" value={String(p.price)} onSave={save("price")} required inputMode="numeric" />
          <InlineField label="Keterangan" value={p.tagline} onSave={save("tagline")} maxLength={120} className="sm:col-span-2" />
          <InlineField
            label="Warna kartu"
            value={p.theme}
            onSave={save("theme")}
            type="select"
            options={Object.entries(THEMES).map(([value, t]) => ({ value, label: t.label }))}
          />
        </div>
      </Card>
    </div>
  );
}

function ImageUploader({ product: p }: { product: ProductRow }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onPick(file: File | undefined) {
    if (!file) return;
    setError(undefined);
    startTransition(async () => {
      const data = new FormData();
      data.set("image", await resizeImage(file));
      const r = await uploadProductImage(p.id, data);
      if (r.error) setError(r.error);
    });
    if (input.current) input.current.value = "";
  }

  return (
    <Card className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Image src={p.image} alt={`Foto ${p.name}`} width={900} height={1125} sizes="112px" className="h-36 w-28 rounded-2xl bg-cream object-cover" />
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-brand" aria-label="Mengunggah foto" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-brand-deep">Foto produk</p>
        <p className="text-sm font-semibold text-brand-dark">JPG, PNG, atau WebP. Foto potret (4:5) paling pas di katalog.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} tabIndex={-1} />
        <button
          type="button"
          disabled={pending}
          onClick={() => input.current?.click()}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 font-display font-extrabold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <ImageUp className="h-5 w-5" aria-hidden /> {pending ? "Mengunggah…" : "Ganti foto"}
        </button>
        {error && <p role="alert" className="mt-2 text-sm font-bold text-peach-deep">{error}</p>}
      </div>
    </Card>
  );
}
