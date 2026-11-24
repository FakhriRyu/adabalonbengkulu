ALTER TABLE "materials" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipe_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "materials" CASCADE;--> statement-breakpoint
DROP TABLE "recipe_items" CASCADE;--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_flower_type_id_flower_types_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "unit_cost";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "extra_cost";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "flower_type_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stem_count";--> statement-breakpoint
DROP TYPE "public"."recipe_scope";