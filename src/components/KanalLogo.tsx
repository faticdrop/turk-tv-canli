"use client";

import { useState } from "react";
import { initials, type Channel } from "@/data/channels";
import { LOGOLAR } from "@/data/logolar";

/**
 * Kanal karosu: varsa yayıncının resmî logosu, yoksa kanal renginde
 * baş harf döşemesi. Logolar çoğunlukla şeffaf zeminli ve koyu renkli
 * olduğundan açık bir zemin üzerine yerleştirilir.
 */
export default function KanalLogo({
  channel,
  className = "",
}: {
  channel: Channel;
  className?: string;
}) {
  const [hata, setHata] = useState(false);
  const logo = LOGOLAR[channel.id];

  if (!logo || hata) {
    return (
      <span
        className={`grid place-items-center overflow-hidden text-xs font-bold tracking-wide text-white ${className}`}
        style={{ backgroundColor: channel.color }}
      >
        {initials(channel.name)}
      </span>
    );
  }

  return (
    <span className={`grid place-items-center overflow-hidden bg-white p-1 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={channel.name}
        loading="lazy"
        decoding="async"
        onError={() => setHata(true)}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
