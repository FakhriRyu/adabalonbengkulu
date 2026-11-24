import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { PageHeader, Tabs } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import ColorsTab from "./ColorsTab";
import ProductsTab from "./ProductsTab";
import SettingsTab from "./SettingsTab";

export const metadata = { title: "Produk" };

const TABS = [
  { id: "produk", label: "Produk" },
  { id: "warna", label: "Warna" },
  { id: "pengaturan", label: "Pengaturan" },
];

export default async function ProdukPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab } = await searchParams;
  const current = TABS.some((t) => t.id === tab) ? tab! : "produk";

  const db = getDb();
  const { colors, products, settings } = schema;
  const [productRows, colorRows, settingRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.createdAt)),
    db.select().from(colors).orderBy(asc(colors.sortOrder), asc(colors.createdAt)),
    db.select().from(settings),
  ]);

  return (
    <>
      <PageHeader title="Produk" description="Satu daftar untuk katalog dan rakit bunga. Perubahan langsung tampil di toko." />
      <Tabs tabs={TABS} current={current} basePath="/admin/produk" />
      {current === "produk" && <ProductsTab products={productRows} />}
      {current === "warna" && <ColorsTab colors={colorRows} />}
      {current === "pengaturan" && <SettingsTab settings={settingRows} />}
    </>
  );
}
