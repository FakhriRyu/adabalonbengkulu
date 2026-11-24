"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CircleCheck, EyeOff, ImageIcon, Loader2, Plus } from "lucide-react";
import { BottomSheet } from "@/components/admin/BottomSheet";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import ImageUploader from "@/components/admin/ImageUploader";
import InlineField from "@/components/admin/InlineField";
import { Card, Field, inputClass } from "@/components/admin/ui";
import { formatRupiah } from "@/data/products";
import type { schema } from "@/db";
import { createProduct, deleteProduct, setProductShown, updateProductField, uploadProductImage, type ProductField } from "./actions";

type ProductRow = typeof schema.products.$inferSelect;

const THEMES = { blue: "Biru", pink: "Pink", teal: "Teal" } as const;
const STYLES = { simple: "Simple (garis lurus)", curly: "Keriting (garis lengkung)", plain: "Polos" } as const;
const PALETTES = { pastel: "Pastel", chrome: "Chrome (metalik)" } as const;
const opts = (o: Record<string, string>) => Object.entries(o).map(([value, label]) => ({ value, label }));

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft py-0.5 pl-1 pr-2.5 text-sm font-extrabold text-leaf-dark">
      <CircleCheck className="h-4 w-4 fill-leaf text-white" aria-hidden /> {children}
    </span>
  );
}

function Thumb({ p, className }: { p: ProductRow; className: string }) {
  return p.image ? (
    <Image src={p.image} alt="" width={900} height={1125} sizes="80px" className={`${className} bg-cream object-cover`} />
  ) : (
    <span className={`${className} flex items-center justify-center bg-sky-pale text-brand/50`}>
      <ImageIcon className="h-7 w-7" aria-hidden />
    </span>
  );
}

