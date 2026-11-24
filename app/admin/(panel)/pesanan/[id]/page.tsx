import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/dal";
import { orderNo } from "@/lib/orders";
import OrderDetail from "../OrderDetail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [o] = await getDb().select({ no: schema.orders.no }).from(schema.orders).where(eq(schema.orders.id, id));
  return { title: o ? `Pesanan ${orderNo(o.no)}` : "Pesanan" };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const [[order], items] = await Promise.all([
    db.select().from(schema.orders).where(eq(schema.orders.id, id)),
    db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id)).orderBy(asc(schema.orderItems.sortOrder)),
  ]);
  if (!order) notFound();

  const { createdAt: _, ...view } = order;

  return (
    <div className="space-y-4">
      <Link href="/admin/pesanan" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-brand hover:text-brand-dark">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Semua pesanan
      </Link>
      <OrderDetail order={view} items={items} />
    </div>
  );
}
