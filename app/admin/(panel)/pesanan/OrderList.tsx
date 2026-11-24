"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/admin/BottomSheet";
import { STATUS_LABEL, STATUS_TONE, avatarTone, initials, itemSummary, orderNo } from "@/lib/orders";
import OrderDetail, { type ItemView, type OrderView } from "./OrderDetail";

/** Warna avatar pastel, dipilih dari nama pelanggan. */
const AVATAR_TONES = [
  "bg-peach-soft text-peach-deep",
  "bg-[#fdefc3] text-[#7a5a12]",
  "bg-sky-soft text-brand-deep",
  "bg-leaf-soft text-leaf-dark",
  "bg-[#fbe0ec] text-[#8a3a5c]",
];

const PILL = {
  blue: "bg-sky-soft text-brand-dark",
  peach: "bg-peach-soft text-peach-deep",
  green: "bg-leaf-soft text-leaf-dark",
  gray: "bg-cream text-brand-dark",
} as const;

export default function OrderList({ orders, items }: { orders: OrderView[]; items: Record<string, ItemView[]> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  // pesanan yang baru dihapus hilang dari daftar, panel ikut tertutup
  const selected = orders.find((o) => o.id === openId);

  return (
    <>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => setOpenId(o.id)}
              className="flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-soft transition-colors hover:bg-cream-light"
            >
              <span aria-hidden className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold ${AVATAR_TONES[avatarTone(o.customerName, AVATAR_TONES.length)]}`}>
                {initials(o.customerName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-extrabold text-brand-deep">{o.customerName}</span>
                <span className="block truncate text-sm font-semibold text-brand-dark/80">
                  {orderNo(o.no)} · {itemSummary(items[o.id] ?? [])}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full px-3.5 py-1.5 text-sm font-extrabold ${PILL[STATUS_TONE[o.status]]}`}>{STATUS_LABEL[o.status]}</span>
                {!o.isPaid && o.status !== "batal" && <span className="text-xs font-bold text-peach-deep">Belum lunas</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <BottomSheet open={Boolean(selected)} onClose={() => setOpenId(null)} title="Detail pesanan">
        {selected && <OrderDetail key={selected.id} order={selected} items={items[selected.id] ?? []} />}
      </BottomSheet>
    </>
  );
}
