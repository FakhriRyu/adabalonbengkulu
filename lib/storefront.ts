import "server-only";
import { cache } from "react";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { getDb, hasDatabase, schema } from "@/db";
import {
  CHROME_PETALS,
  FLOWER_TYPES,
  MAX_QTY,
  MIN_QTY,
  PASTEL_PETALS,
  RIBBON_COLORS,
  STEM_COLORS,
  type ColorOption,
  type FlowerType,
} from "@/data/builder";
import { PRODUCTS, type Product } from "@/data/products";

export interface Storefront {
  flowerTypes: FlowerType[];
  pastelPetals: ColorOption[];
  chromePetals: ColorOption[];
  stemColors: ColorOption[];
  ribbonColors: ColorOption[];
  products: Product[];
  minQty: number;
  maxQty: number;
}

const FALLBACK: Storefront = {
  flowerTypes: FLOWER_TYPES,
  pastelPetals: PASTEL_PETALS,
  chromePetals: CHROME_PETALS,
  stemColors: STEM_COLORS,
  ribbonColors: RIBBON_COLORS,
  products: PRODUCTS,
  minQty: MIN_QTY,
  maxQty: MAX_QTY,
};

/**
 * Data yang tampil ke pelanggan: produk yang ditampilkan di rakit bunga / katalog, dan warna ready.
 * Tanpa DATABASE_URL (pengembangan lokal sebelum database dihubungkan) memakai data awal di data/.
 */
export const getStorefront = cache(async (): Promise<Storefront> => {
  if (!hasDatabase()) return FALLBACK;

  const db = getDb();
  const { colors, products, settings } = schema;
  const byOrder = [asc(products.sortOrder), asc(products.createdAt)];
  const [typeRows, colorRows, productRows, settingRows] = await Promise.all([
    db.select().from(products).where(eq(products.showInBuilder, true)).orderBy(...byOrder),
    db.select().from(colors).where(eq(colors.isReady, true)).orderBy(asc(colors.sortOrder), asc(colors.createdAt)),
    // katalog butuh foto; produk tanpa foto tidak ditampilkan walau sakelarnya menyala
    db.select().from(products).where(and(eq(products.showInCatalog, true), isNotNull(products.image))).orderBy(...byOrder),
    db.select().from(settings),
  ]);

  const group = (g: (typeof colorRows)[number]["group"]): ColorOption[] =>
    colorRows
      .filter((c) => c.group === g)
      .map((c) => ({ id: c.id, name: c.name, hex: c.hex, light: c.light, surcharge: c.surcharge }));
  const pastelPetals = group("petal_pastel");
  const chromePetals = group("petal_chrome");

  const setting = (key: string, fallback: number) => {
    const n = Number(settingRows.find((s) => s.key === key)?.value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
  };
  const minQty = setting("min_qty", MIN_QTY);

  return {
    flowerTypes: typeRows
      .map((t) => ({
        id: t.id,
        name: t.name,
        desc: t.tagline,
        pricePerStem: t.pricePerStem,
        style: t.petalStyle,
        chrome: t.palette === "chrome",
      }))
      // jenis bunga yang semua warna kelopaknya habis tidak bisa dirakit, jadi tidak ditawarkan
      .filter((t) => (t.chrome ? chromePetals : pastelPetals).length > 0),
    pastelPetals,
    chromePetals,
    stemColors: group("stem"),
    ribbonColors: group("ribbon"),
    products: productRows.map((p) => ({ id: p.id, name: p.name, tagline: p.tagline, price: p.price, image: p.image!, theme: p.theme })),
    minQty,
    maxQty: Math.max(minQty, setting("max_qty", MAX_QTY)),
  };
});

export const canBuildBouquet = (s: Storefront) => s.flowerTypes.length > 0 && s.stemColors.length > 0 && s.ribbonColors.length > 0;
