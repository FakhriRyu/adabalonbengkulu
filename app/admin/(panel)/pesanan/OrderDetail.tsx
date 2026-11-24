"use client";

import { MessageCircle } from "lucide-react";
import { ConfirmButton, ToggleButton } from "@/components/admin/forms";
import { Badge, Card } from "@/components/admin/ui";
import { formatRupiah } from "@/data/products";
import { formatDate } from "@/lib/dates";
import { ORDER_STATUSES, STATUS_LABEL, STATUS_TONE, orderNo, waNumber, type OrderStatus } from "@/lib/orders";
import InlineField from "@/components/admin/InlineField";
import { deleteOrder, setOrderPaid, setOrderStatus, updateOrderField, type OrderField } from "./actions";
import StatusButton from "./StatusButton";

export interface OrderView {
  id: string;
  no: number;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  pickupDate: string | null;
  status: OrderStatus;
  total: number;
  isPaid: boolean;
  paidAt: string | null;
  note: string;
}

export interface ItemView {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  petalColor: string | null;
  stemColor: string | null;
  ribbonColor: string | null;
}

/** Isi detail pesanan; data pelanggan bisa diubah langsung di tempat. Dipakai di panel bawah dan halaman detail. */
export default function OrderDetail({ order, items }: { order: OrderView; items: ItemView[] }) {
  const wa = waNumber(order.customerPhone);
  const save = (field: OrderField) => (value: string) => updateOrderField(order.id, field, value);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm font-extrabold text-brand-dark">{orderNo(order.no)} · dipesan {formatDate(order.orderDate)}</p>
        <p className="font-display text-3xl font-extrabold text-brand-deep">{order.customerName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          <Badge tone={order.isPaid ? "green" : "peach"}>{order.isPaid ? `Lunas ${order.paidAt ? formatDate(order.paidAt, { day: "numeric", month: "short" }) : ""}` : "Belum lunas"}</Badge>
          {order.pickupDate && <span className="text-sm font-bold text-brand-dark">Ambil {formatDate(order.pickupDate, { weekday: "long", day: "numeric", month: "long" })}</span>}
        </div>
        {wa && (
          <a href={`https://api.whatsapp.com/send?phone=${wa}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-leaf px-4 font-bold text-white hover:bg-leaf-dark">
            <MessageCircle className="h-4 w-4" aria-hidden /> Chat {order.customerPhone}
          </a>
        )}
      </header>

      <Card>
        <h3 className="mb-3 text-lg font-extrabold text-brand-deep">Status</h3>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <StatusButton key={s} action={setOrderStatus.bind(null, order.id, s)} active={order.status === s} label={STATUS_LABEL[s]} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-sky-pale pt-4">
          <span className="font-bold text-brand-deep">Pembayaran</span>
          <ToggleButton action={setOrderPaid.bind(null, order.id, !order.isPaid)} on={order.isPaid} onLabel="Lunas" offLabel="Belum lunas" label="Pembayaran" />
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-lg font-extrabold text-brand-deep">Item</h3>
        <ul className="divide-y-2 divide-sky-pale">
          {items.map((it) => (
            <li key={it.id} className="py-3">
              <div className="flex justify-between gap-3">
                <span className="font-bold text-brand-deep">{it.description}</span>
                <span className="shrink-0 font-extrabold text-brand-deep">{formatRupiah(it.qty * it.unitPrice)}</span>
              </div>
              <p className="text-sm font-semibold text-brand-dark">
                {it.qty} × {formatRupiah(it.unitPrice)}
                {it.petalColor && ` · kelopak ${it.petalColor}, tangkai ${it.stemColor}, pita ${it.ribbonColor}`}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex justify-between rounded-xl bg-cream p-4 font-display text-2xl font-extrabold text-brand-deep">
          <dt>Total</dt><dd className="text-peach-deep">{formatRupiah(order.total)}</dd>
        </dl>
      </Card>

      <Card>
        <h3 className="mb-1 text-lg font-extrabold text-brand-deep">Data pesanan</h3>
        <p className="mb-3 text-sm font-semibold text-brand-dark">Ubah langsung, tersimpan otomatis.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineField label="Nama" value={order.customerName} onSave={save("customerName")} required maxLength={80} />
          <InlineField label="No. HP / WhatsApp" value={order.customerPhone} onSave={save("customerPhone")} type="tel" maxLength={30} placeholder="08xx" />
          <InlineField label="Tanggal pesan" value={order.orderDate} onSave={save("orderDate")} type="date" required />
          <InlineField label="Tanggal ambil / kirim" value={order.pickupDate ?? ""} onSave={save("pickupDate")} type="date" />
          <InlineField label="Catatan" value={order.note} onSave={save("note")} type="textarea" maxLength={500} placeholder="Tulisan kartu ucapan, alamat kirim, dll." className="sm:col-span-2" />
        </div>
      </Card>

      <div className="flex justify-center pb-2">
        <ConfirmButton action={deleteOrder.bind(null, order.id)} confirmText="Yakin hapus pesanan?">Hapus pesanan</ConfirmButton>
      </div>
    </div>
  );
}
