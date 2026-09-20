"use client";

import { LOGOLAR } from "@/data/logolar";

/**
 * Giriş panelinin arka planı: uygulamanın kendi kanal logolarından
 * oluşan bir kanal duvarı. Dış bir görsel kullanılmaz; karolar
 * uygulamadaki gerçek kanalların logolarıdır.
 */
export default function LogoDuvari({ karoSayisi = 96 }: { karoSayisi?: number }) {
  const yollar = Object.values(LOGOLAR);
  if (yollar.length === 0) return null;

  // Logolar sırayla tekrarlanarak duvar doldurulur (her açılışta aynı düzen)
  const karolar = Array.from({ length: karoSayisi }, (_, i) => yollar[i % yollar.length]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-neutral-950">
      <div className="grid h-full w-full grid-cols-10 content-center gap-[2px] p-[2px] sm:grid-cols-16 sm:gap-[3px] sm:p-[3px]">
        {karolar.map((yol, i) => (
          <span
            key={`${yol}-${i}`}
            className="grid aspect-square place-items-center overflow-hidden rounded-[3px] bg-white p-[2px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={yol} alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </span>
        ))}
      </div>
      {/* Oynat simgesi ve yazı okunaklı kalsın diye karartma */}
      <div className="absolute inset-0 bg-neutral-950/55" />
    </div>
  );
}
