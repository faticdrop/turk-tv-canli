"use client";

import { useEffect, useRef } from "react";
import { initials, type Channel } from "@/data/channels";
import type { Akis } from "@/lib/epg";

/**
 * Tam ekranda videonun üzerinde açılan, yatay kaydırılabilir kanal şeridi.
 * Dokunmatik cihazlarda parmakla sağa/sola kaydırılır.
 */
export default function KanalSeridi({
  kanallar,
  activeId,
  gorunur,
  epg,
  onSec,
}: {
  kanallar: Channel[];
  activeId: string;
  gorunur: boolean;
  epg?: Record<string, Akis>;
  onSec: (id: string) => void;
}) {
  const seritRef = useRef<HTMLDivElement>(null);

  // Şerit açıldığında seçili kanal görünür olsun
  useEffect(() => {
    if (!gorunur) return;
    seritRef.current
      ?.querySelector('[data-secili="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [gorunur, activeId]);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 transition-all duration-200 ${
        gorunur ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10">
        <div
          ref={seritRef}
          className="serit flex snap-x snap-mandatory gap-2 overflow-x-auto px-3"
        >
          {kanallar.map((c) => {
            const secili = c.id === activeId;
            return (
              <button
                key={c.id}
                data-secili={secili}
                onClick={() => onSec(c.id)}
                className={`w-[104px] shrink-0 snap-center rounded-lg p-2 text-left transition ${
                  secili ? "bg-white/25 ring-1 ring-white/50" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <span
                  className="mb-1.5 grid h-11 w-full place-items-center rounded-md text-sm font-bold"
                  style={{ backgroundColor: c.color }}
                >
                  {initials(c.name)}
                </span>
                <span className="block truncate text-[11px] font-medium text-white">
                  {c.name}
                </span>
                <span className="block truncate text-[10px] text-white/50">
                  {epg?.[c.id]?.simdi?.ad ?? c.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
