import "server-only";
import { asc } from "drizzle-orm";
import type { OrderOptions } from "@/app/admin/(panel)/pesanan/OrderForm";
import { getDb, hasDatabase, schema } from "@/db";
import { todayWIB } from "@/lib/dates";

/** Pilihan produk rakit, warna, dan produk katalog untuk form pesanan baru. null bila database belum bisa dibaca. */
export async function loadOrderOptions(): Promise<OrderOptions | null> {
  if (!hasDatabase()) return null;
  const db = getDb();
  const { colors, products } = schema;
  try {
    const [productRows, colorRows] = await Promise.all([
      db.select().from(products).orderBy(asc(products.sortOrder), asc(products.createdAt)),
      db.select().from(colors).orderBy(asc(colors.sortOrder), asc(colors.createdAt)),
    ]);
    return {
      today: todayWIB(),
      types: productRows
        .filter((p) => p.showInBuilder)
        .map((p) => ({ id: p.id, name: p.name, pricePerStem: p.pricePerStem, chrome: p.palette === "chrome" })),
      colors: colorRows.map((c) => ({ id: c.id, name: c.name, hex: c.hex, surcharge: c.surcharge, group: c.group, isReady: c.isReady })),
      products: productRows.filter((p) => p.showInCatalog).map((p) => ({ id: p.id, name: p.name, price: p.price })),
    };
  } catch {
    return null;
  }
}
