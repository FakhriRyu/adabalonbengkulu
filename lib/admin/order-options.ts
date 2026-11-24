import "server-only";
import { asc } from "drizzle-orm";
import type { OrderOptions } from "@/app/admin/(panel)/pesanan/OrderForm";
import { getDb, hasDatabase, schema } from "@/db";
import { todayWIB } from "@/lib/dates";

/** Pilihan jenis bunga, warna, dan produk untuk form pesanan baru. null bila database belum bisa dibaca. */
export async function loadOrderOptions(): Promise<OrderOptions | null> {
  if (!hasDatabase()) return null;
  const db = getDb();
  const { flowerTypes, colors, products } = schema;
  try {
    const [typeRows, colorRows, productRows] = await Promise.all([
      db.select().from(flowerTypes).orderBy(asc(flowerTypes.sortOrder), asc(flowerTypes.createdAt)),
      db.select().from(colors).orderBy(asc(colors.sortOrder), asc(colors.createdAt)),
      db.select().from(products).orderBy(asc(products.sortOrder), asc(products.createdAt)),
    ]);
    return {
      today: todayWIB(),
      types: typeRows
        .filter((t) => t.isActive)
        .map((t) => ({ id: t.id, name: t.name, pricePerStem: t.pricePerStem, chrome: t.palette === "chrome" })),
      colors: colorRows.map((c) => ({ id: c.id, name: c.name, hex: c.hex, surcharge: c.surcharge, group: c.group, isReady: c.isReady })),
      products: productRows.map((p) => ({ id: p.id, name: p.name, price: p.price })),
    };
  } catch {
    return null;
  }
}
