"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import type { Channel, Source } from "@/data/channels";
import { ytApiYukle, KALICI_HATALAR, type YTPlayer } from "@/lib/youtube";

/** beklemede = yayın hazır ama tarayıcı otomatik oynatmayı engelledi */
type Status = "yukleniyor" | "oynuyor" | "beklemede" | "hata";

const MAX_AG_DENEMESI = 3;
/** Dokunulduktan sonra ileri/geri kontrollerinin ekranda kalma süresi */
const KONTROL_SURESI = 5000;
/** Saniye cinsinden atlama adımları */
const ADIMLAR = [60, 300, 1800] as const;
const MAX_MEDYA_DENEMESI = 2;

/**
 * Telefonlar SESLİ otomatik oynatmayı engeller, sessiz oynatmaya izin verir.
 * Bu yüzden yayın her zaman sessiz başlar; kullanıcı bir kez sesi açtıktan
 * sonra (bu bir kullanıcı hareketidir) sonraki kanallar sesli açılabilir.
 */
let sesAcildi = false;

export default function Player({
  channel,
  dolu = false,
  kontroller = true,
}: {
  channel: Channel;
  /** true: kapsayıcıyı tamamen doldurur (tam ekran modu) */
  dolu?: boolean;
  /** false: videonun kendi kontrol çubuğu gizlenir (kanal şeridiyle çakışmasın) */
  kontroller?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [source, setSource] = useState<Source>(channel.source);
  const [status, setStatus] = useState<Status>("yukleniyor");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [sessiz, setSessiz] = useState(!sesAcildi);
  const [kontrolGorunur, setKontrolGorunur] = useState(false);
  /** Canlı yayında ne kadar geri/ileri gidilebildiği (saniye) */
  const [pencere, setPencere] = useState({ geri: 0, ileri: 0 });
  const kontrolZaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triedFallback = useRef(false);

  useEffect(() => {
    triedFallback.current = false;
    setVideoId(null);
    setSource(channel.source);
    setStatus("yukleniyor");
    setSessiz(!sesAcildi);
  }, [channel.id, channel.source]);

  const kontrolleriGoster = useCallback(() => {
    setKontrolGorunur(true);
    if (kontrolZaman.current) clearTimeout(kontrolZaman.current);
    kontrolZaman.current = setTimeout(() => setKontrolGorunur(false), KONTROL_SURESI);
  }, []);

  /** Yayında ileri/geri atlar; geri sarma penceresinin dışına taşmaz. */
  const atla = useCallback(
    (saniye: number) => {
      if (source.kind === "youtube") {
        const pl = ytPlayerRef.current;
        if (!pl) return;
        try {
          const simdi = pl.getCurrentTime();
          const son = pl.getDuration();
          pl.seekTo(Math.max(0, Math.min(simdi + saniye, son)), true);
        } catch {
          /* oynatıcı hazır değil */
        }
      } else {
        const v = videoRef.current;
        if (!v?.seekable.length) return;
        v.currentTime = Math.max(
          v.seekable.start(0),
          Math.min(v.currentTime + saniye, v.seekable.end(0)),
        );
      }
      kontrolleriGoster();
    },
    [source, kontrolleriGoster],
  );

  const canliyaDon = useCallback(() => {
    if (source.kind === "youtube") {
      const pl = ytPlayerRef.current;
      try {
        pl?.seekTo(pl.getDuration(), true);
      } catch {
        /* yoksay */
      }
    } else {
      const v = videoRef.current;
      if (v?.seekable.length) v.currentTime = v.seekable.end(0);
    }
    kontrolleriGoster();
  }, [source, kontrolleriGoster]);

  // Kontroller görünürken kullanılabilir pencereyi ölç
  useEffect(() => {
    if (!kontrolGorunur) return;
    const olc = () => {
      if (source.kind === "youtube") {
        const pl = ytPlayerRef.current;
        if (!pl) return;
        try {
          const t = pl.getCurrentTime();
          const d = pl.getDuration();
          setPencere({ geri: Math.max(0, t), ileri: Math.max(0, d - t) });
        } catch {
          /* yoksay */
        }
      } else {
        const v = videoRef.current;
        if (!v?.seekable.length) return setPencere({ geri: 0, ileri: 0 });
        setPencere({
          geri: Math.max(0, v.currentTime - v.seekable.start(0)),
          ileri: Math.max(0, v.seekable.end(0) - v.currentTime),
        });
      }
    };
    olc();
    const z = setInterval(olc, 1000);
    return () => clearInterval(z);
  }, [kontrolGorunur, source, videoId]);

  const failOver = useCallback(() => {
    if (!triedFallback.current && channel.fallback) {
      triedFallback.current = true;
      setVideoId(null);
      setSource(channel.fallback);
      setStatus("yukleniyor");
    } else {
      setStatus("hata");
    }
  }, [channel.fallback]);

  const retry = () => {
    triedFallback.current = false;
    setVideoId(null);
    setStatus("yukleniyor");
    setSource(channel.source);
  };

  /**
   * Önce tercih edilen ses durumuyla dener; engellenirse sessize alıp
   * yeniden dener. Böylece yayın her hâlükârda kendiliğinden başlar.
   */
  const tryPlay = useCallback((video: HTMLVideoElement) => {
    video.muted = !sesAcildi;
    video
      .play()
      .then(() => {
        setSessiz(video.muted);
        setStatus("oynuyor");
      })
      .catch(() => {
        video.muted = true;
        setSessiz(true);
        video.play().then(
          () => setStatus("oynuyor"),
          () => setStatus("beklemede"),
        );
      });
  }, []);

  const manualPlay = () => {
    const video = videoRef.current;
    if (video) tryPlay(video);
  };

  /** Tek dokunuşla sesi açar (kullanıcı hareketi olduğu için izin verilir). */
  const sesiAc = () => {
    sesAcildi = true;
    setSessiz(false);
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.play().catch(() => {});
    }
    try {
      ytPlayerRef.current?.unMute();
    } catch {
      /* oynatıcı henüz hazır değil */
    }
  };

  // --- YouTube: canlı yayını resmî IFrame API ile aç ---
  // Ham iframe kullanılmaz: hak sahibi gömülü gösterimi engellediğinde
  // (hata 101/150) bunu yalnızca API'nin onError olayı bildirir; aksi
  // hâlde kullanıcı YouTube'un "video kullanılamıyor" ekranıyla kalır.
  useEffect(() => {
    if (source.kind !== "youtube") return;
    const kap = ytHostRef.current;
    if (!kap) return;

    let cancelled = false;
    setStatus("yukleniyor");
    setVideoId(null);

    (async () => {
      const cevap = await fetch(`/api/live/${source.channelId}`);
      if (!cevap.ok) throw new Error("canlı yayın yok");
      const { videoId: vid } = (await cevap.json()) as { videoId: string };
      if (cancelled) return;
      setVideoId(vid);

      const YT = await ytApiYukle();
      if (cancelled) return;

      // API, verilen öğenin yerine iframe koyar; her seferinde yeni bir
      // çocuk öğe oluşturulur ki temizlik sonrası kap boş kalsın.
      kap.innerHTML = "";
      const host = document.createElement("div");
      host.className = "h-full w-full";
      kap.appendChild(host);

      ytPlayerRef.current = new YT.Player(host, {
        videoId: vid,
        // mute=1: telefonlarda otomatik oynatmanın çalışması için şart
        playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            if (sesAcildi) {
              e.target.unMute();
              setSessiz(false);
            }
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setStatus("oynuyor");
          },
          onError: (e) => {
            if (!cancelled && KALICI_HATALAR.has(e.data)) failOver();
          },
        },
      });
    })().catch(() => {
      if (!cancelled) failOver();
    });

    return () => {
      cancelled = true;
      try {
        ytPlayerRef.current?.destroy();
      } catch {
        /* zaten yok edilmiş olabilir */
      }
      ytPlayerRef.current = null;
      if (kap) kap.innerHTML = "";
    };
  }, [source, failOver]);

  // --- HLS ---
  useEffect(() => {
    if (source.kind !== "hls") return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    setStatus("yukleniyor");
    // Otomatik oynatmanın engellenmemesi için yayın sessiz başlar
    video.muted = true;

    import("hls.js").then(({ default: HlsCtor }) => {
      if (cancelled) return;

      // ÖNCE hls.js (MSE). Chromium canPlayType için "maybe" döndürdüğünden
      // yerel oynatma ancak MSE yoksa denenmelidir (pratikte Safari/iOS).
      if (HlsCtor.isSupported()) {
        const hls = new HlsCtor({ enableWorker: true });
        hlsRef.current = hls;

        let agDenemesi = 0;
        let medyaDenemesi = 0;
        const vazgec = () => {
          hls.destroy();
          hlsRef.current = null;
          failOver();
        };

        hls.loadSource(source.url);
        hls.attachMedia(video);
        hls.on(HlsCtor.Events.MANIFEST_PARSED, () => tryPlay(video));
        hls.on(HlsCtor.Events.ERROR, (_e, data) => {
          if (cancelled || !data.fatal) return;
          if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) {
            // Manifest hiç yüklenemediyse startLoad() işe yaramaz; yalnızca
            // parça yüklemeyi yeniden başlatır, manifesti istemez.
            const manifestHatasi =
              data.details === HlsCtor.ErrorDetails.MANIFEST_LOAD_ERROR ||
              data.details === HlsCtor.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
              data.details === HlsCtor.ErrorDetails.MANIFEST_PARSING_ERROR;
            if (manifestHatasi) return vazgec();
            if (++agDenemesi > MAX_AG_DENEMESI) return vazgec();
            setTimeout(() => {
              if (!cancelled) hls.startLoad();
            }, 1000 * agDenemesi);
          } else if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) {
            if (++medyaDenemesi > MAX_MEDYA_DENEMESI) return vazgec();
            hls.recoverMediaError();
          } else {
            vazgec();
          }
        });
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url;
        tryPlay(video);
        return;
      }

      failOver();
    });

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
    };
  }, [source, failOver, tryPlay]);

  const sesDugmesiGorunur = sessiz && (status === "oynuyor" || source.kind === "youtube");

  const dk = (sn: number) => `${sn / 60}dk`;

  return (
    <div
      onPointerDown={kontrolleriGoster}
      className={
        dolu
          ? "absolute inset-0 overflow-hidden bg-black"
          : // max-h: yatay moddaki telefonda 16:9 video ekrandan taşıp altındaki
            // düğmeleri ve kanal listesini erişilemez hale getiriyordu.
            "relative aspect-video max-h-[60vh] w-full overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 sm:rounded-xl lg:max-h-none"
      }
    >
      {source.kind === "youtube" ? (
        <div ref={ytHostRef} className="absolute inset-0 h-full w-full" />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full bg-black"
          controls={kontroller}
          playsInline
          muted
          onPlaying={() => setStatus("oynuyor")}
          onVolumeChange={(e) => setSessiz(e.currentTarget.muted)}
          onPause={() => setStatus((s) => (s === "oynuyor" ? "beklemede" : s))}
        />
      )}

      {/* İleri/geri yalnızca HLS kaynaklarında çalışır. YouTube'un gömülü
          canlı oynatıcısı geri sarmayı kabul etmiyor: konum değiştirilse bile
          birkaç saniye içinde kendini canlı uca geri çekiyor. Bu yüzden
          YouTube kanallarında kontrol çubuğu hiç gösterilmez. */}
      {kontrolGorunur && status !== "hata" && source.kind === "hls" && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/80 p-1.5 shadow-xl ring-1 ring-white/15 backdrop-blur">
            {[...ADIMLAR].reverse().map((sn) => (
              <button
                key={`geri-${sn}`}
                onClick={() => atla(-sn)}
                disabled={pencere.geri < sn}
                title={`${dk(sn)} geri`}
                className="rounded-full px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ⟲ {dk(sn)}
              </button>
            ))}

            <button
              onClick={canliyaDon}
              disabled={pencere.ileri < 5}
              title="Canlı yayına dön"
              className="mx-0.5 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 disabled:bg-white/10 disabled:opacity-60"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  pencere.ileri < 5 ? "bg-red-500" : "bg-neutral-400"
                }`}
              />
              CANLI
            </button>

            {ADIMLAR.map((sn) => (
              <button
                key={`ileri-${sn}`}
                onClick={() => atla(sn)}
                disabled={pencere.ileri < sn}
                title={`${dk(sn)} ileri`}
                className="rounded-full px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                {dk(sn)} ⟳
              </button>
            ))}
          </div>
        </div>
      )}

      {sesDugmesiGorunur && (
        <button
          onClick={sesiAc}
          className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:bg-black/90"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
          </svg>
          Sesi aç
        </button>
      )}

      {status === "yukleniyor" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/60">
          <div className="flex items-center gap-3 text-sm text-white/80">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Yayın açılıyor…
          </div>
        </div>
      )}

      {status === "beklemede" && source.kind === "hls" && (
        <button
          onClick={manualPlay}
          aria-label="Yayını başlat"
          className="absolute inset-0 grid place-items-center bg-black/50 transition hover:bg-black/40"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      {status === "hata" && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 p-6 text-center">
          <div className="max-w-sm space-y-3">
            <p className="text-sm text-white/80">
              {channel.name} yayınına şu anda ulaşılamıyor. Kanal canlı yayını
              durdurmuş ya da kaynak geçici olarak erişime kapalı olabilir.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={retry}
                className="rounded-lg bg-white/15 px-4 py-2 text-sm text-white hover:bg-white/25"
              >
                Tekrar dene
              </button>
              {channel.site && (
                <a
                  href={channel.site}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                >
                  Resmî sitesi →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
