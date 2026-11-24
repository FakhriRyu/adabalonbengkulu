import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Semua nilai uang disimpan sebagai integer rupiah.

export const petalStyle = pgEnum("petal_style", ["simple", "curly", "plain"]);
export const palette = pgEnum("palette", ["pastel", "chrome"]);
export const colorGroup = pgEnum("color_group", ["petal_pastel", "petal_chrome", "stem", "ribbon"]);
export const productTheme = pgEnum("product_theme", ["blue", "pink", "teal"]);
export const orderStatus = pgEnum("order_status", ["baru", "diproses", "siap", "selesai", "batal"]);
export const transactionType = pgEnum("transaction_type", ["masuk", "keluar"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const flowerTypes = pgTable("flower_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pricePerStem: integer("price_per_stem").notNull(),
  petalStyle: petalStyle("petal_style").notNull().default("simple"),
  palette: palette("palette").notNull().default("pastel"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const colors = pgTable(
  "colors",
  {
    id: text("id").primaryKey(),
    group: colorGroup("group").notNull(),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    /** warna terang butuh garis kontras di swatch */
    light: boolean("light").notNull().default(false),
    /** tambahan harga per tangkai */
    surcharge: integer("surcharge").notNull().default(0),
    isReady: boolean("is_ready").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("colors_group_idx").on(t.group)],
);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  theme: productTheme("theme").notNull().default("blue"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    /** nomor urut yang ditampilkan ke admin, mis. #0012 */
    no: serial("no").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull().default(""),
    orderDate: date("order_date").notNull(),
    pickupDate: date("pickup_date"),
    status: orderStatus("status").notNull().default("baru"),
    /** total yang dibayar pelanggan (jumlah harga item) */
    total: integer("total").notNull(),
    isPaid: boolean("is_paid").notNull().default(false),
    paidAt: date("paid_at"),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_paid_at_idx").on(t.paidAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    flowerTypeId: text("flower_type_id").references(() => flowerTypes.id, { onDelete: "set null" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    qty: integer("qty").notNull(),
    /** snapshot harga jual per unit saat pesanan dibuat */
    unitPrice: integer("unit_price").notNull(),
    petalColor: text("petal_color"),
    stemColor: text("stem_color"),
    ribbonColor: text("ribbon_color"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    date: date("date").notNull(),
    type: transactionType("type").notNull(),
    category: text("category").notNull(),
    amount: integer("amount").notNull(),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("transactions_date_idx").on(t.date)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    ip: text("ip").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("login_attempts_ip_idx").on(t.ip, t.createdAt)],
);
