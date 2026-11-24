// Ringkasan keuangan bulanan. Murni, diuji di lib/finance.test.ts.

export interface PaidOrder {
  total: number;
}

export interface Txn {
  type: "masuk" | "keluar";
  amount: number;
}

export interface MonthSummary {
  /** pesanan yang lunas di bulan ini */
  orderIncome: number;
  otherIncome: number;
  expense: number;
  /** arus kas bersih: semua masuk dikurangi semua keluar */
  net: number;
  paidOrders: number;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function summarize(paidOrders: PaidOrder[], txns: Txn[]): MonthSummary {
  const orderIncome = sum(paidOrders.map((o) => o.total));
  const otherIncome = sum(txns.filter((t) => t.type === "masuk").map((t) => t.amount));
  const expense = sum(txns.filter((t) => t.type === "keluar").map((t) => t.amount));
  return {
    orderIncome,
    otherIncome,
    expense,
    net: orderIncome + otherIncome - expense,
    paidOrders: paidOrders.length,
  };
}
