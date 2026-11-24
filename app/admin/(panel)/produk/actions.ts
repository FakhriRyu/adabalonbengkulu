"use server";

import { count, eq, max, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { emptyToNull, fail, invalid, ok, optionalText, refresh, requiredText, rupiah, type ActionState } from "@/lib/admin/action";
import { removeImage, storeImage } from "@/lib/admin/blob";
import { requireAdmin } from "@/lib/auth/dal";
import { isHex, isLightHex } from "@/lib/format";

const { colors, products, settings, orderItems } = schema;

const optionalId = z.preprocess(emptyToNull, z.string().nullable().default(null));

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

// ---------- Produk (katalog + rakit bunga) ----------

/** Tambah produk baru. Belum tampil di mana pun sampai sakelarnya dinyalakan di panel detail. */
export async function createProduct(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ name: requiredText("Nama produk", 60), tagline: optionalText("Keterangan", 120) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const [{ last }] = await db.select({ last: max(products.sortOrder) }).from(products);
  const id = crypto.randomUUID();
  await db.insert(products).values({ id, ...parsed.data, sortOrder: (last ?? -1) + 1 });
  refresh();
  return { ok: true, created: { id, label: parsed.data.name } };
}

/** Isian produk yang bisa diubah langsung di panel detail produk. */
const productFields = {
  name: requiredText("Nama produk", 60),
  tagline: optionalText("Keterangan", 120),
  price: rupiah("Harga buket"),
  theme: z.enum(schema.productTheme.enumValues, { error: "Pilih warna kartu." }),
  pricePerStem: rupiah("Harga per tangkai"),
  petalStyle: z.enum(schema.petalStyle.enumValues, { error: "Pilih bentuk kelopak." }),
  palette: z.enum(schema.palette.enumValues, { error: "Pilih palet warna." }),
};
export type ProductField = keyof typeof productFields;

export async function updateProductField(id: string, field: ProductField, value: string): Promise<ActionState> {
  await requireAdmin();
  if (!Object.hasOwn(productFields, field)) return fail("Isian tidak dikenal.");
  const parsed = productFields[field].safeParse(value);
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const [p] = await db.select().from(products).where(eq(products.id, id));
  if (!p) return fail("Produk tidak ditemukan.");
  // harga yang sedang dipakai di toko tidak boleh jadi 0
  if (field === "price" && parsed.data === 0 && p.showInCatalog) return fail("Harga buket tidak boleh 0 selama tampil di katalog.");
  if (field === "pricePerStem" && parsed.data === 0 && p.showInBuilder) return fail("Harga per tangkai tidak boleh 0 selama tampil di rakit bunga.");
  await db.update(products).set({ [field]: parsed.data }).where(eq(products.id, id));
  refresh();
  return ok;
}

/** Nyalakan/matikan tampil di katalog atau rakit bunga. Syarat tiap tempat dicek dulu. */
export async function setProductShown(id: string, where: "catalog" | "builder", show: boolean): Promise<ActionState> {
  await requireAdmin();
  const db = getDb();
  const [p] = await db.select().from(products).where(eq(products.id, id));
  if (!p) return fail("Produk tidak ditemukan.");
  if (show && where === "catalog") {
    if (!p.image) return fail("Unggah foto dulu sebelum tampil di katalog.");
    if (p.price <= 0) return fail("Isi harga buket dulu sebelum tampil di katalog.");
  }
  if (show && where === "builder" && p.pricePerStem <= 0) return fail("Isi harga per tangkai dulu sebelum tampil di rakit bunga.");
  await db
    .update(products)
    .set(where === "catalog" ? { showInCatalog: show } : { showInBuilder: show })
    .where(eq(products.id, id));
  refresh();
  return ok;
}

/** Ganti foto produk. Foto disimpan di Vercel Blob; foto lama yang juga di Blob ikut dihapus. */
export async function uploadProductImage(id: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const db = getDb();
  const [current] = await db.select({ image: products.image }).from(products).where(eq(products.id, id));
  if (!current) return fail("Produk tidak ditemukan.");
  const stored = await storeImage("produk", id, formData);
  if ("error" in stored) return fail(stored.error);
  await db.update(products).set({ image: stored.url }).where(eq(products.id, id));
  await removeImage(current.image);
  refresh();
  return ok;
}

export async function deleteProduct(id: string): Promise<ActionState> {
  await requireAdmin();
  const db = getDb();
  const [{ used }] = await db
    .select({ used: count() })
    .from(orderItems)
    .where(or(eq(orderItems.flowerTypeId, id), eq(orderItems.productId, id)));
  if (used > 0) return fail("Produk ini sudah dipakai di pesanan. Matikan sakelar tampilnya saja supaya riwayat tetap utuh.");
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ image: products.image });
  await removeImage(deleted?.image);
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
