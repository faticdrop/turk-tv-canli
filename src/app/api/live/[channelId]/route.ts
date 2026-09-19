import { NextResponse } from "next/server";
import { CHANNELS } from "@/data/channels";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/** Çözülen videoId'ler kısa süre bellekte tutulur (her istekte YouTube'a gitmemek için). */
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { videoId: string | null; at: number }>();

/** Katalogda gerçekten var olan YouTube kanal ID'leri (SSRF'e karşı beyaz liste). */
const ALLOWED = new Set(
  CHANNELS.flatMap((c) =>
    [c.source, c.fallback]
      .filter((s) => s?.kind === "youtube")
      .map((s) => (s as { channelId: string }).channelId),
  ),
);

async function resolveLiveVideoId(channelId: string): Promise<string | null> {
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Yayın gerçekten canlıysa sayfada isLive işareti bulunur
  if (!html.includes('"isLive":true')) return null;

  const match = html.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
  return match ? match[1] : null;
}

/**
 * GET /api/live/<youtubeChannelId>
 * Kanalın o anki canlı yayın video ID'sini döndürür.
 * YouTube'un eski embed/live_stream uç noktası çalışmadığı için gereklidir.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;

  if (!ALLOWED.has(channelId)) {
    return NextResponse.json({ hata: "Bilinmeyen kanal" }, { status: 404 });
  }

  const hit = cache.get(channelId);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.videoId
      ? NextResponse.json({ videoId: hit.videoId, onbellek: true })
      : NextResponse.json({ hata: "Şu anda canlı yayın yok" }, { status: 503 });
  }

  let videoId: string | null = null;
  try {
    videoId = await resolveLiveVideoId(channelId);
  } catch {
    videoId = null;
  }
  cache.set(channelId, { videoId, at: Date.now() });

  return videoId
    ? NextResponse.json({ videoId, onbellek: false })
    : NextResponse.json({ hata: "Şu anda canlı yayın yok" }, { status: 503 });
}
