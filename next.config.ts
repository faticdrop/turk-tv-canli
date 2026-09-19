import type { NextConfig } from "next";

/**
 * Aynı Wi-Fi'daki cihazlardan (telefon/tablet) geliştirme sunucusuna erişim.
 * Kendi yerel IP'nizi verin:  NEXT_DEV_ORIGIN=192.168.1.20 npm run dev
 * Yalnızca dev sunucusunu ilgilendirir, üretim davranışını etkilemez.
 */
const yerelAdres = process.env.NEXT_DEV_ORIGIN;

const nextConfig: NextConfig = {
  allowedDevOrigins: yerelAdres ? [yerelAdres] : [],
};

export default nextConfig;
