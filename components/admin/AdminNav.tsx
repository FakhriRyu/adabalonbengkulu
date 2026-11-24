"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ExternalLink, Flower2, LayoutDashboard, LogOut, Plus, Wallet, type LucideIcon } from "lucide-react";
import { logout } from "@/app/admin/login/actions";
import { useNewOrder } from "./OrderSheet";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/admin/produk", label: "Produk", icon: Flower2 },
  { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

export default function AdminNav() {
  const pathname = usePathname();
  const openNewOrder = useNewOrder();

  const tab = ({ href, label, icon: Icon }: (typeof NAV)[number]) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold ${active ? "text-brand" : "text-brand-dark/70"}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r-2 border-sky-soft bg-white p-4 md:flex">
        <Image src="/images/logo.png" alt="Ada Balon Bengkulu" width={932} height={664} className="mx-auto h-16 w-auto" />
        {openNewOrder && (
          <button type="button" onClick={openNewOrder} className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peach-dark font-display font-extrabold text-white shadow-soft hover:bg-peach-deep">
            <Plus className="h-5 w-5" aria-hidden /> Pesanan baru
          </button>
        )}
        <nav aria-label="Menu admin" className="mt-4 flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold transition-colors ${
                  active ? "bg-brand text-white" : "text-brand-deep hover:bg-sky-pale"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-brand-dark hover:bg-sky-pale">
          <ExternalLink className="h-4 w-4" aria-hidden /> Lihat toko
        </Link>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-peach-deep hover:bg-peach-soft">
            <LogOut className="h-4 w-4" aria-hidden /> Keluar
          </button>
        </form>
      </aside>

      {/* HP: header atas + tab bawah */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-sky-soft bg-white px-4 py-2 md:hidden">
        <Image src="/images/logo.png" alt="Ada Balon Bengkulu" width={932} height={664} className="h-10 w-auto" />
        <div className="flex items-center gap-1">
          <Link href="/" target="_blank" aria-label="Lihat toko" className="flex h-11 w-11 items-center justify-center rounded-full text-brand-dark hover:bg-sky-pale">
            <ExternalLink className="h-5 w-5" />
          </Link>
          <form action={logout}>
            <button type="submit" aria-label="Keluar" className="flex h-11 w-11 items-center justify-center rounded-full text-peach-deep hover:bg-peach-soft">
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>
      <nav aria-label="Menu admin" className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-sky-soft bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.slice(0, 2).map(tab)}
        {openNewOrder && (
          <div className="flex flex-1 items-start justify-center">
            <button
              type="button"
              onClick={openNewOrder}
              aria-label="Pesanan baru"
              className="-mt-5 flex h-12 w-[4.5rem] items-center justify-center rounded-full bg-peach-dark text-white shadow-[0_8px_18px_-4px_rgba(169,80,59,0.6)] ring-4 ring-white transition-transform hover:bg-peach-deep active:scale-95"
            >
              <Plus className="h-7 w-7" strokeWidth={2.75} aria-hidden />
            </button>
          </div>
        )}
        {NAV.slice(2).map(tab)}
      </nav>
    </>
  );
}