export default function ProductsTab({ products }: { products: ProductRow[] }) {
  // "baru" = form tambah produk; selain itu id produk yang dibuka
  const [open, setOpen] = useState<string | null>(null);
  // produk yang baru dibuat: panel tetap terbuka sampai produknya muncul di daftar
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const selected = products.find((p) => p.id === open);
  const waiting = open !== null && open === justCreated && !selected;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen("baru")}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 font-display font-extrabold text-white hover:bg-brand-dark"
      >
        <Plus className="h-5 w-5" aria-hidden /> Tambah produk
      </button>

      {products.length === 0 ? (
        <Card><p className="font-semibold text-brand-dark">Belum ada produk.</p></Card>
      ) : (
        <ul className="divide-y-2 divide-sky-pale overflow-hidden rounded-3xl bg-white shadow-soft">
          {products.map((p) => {
            const hidden = !p.showInCatalog && !p.showInBuilder;
            const prices = [
              (p.showInCatalog || p.price > 0) && formatRupiah(p.price),
              (p.showInBuilder || p.pricePerStem > 0) && `${formatRupiah(p.pricePerStem)}/tangkai`,
            ].filter(Boolean);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setOpen(p.id)} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-cream-light">
                  <Thumb p={p} className={`h-20 w-20 shrink-0 rounded-2xl ${hidden ? "opacity-60" : ""}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap gap-1.5">
                      {p.showInCatalog && <Pill>Katalog</Pill>}
                      {p.showInBuilder && <Pill>Rakit</Pill>}
                      {hidden && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cream py-0.5 pl-1.5 pr-2.5 text-sm font-extrabold text-brand-dark">
                          <EyeOff className="h-3.5 w-3.5" aria-hidden /> Sembunyi
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-lg font-bold text-brand-deep">{p.name}</span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-brand-dark">
                      {prices.length > 0 && <span className="font-extrabold text-brand-deep">{prices.join(" · ")}</span>}
                      {prices.length > 0 && p.tagline && " · "}
                      {p.tagline}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet open={open === "baru" || Boolean(selected) || waiting} onClose={() => setOpen(null)} title={open === "baru" ? "Produk baru" : "Detail produk"}>
        {open === "baru" ? (
          <ActionForm
            action={createProduct}
            successText=""
            onSuccess={(r) => {
              setJustCreated(r.created?.id ?? null);
              setOpen(r.created?.id ?? null);
            }}
          >
            <Card className="grid gap-3">
              <Field label="Nama produk"><input name="name" required maxLength={60} className={inputClass} /></Field>
              <Field label="Keterangan" hint="Opsional, tampil di kartu produk"><input name="tagline" maxLength={120} className={inputClass} /></Field>
            </Card>
            <p className="mt-3 text-sm font-semibold text-brand-dark">Setelah dibuat, unggah foto, isi harga, lalu pilih mau tampil di katalog, rakit bunga, atau keduanya.</p>
            <SubmitButton className="mt-4 w-full">Buat produk</SubmitButton>
          </ActionForm>
        ) : selected ? (
          <ProductEditor key={selected.id} product={selected} />
        ) : (
          waiting && <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin text-brand" aria-label="Memuat produk" />
        )}
      </BottomSheet>
    </>
  );
}

/** Sakelar tampil di satu tempat; pesan syarat (mis. "unggah foto dulu") tampil di bawahnya. */
function ShowToggle({ id, where, on, label }: { id: string; where: "catalog" | "builder"; on: boolean; label: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Tampil di ${label}`}
        disabled={pending}
        onClick={() => startTransition(async () => setError((await setProductShown(id, where, !on)).error))}
        className={`inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 px-4 text-sm font-extrabold transition-colors disabled:opacity-60 ${
          on ? "border-leaf bg-leaf-soft text-leaf-dark" : "border-brand/25 bg-cream text-brand-dark"
        }`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-leaf" : "bg-brand/30"}`} aria-hidden />}
        {on ? "Tampil" : "Sembunyi"}
      </button>
      {error && <p role="alert" className="max-w-56 text-right text-sm font-bold text-peach-deep">{error}</p>}
    </div>
  );
}

function ProductEditor({ product: p }: { product: ProductRow }) {
  const save = (field: ProductField) => (value: string) => updateProductField(p.id, field, value);

  return (
    <div className="space-y-4">
      <ImageUploader image={p.image} alt={`Foto ${p.name}`} hint="JPG, PNG, atau WebP. Foto potret (4:5) paling pas. Wajib untuk tampil di katalog." upload={uploadProductImage.bind(null, p.id)} />

      <Card className="grid gap-3 sm:grid-cols-2">
        <InlineField label="Nama produk" value={p.name} onSave={save("name")} required maxLength={60} />
        <InlineField label="Keterangan" value={p.tagline} onSave={save("tagline")} maxLength={120} />
      </Card>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-brand-deep">Katalog</h3>
            <p className="text-sm font-semibold text-brand-dark">Buket jadi di bagian katalog toko.</p>
          </div>
          <ShowToggle id={p.id} where="catalog" on={p.showInCatalog} label="katalog" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineField label="Harga buket (Rp)" value={String(p.price)} onSave={save("price")} inputMode="numeric" />
          <InlineField label="Warna kartu" value={p.theme} onSave={save("theme")} type="select" options={opts(THEMES)} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-brand-deep">Rakit bunga</h3>
            <p className="text-sm font-semibold text-brand-dark">Pilihan jenis bunga saat pelanggan merakit buket sendiri.</p>
          </div>
          <ShowToggle id={p.id} where="builder" on={p.showInBuilder} label="rakit bunga" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineField label="Harga per tangkai (Rp)" value={String(p.pricePerStem)} onSave={save("pricePerStem")} inputMode="numeric" />
          <InlineField label="Bentuk kelopak" value={p.petalStyle} onSave={save("petalStyle")} type="select" options={opts(STYLES)} />
          <InlineField label="Palet warna kelopak" value={p.palette} onSave={save("palette")} type="select" options={opts(PALETTES)} />
        </div>
      </Card>

      <div className="flex justify-center pb-2">
        <ConfirmButton action={deleteProduct.bind(null, p.id)} confirmText="Yakin hapus produk?">Hapus produk</ConfirmButton>
      </div>
    </div>
  );
}
