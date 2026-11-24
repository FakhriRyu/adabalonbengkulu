// Konstanta dan hitungan pesanan. Murni (dipakai server dan browser), diuji di lib/orders.test.ts.

export const ORDER_STATUSES = ["baru", "diproses", "siap", "selesai", "batal"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  baru: "Baru",
  diproses: "Diproses",
  siap: "Siap diambil",
  selesai: "Selesai",
  batal: "Batal",
};

export const STATUS_TONE: Record<OrderStatus, "blue" | "peach" | "green" | "gray"> = {
  baru: "blue",
  diproses: "peach",
  siap: "green",
  selesai: "gray",
  batal: "gray",
};

/** Pesanan yang masih perlu dikerjakan. */
export const ACTIVE_STATUSES: OrderStatus[] = ["baru", "diproses", "siap"];

export const orderNo = (n: number) => `#${String(n).padStart(4, "0")}`;

/** "0812-3456-7890" / "+62 812..." -> "6281234567890"; null bila terlalu pendek. */
export function waNumber(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = `62${d.slice(1)}`;
  return d.length >= 10 ? d : null;
}

export interface PricedLine {
  qty: number;
  unitPrice: number;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const lineSubtotal = (l: PricedLine) => l.qty * l.unitPrice;
export const itemsSubtotal = (lines: PricedLine[]) => sum(lines.map(lineSubtotal));

/** "Ayesha Malik" -> "AM", "fatia" -> "F" */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

/** Indeks warna avatar (0..count-1); nama yang sama selalu dapat warna yang sama. */
export function avatarTone(name: string, count: number): number {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % count;
}

/** Ringkasan isi pesanan untuk daftar: item pertama, plus jumlah item lain. */
export function itemSummary(items: { description: string }[]): string {
  if (items.length === 0) return "Tanpa item";
  return items.length === 1 ? items[0].description : `${items[0].description} +${items.length - 1} lainnya`;
}
