import { NextResponse } from "next/server";
import { CHANNELS } from "@/data/channels";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Kanal kaynaklarının ayakta olup olmadığını kontrol eder.
 * Bir cron ile düzenli çağrılıp kırılan yayınlar tespit edilebilir.
 * GET /api/health
 */
export async function GET() {
  const results = await Promise.all(
    CHANNELS.map(async (channel) => {
      if (channel.source.kind !== "hls") {
        // YouTube canlı yayınları oynatıcı tarafında çözülür
        return { id: channel.id, name: channel.name, kind: "youtube", status: "atlandi" as const };
      }
      try {
        const res = await fetch(channel.source.url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        });
        const body = res.ok ? await res.text() : "";
        const ok = res.ok && body.startsWith("#EXTM3U");
        return {
          id: channel.id,
          name: channel.name,
          kind: "hls",
          status: ok ? ("calisiyor" as const) : ("bozuk" as const),
          httpCode: res.status,
        };
      } catch (error) {
        return {
          id: channel.id,
          name: channel.name,
          kind: "hls",
          status: "bozuk" as const,
          error: error instanceof Error ? error.message : "bilinmeyen hata",
        };
      }
    }),
  );

  const bozuk = results.filter((r) => r.status === "bozuk");
  return NextResponse.json(
    {
      kontrolZamani: new Date().toISOString(),
      toplam: results.length,
      bozukSayisi: bozuk.length,
      kanallar: results,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
