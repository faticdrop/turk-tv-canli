import { EPG_SLUG } from "@/data/epg-kaynak";

export interface Program {
  ad: string;
  baslangic: string; // ISO
  bitis: string; // ISO
}

export interface Akis {
  simdi: Program | null;
  sirada: Program | null;
  /** Şu anki programın ne kadarının geçtiği, 0-100 */
  ilerleme: number | null;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const TTL_MS = 30 * 60 * 1000;
const bellek = new Map<string, { programlar: Program[]; at: number }>();
/** Aynı kanal için eşzamanlı istekler tek getirmeyi paylaşsın */
const ucusta = new Map<string, Promise<Program[]>>();

/** Sayfadaki schema.org ItemList'ten yayın akışını çıkarır. */
function ayristir(html: string): Program[] {
  const bloklar = html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  );
  for (const blok of bloklar) {
    let veri: unknown;
    try {
      veri = JSON.parse(blok[1]);
    } catch {
      continue;
    }
    const kokler = Array.isArray(veri)
      ? veri
      : ((veri as { "@graph"?: unknown[] })?.["@graph"] ?? [veri]);

    for (const dugum of kokler as Array<Record<string, unknown>>) {
      if (dugum?.["@type"] !== "ItemList") continue;
      const ogeler = (dugum.itemListElement ?? []) as Array<{
        item?: { name?: string; startDate?: string; endDate?: string };
      }>;
      const programlar = ogeler
        .map((o) => o.item)
        .filter((i): i is { name: string; startDate: string; endDate: string } =>
          Boolean(i?.name && i?.startDate && i?.endDate),
        )
        .map((i) => ({ ad: i.name, baslangic: i.startDate, bitis: i.endDate }));
      if (programlar.length) return programlar;
    }
  }
  return [];
}

async function getir(slug: string): Promise<Program[]> {
  const res = await fetch(`https://www.tvyayinakisi.com/${slug}-yayin-akisi/`, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return ayristir(await res.text());
}

/** Kanalın yayın akışını getirir; 30 dakika bellekte tutulur. */
export async function akisGetir(channelId: string): Promise<Program[]> {
  const slug = EPG_SLUG[channelId];
  if (!slug) return [];

  const hit = bellek.get(slug);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.programlar;

  const mevcut = ucusta.get(slug);
  if (mevcut) return mevcut;

  const istek = getir(slug)
    .catch(() => [] as Program[])
    .then((programlar) => {
      // Boş sonuç kalıcı olarak önbelleğe alınmasın diye kısa tutulur
      if (programlar.length) bellek.set(slug, { programlar, at: Date.now() });
      ucusta.delete(slug);
      return programlar;
    });

  ucusta.set(slug, istek);
  return istek;
}

/** Akıştan o anki ve sıradaki programı seçer. */
export function simdiVeSirada(programlar: Program[], simdiki = Date.now()): Akis {
  const sirali = [...programlar].sort(
    (a, b) => +new Date(a.baslangic) - +new Date(b.baslangic),
  );
  const i = sirali.findIndex(
    (p) => +new Date(p.baslangic) <= simdiki && simdiki < +new Date(p.bitis),
  );
  if (i === -1) {
    const sonraki = sirali.find((p) => +new Date(p.baslangic) > simdiki) ?? null;
    return { simdi: null, sirada: sonraki, ilerleme: null };
  }
  const p = sirali[i];
  const bas = +new Date(p.baslangic);
  const bit = +new Date(p.bitis);
  const ilerleme = bit > bas ? Math.round(((simdiki - bas) / (bit - bas)) * 100) : null;
  return { simdi: p, sirada: sirali[i + 1] ?? null, ilerleme };
}
