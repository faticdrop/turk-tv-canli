import { NextResponse } from "next/server";
import { CHANNELS } from "@/data/channels";
import { EPG_SLUG } from "@/data/epg-kaynak";
import { akisGetir, simdiVeSirada } from "@/lib/epg";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GECERLI = new Set(CHANNELS.map((c) => c.id));

/** Aynı anda kaç kanal getirileceği (kaynak siteyi yormamak için). */
const ESZAMANLI = 4;

async function sirayla<T, R>(
  ogeler: T[],
  limit: number,
  isle: (o: T) => Promise<R>,
): Promise<R[]> {
  const sonuc: R[] = [];
  for (let i = 0; i < ogeler.length; i += limit) {
    sonuc.push(...(await Promise.all(ogeler.slice(i, i + limit).map(isle))));
  }
  return sonuc;
}

/**
 * GET /api/epg            -> EPG kaynağı olan tüm kanallar
 * GET /api/epg?ch=trt1    -> tek kanal (virgülle birden fazla olabilir)
 *
 * Yalnızca program adı ve saati döner.
 */
export async function GET(request: Request) {
  const istenen = new URL(request.url).searchParams.get("ch");

  const kanallar = istenen
    ? istenen.split(",").filter((id) => GECERLI.has(id) && EPG_SLUG[id])
    : CHANNELS.filter((c) => EPG_SLUG[c.id]).map((c) => c.id);

  const simdiki = Date.now();
  const girdiler = await sirayla(kanallar, ESZAMANLI, async (id) => {
    const akis = simdiVeSirada(await akisGetir(id), simdiki);
    return [id, akis] as const;
  });

  return NextResponse.json(
    { zaman: new Date(simdiki).toISOString(), kanallar: Object.fromEntries(girdiler) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
