"use server";

import { del, put } from "@vercel/blob";
import { count, eq, max } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { emptyToNull, fail, invalid, ok, optionalText, refresh, requiredText, rupiah, type ActionState } from "@/lib/admin/action";
import { requireAdmin } from "@/lib/auth/dal";
import { isHex, isLightHex } from "@/lib/format";

const { flowerTypes, colors, products, settings, orderItems } = schema;

const optionalId = z.preprocess(emptyToNull, z.string().nullable().default(null));

// ---------- Jenis bunga ----------

const flowerTypeSchema = z.object({
  id: optionalId,
  name: requiredText("Nama", 60),
  description: optionalText("Deskripsi", 120),
  pricePerStem: rupiah("Harga per tangkai"),
  petalStyle: z.enum(schema.petalStyle.enumValues, { error: "Pilih bentuk kelopak." }),
  palette: z.enum(schema.palette.enumValues, { error: "Pilih palet warna." }),
});

export async function saveFlowerType(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = flowerTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  const db = getDb();

  if (id) {
    await db.update(flowerTypes).set(values).where(eq(flowerTypes.id, id));
  } else {
    const [{ last }] = await db.select({ last: max(flowerTypes.sortOrder) }).from(flowerTypes);
    await db.insert(flowerTypes).values({ id: crypto.randomUUID(), ...values, sortOrder: (last ?? -1) + 1 });
  }
  refresh();
  return ok;
}

export async function setFlowerTypeActive(id: string, isActive: boolean): Promise<ActionState> {
  await requireAdmin();
  await getDb().update(flowerTypes).set({ isActive }).where(eq(flowerTypes.id, id));
  refresh();
  return ok;
}

export async function deleteFlowerType(id: string): Promise<ActionState> {
  await requireAdmin();
  const db = getDb();
  const [{ used }] = await db.select({ used: count() }).from(orderItems).where(eq(orderItems.flowerTypeId, id));
  if (used > 0) return fail("Jenis bunga ini sudah dipakai di pesanan. Nonaktifkan saja supaya riwayat tetap utuh.");
  await db.delete(flowerTypes).where(eq(flowerTypes.id, id));
  refresh();
  return ok;
}

// ---------- Warna ----------

const colorSchema = z.object({
  id: optionalId,
  group: z.enum(schema.colorGroup.enumValues, { error: "Grup warna tidak dikenal." }),
  name: requiredText("Nama warna", 40),
  hex: z.string().refine(isHex, "Kode warna harus berformat #rrggbb."),
  surcharge: z.preprocess((v) => (v === undefined ? "0" : v), rupiah("Tambahan harga", 1_000_000)),
});

export async function saveColor(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = colorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, group, ...rest } = parsed.data;
  // pita gratis: tidak pernah ada tambahan harga
  const values = { ...rest, hex: rest.hex.toLowerCase(), light: isLightHex(rest.hex), surcharge: group === "ribbon" ? 0 : rest.surcharge };
  const db = getDb();

  if (id) {
    await db.update(colors).set(values).where(eq(colors.id, id));
  } else {
    const [{ last }] = await db.select({ last: max(colors.sortOrder) }).from(colors).where(eq(colors.group, group));
    await db.insert(colors).values({ id: crypto.randomUUID(), group, ...values, sortOrder: (last ?? -1) + 1 });
  }
  refresh();
  return ok;
}

export async function setColorReady(id: string, isReady: boolean): Promise<ActionState> {
  await requireAdmin();
  await getDb().update(colors).set({ isReady }).where(eq(colors.id, id));
  refresh();
  return ok;
}

export async function deleteColor(id: string): Promise<ActionState> {
  await requireAdmin();
  await getDb().delete(colors).where(eq(colors.id, id));
  refresh();
  return ok;
}

// ---------- Katalog ----------

/** Isian produk yang bisa diubah langsung di panel detail produk. */
const productFields = {
  name: requiredText("Nama produk", 60),
  tagline: optionalText("Keterangan", 120),
  price: rupiah("Harga"),
  theme: z.enum(schema.productTheme.enumValues, { error: "Pilih warna kartu." }),
};
export type ProductField = keyof typeof productFields;

export async function updateProductField(id: string, field: ProductField, value: string): Promise<ActionState> {
  await requireAdmin();
  if (!Object.hasOwn(productFields, field)) return fail("Isian tidak dikenal.");
  const parsed = productFields[field].safeParse(value);
  if (!parsed.success) return invalid(parsed.error);
  const [row] = await getDb().update(products).set({ [field]: parsed.data }).where(eq(products.id, id)).returning({ id: products.id });
  if (!row) return fail("Produk tidak ditemukan.");
  refresh();
  return ok;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const isBlobUrl = (url: string) => /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url);

/** Ganti foto produk. Foto disimpan di Vercel Blob; foto lama yang juga di Blob ikut dihapus. */
export async function uploadProductImage(id: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return fail("Penyimpanan foto belum disiapkan. Hubungkan Vercel Blob ke project ini dulu.");
  }
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return fail("Pilih foto dulu.");
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return fail("Foto harus JPG, PNG, atau WebP.");
  if (file.size > MAX_IMAGE_BYTES) return fail("Ukuran foto maksimal 4 MB.");

  const db = getDb();
  const [current] = await db.select({ image: products.image }).from(products).where(eq(products.id, id));
  if (!current) return fail("Produk tidak ditemukan.");

  const blob = await put(`produk/${id}.${ext}`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
  await db.update(products).set({ image: blob.url }).where(eq(products.id, id));
  if (isBlobUrl(current.image)) await del(current.image).catch(() => {});
  refresh();
  return ok;
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionState> {
  await requireAdmin();
  await getDb().update(products).set({ isActive }).where(eq(products.id, id));
  refresh();
  return ok;
}

// ---------- Pengaturan ----------

const qty = (label: string) => z.coerce.number({ error: `${label} harus berupa angka.` }).int().min(1, `${label} minimal 1.`).max(100, `${label} maksimal 100.`);
const settingsSchema = z
  .object({ minQty: qty("Jumlah minimal"), maxQty: qty("Jumlah maksimal") })
  .refine((v) => v.minQty <= v.maxQty, "Jumlah minimal tidak boleh lebih besar dari jumlah maksimal.");

export async function saveSettings(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const upsert = (key: string, value: number) =>
    db
      .insert(settings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
  await db.batch([upsert("min_qty", parsed.data.minQty), upsert("max_qty", parsed.data.maxQty)]);
  refresh();
  return ok;
}
