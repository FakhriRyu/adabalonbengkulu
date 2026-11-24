-- Gabungkan jenis bunga ke tabel produk: satu daftar produk dengan dua tempat tampil
-- (katalog dan rakit bunga). Ditulis manual supaya data jenis bunga ikut pindah.

-- 1. Kolom baru di produk
ALTER TABLE "products" ALTER COLUMN "price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "image" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_in_builder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_per_stem" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "petal_style" "petal_style" DEFAULT 'simple' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "palette" "palette" DEFAULT 'pastel' NOT NULL;--> statement-breakpoint

-- 2. Pindahkan jenis bunga menjadi produk yang tampil di rakit saja (id tetap sama,
--    jadi item pesanan lama tetap tersambung). Urutannya diletakkan setelah produk katalog.
INSERT INTO "products" ("id", "name", "tagline", "image", "sort_order", "is_active", "price", "show_in_builder", "price_per_stem", "petal_style", "palette", "created_at")
SELECT
  "id", "name", "description", NULL,
  "sort_order" + (SELECT COALESCE(MAX("sort_order"), -1) + 1 FROM "products"),
  false, 0, "is_active", "price_per_stem", "petal_style", "palette", "created_at"
FROM "flower_types";--> statement-breakpoint

-- 3. Item pesanan "rakit" sekarang menunjuk ke produk
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_flower_type_id_flower_types_id_fk";--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_flower_type_id_products_id_fk" FOREIGN KEY ("flower_type_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- 4. Tabel lama tidak dipakai lagi
DROP TABLE "flower_types";
