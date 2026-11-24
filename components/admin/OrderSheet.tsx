"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { createOrder } from "@/app/admin/(panel)/pesanan/actions";
import OrderForm, { type OrderOptions } from "@/app/admin/(panel)/pesanan/OrderForm";
import { BottomSheet } from "./BottomSheet";

const OpenContext = createContext<(() => void) | null>(null);

/** Membuka panel "Pesanan baru" dari mana saja di admin. null bila database belum siap. */
export const useNewOrder = () => useContext(OpenContext);

/** Menyediakan panel "Pesanan baru" untuk seluruh halaman admin. */
export function OrderSheetProvider({ options, children }: { options: OrderOptions | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // diganti setelah tersimpan supaya form berikutnya mulai kosong
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState<{ id: string; label: string } | null>(null);
  const openSheet = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), 6000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <OpenContext.Provider value={options ? openSheet : null}>
      {children}
      {options && (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Pesanan baru">
          <OrderForm
            key={formKey}
            action={createOrder}
            options={options}
            onSuccess={(r) => {
              setOpen(false);
              setFormKey((k) => k + 1);
              if (r.created) setSaved(r.created);
            }}
          />
        </BottomSheet>
      )}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6">
        {saved && (
          <p className="pointer-events-auto flex items-center gap-3 rounded-full bg-brand-deep py-2 pl-4 pr-2 font-bold text-white shadow-soft">
            <CircleCheck className="h-5 w-5 shrink-0 text-leaf-soft" aria-hidden />
            {saved.label} tersimpan
            <Link href={`/admin/pesanan/${saved.id}`} onClick={() => setSaved(null)} className="inline-flex min-h-9 items-center rounded-full bg-white px-3 text-sm font-extrabold text-brand-deep hover:bg-sky-soft">
              Lihat
            </Link>
          </p>
        )}
      </div>
    </OpenContext.Provider>
  );
}

