import Link from "next/link";
import { and, asc, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { Search } from "lucide-react";
import { Card, PageHeader, inputClass } from "@/components/admin/ui";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/dal";
import { ACTIVE_STATUSES, ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import type { ItemView, OrderView } from "./OrderDetail";
import OrderList from "./OrderList";

export const metadata = { title: "Pesanan" };

const FILTERS = [{ id: "aktif", label: "Aktif" }, ...ORDER_STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] })), { id: "semua", label: "Semua" }];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = FILTERS.some((f) => f.id === sp.status) ? sp.status! : "aktif";
  const q = (sp.q ?? "").trim().slice(0, 60);
  const { orders, orderItems } = schema;

  const where: SQL[] = [];
  if (filter === "aktif") where.push(inArray(orders.status, ACTIVE_STATUSES));
  else if (filter !== "semua") where.push(eq(orders.status, filter as OrderStatus));
  if (q) {
    const no = Number(q.replace(/^#/, ""));
    const match = [ilike(orders.customerName, `%${q}%`), ilike(orders.customerPhone, `%${q}%`)];
    if (Number.isInteger(no) && no > 0) match.push(eq(orders.no, no));
    where.push(or(...match)!);
  }

  const rows = await getDb()
    .select()
    .from(orders)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(100);
  const itemRows = rows.length
    ? await getDb()
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, rows.map((o) => o.id)))
        .orderBy(asc(orderItems.sortOrder))
    : [];
  const itemsByOrder: Record<string, ItemView[]> = {};
  for (const it of itemRows) (itemsByOrder[it.orderId] ??= []).push(it);
  // hanya kolom yang dipakai panel detail, tanpa createdAt (Date)
  const orders_: OrderView[] = rows.map(({ createdAt: _, ...o }) => o);

  const href = (status: string) => `/admin/pesanan?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <PageHeader title="Pesanan" />

      <form role="search" className="mb-3 flex gap-2">
        <input type="hidden" name="status" value={filter} />
        <label className="sr-only" htmlFor="q">Cari pesanan</label>
        <input id="q" name="q" defaultValue={q} placeholder="Cari nama, no. HP, atau #nomor" className={inputClass} />
        <button type="submit" aria-label="Cari" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-deep text-white">
          <Search className="h-5 w-5" />
        </button>
      </form>

      <nav aria-label="Filter status" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={href(f.id)}
            aria-current={f.id === filter ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold ${f.id === filter ? "bg-brand-deep text-white" : "bg-white text-brand-deep hover:bg-sky-soft"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Card>
          <p className="font-semibold text-brand-dark">{q ? `Tidak ada pesanan yang cocok dengan "${q}".` : "Belum ada pesanan di sini."}</p>
        </Card>
      ) : (
        <OrderList orders={orders_} items={itemsByOrder} />
      )}
      {rows.length === 100 && <p className="mt-3 text-sm font-semibold text-brand-dark">Menampilkan 100 pesanan terbaru. Gunakan pencarian untuk yang lebih lama.</p>}
    </>
  );
}
