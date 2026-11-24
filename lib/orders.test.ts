import assert from "node:assert/strict";
import { test } from "node:test";
import { avatarTone, initials, itemSummary, itemsSubtotal, orderNo, waNumber } from "./orders.ts";

const lines = [
  { qty: 5, unitPrice: 20000 }, // buket 5 tangkai
  { qty: 2, unitPrice: 15000 }, // 2 produk katalog
];

test("total pesanan = jumlah harga item", () => {
  assert.equal(itemsSubtotal(lines), 130000);
});

test("orderNo diberi nol di depan", () => {
  assert.equal(orderNo(12), "#0012");
  assert.equal(orderNo(12345), "#12345");
});

test("waNumber menormalkan nomor Indonesia", () => {
  assert.equal(waNumber("0812-3456-7890"), "6281234567890");
  assert.equal(waNumber("+62 812 3456 7890"), "6281234567890");
  assert.equal(waNumber("123"), null);
  assert.equal(waNumber(""), null);
});

test("initials dari nama pelanggan", () => {
  assert.equal(initials("Ayesha Malik"), "AM");
  assert.equal(initials("  fatia "), "F");
  assert.equal(initials("Siti Nur Aisyah"), "SN");
  assert.equal(initials(""), "?");
});

test("avatarTone tetap untuk nama yang sama", () => {
  assert.equal(avatarTone("Fiqri", 5), avatarTone(" fiqri ", 5));
  assert.ok(avatarTone("Aini", 5) < 5);
});

test("itemSummary meringkas isi pesanan", () => {
  assert.equal(itemSummary([]), "Tanpa item");
  assert.equal(itemSummary([{ description: "Kelopak Simple · 3 tangkai" }]), "Kelopak Simple · 3 tangkai");
  assert.equal(itemSummary([{ description: "A" }, { description: "B" }, { description: "C" }]), "A +2 lainnya");
});
