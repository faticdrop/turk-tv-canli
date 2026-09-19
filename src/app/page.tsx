"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Player from "@/components/Player";
import KanalSeridi from "@/components/KanalSeridi";
import GirisEkrani from "@/components/GirisEkrani";
import KanalLogo from "@/components/KanalLogo";
import { CHANNELS, CATEGORIES, type Category } from "@/data/channels";
import type { Akis } from "@/lib/epg";

/** Yayın saatini Türkiye saatine göre biçimler. */
export const saat = (iso: string) =>
  new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });

const FAV_KEY = "turktv:favoriler";
const SON_KEY = "turktv:sonKanal";
const SERIT_SURESI = 4500;

type Filtre = Category | "Tümü" | "Favoriler";

export default function Home() {
  const [activeId, setActiveId] = useState(CHANNELS[0].id);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filtre>("Tümü");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tuslanan, setTuslanan] = useState("");
  const [tamEkran, setTamEkran] = useState(false);
  const [seritGorunur, setSeritGorunur] = useState(false);
  const [epg, setEpg] = useState<Record<string, Akis>>({});
  const [girisBitti, setGirisBitti] = useState(false);
  /** Açılış animasyonu yalnızca kısa süre uygulanır: bittikten sonra sınıf
   *  kaldırılmazsa <main> üzerinde kalıcı bir transform kalır ve iOS'ta
   *  içindeki position:fixed öğeler ekrana değil bu kutuya göre konumlanır. */
  const [acilisAnimasyonu, setAcilisAnimasyonu] = useState(false);

  const aramaRef = useRef<HTMLInputElement>(null);
  const oynaticiRef = useRef<HTMLDivElement>(null);
  const listeRef = useRef<HTMLUListElement>(null);
  const tusZamani = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seritZamani = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Kanal değişimini hem duruma hem depolamaya yazar.
   *  Kaydetme bir efekte bağlanırsa ilk açılışta varsayılan kanal,
   *  daha önce kaydedilmiş kanalın üzerine yazar. */
  const kanalSec = useCallback((id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(SON_KEY, id);
    } catch {
      /* depolama kapalı olabilir */
    }
  }, []);

  useEffect(() => {
    try {
      const fav = localStorage.getItem(FAV_KEY);
      if (fav) setFavorites(JSON.parse(fav));
      const son = localStorage.getItem(SON_KEY);
      if (son && CHANNELS.some((c) => c.id === son)) setActiveId(son);
    } catch {
      /* depolama kapalı olabilir */
    }
  }, []);

  // Program bilgisi: açılışta bir kez, sonra 5 dakikada bir tazelenir
  useEffect(() => {
    let iptal = false;
    const yukle = () =>
      fetch("/api/epg")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { kanallar: Record<string, Akis> } | null) => {
          if (!iptal && d?.kanallar) setEpg(d.kanallar);
        })
        .catch(() => {
          /* program bilgisi olmadan da çalışır */
        });
    yukle();
    const zaman = setInterval(yukle, 5 * 60 * 1000);
    return () => {
      iptal = true;
      clearInterval(zaman);
    };
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* yoksay */
      }
      return next;
    });
  }, []);

  const active = CHANNELS.find((c) => c.id === activeId) ?? CHANNELS[0];

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return CHANNELS.filter((c) => {
      if (category === "Favoriler" && !favorites.includes(c.id)) return false;
      if (category !== "Tümü" && category !== "Favoriler" && c.category !== category) return false;
      if (q && !c.name.toLocaleLowerCase("tr-TR").includes(q)) return false;
      return true;
    });
  }, [query, category, favorites]);

  /** Şeridi göster ve bir süre sonra kendiliğinden gizle. */
  const seridiGoster = useCallback(() => {
    setSeritGorunur(true);
    if (seritZamani.current) clearTimeout(seritZamani.current);
    seritZamani.current = setTimeout(() => setSeritGorunur(false), SERIT_SURESI);
  }, []);

  const seridiDegistir = useCallback(() => {
    if (seritGorunur) {
      if (seritZamani.current) clearTimeout(seritZamani.current);
      setSeritGorunur(false);
    } else {
      seridiGoster();
    }
  }, [seritGorunur, seridiGoster]);

  /** Tam ekran CSS ile kurulur: iPhone Safari <div> öğelerini gerçek tam
   *  ekrana alamaz, alsa bile kendi video arayüzü şeridi gizlerdi.
   *  Destekleyen tarayıcılarda ayrıca yerel tam ekran da denenir. */
  const tamEkranDegistir = useCallback(() => {
    setTamEkran((onceki) => {
      const yeni = !onceki;
      if (yeni) {
        oynaticiRef.current?.requestFullscreen?.().catch(() => {});
        seridiGoster();
      } else {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setSeritGorunur(false);
      }
      return yeni;
    });
  }, [seridiGoster]);

  // Tam ekranda arka plan kaymasın
  useEffect(() => {
    if (!tamEkran) return;
    document.body.style.overflow = "hidden";
    // Eski değeri saklayıp geri yazmak yerine özellik tamamen kaldırılır:
    // saklanan değer "hidden" olursa kaydırma kalıcı olarak kilitli kalır.
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [tamEkran]);

  // Kullanıcı yerel tam ekrandan çıkarsa (ör. geri tuşu) durumu eşitle
  useEffect(() => {
    const isle = () => {
      if (!document.fullscreenElement) setTamEkran(false);
    };
    document.addEventListener("fullscreenchange", isle);
    return () => document.removeEventListener("fullscreenchange", isle);
  }, []);

  const kaydir = useCallback(
    (yon: 1 | -1) => {
      if (visible.length === 0) return;
      const i = visible.findIndex((c) => c.id === activeId);
      const yeni = i === -1 ? 0 : (i + yon + visible.length) % visible.length;
      kanalSec(visible[yeni].id);
      if (tamEkran) seridiGoster();
    },
    [visible, activeId, kanalSec, tamEkran, seridiGoster],
  );

  const resimIcinde = useCallback(async () => {
    const video = oynaticiRef.current?.querySelector("video");
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* tarayıcı desteklemiyor olabilir */
    }
  }, []);

  const rakamGir = useCallback(
    (rakam: string) => {
      setTuslanan((onceki) => {
        const yeni = (onceki + rakam).slice(-2);
        if (tusZamani.current) clearTimeout(tusZamani.current);
        tusZamani.current = setTimeout(() => {
          const no = parseInt(yeni, 10);
          if (no >= 1 && no <= CHANNELS.length) kanalSec(CHANNELS[no - 1].id);
          setTuslanan("");
        }, 900);
        return yeni;
      });
    },
    [kanalSec],
  );

  // --- Klavye / kumanda ---
  useEffect(() => {
    const isle = (e: KeyboardEvent) => {
      const hedef = e.target as HTMLElement | null;
      const yaziyor =
        hedef?.tagName === "INPUT" || hedef?.tagName === "TEXTAREA" || hedef?.isContentEditable;

      if (e.key === "Escape") {
        if (yaziyor) {
          (hedef as HTMLInputElement).blur();
          return;
        }
        if (tamEkran) {
          e.preventDefault();
          tamEkranDegistir();
          return;
        }
      }
      if (yaziyor) return;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          kaydir(1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          kaydir(-1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          tamEkranDegistir();
          break;
        case "p":
        case "P":
          e.preventDefault();
          resimIcinde();
          break;
        case "s":
        case "S":
          e.preventDefault();
          toggleFavorite(activeId);
          break;
        case "/":
          e.preventDefault();
          aramaRef.current?.focus();
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            rakamGir(e.key);
          }
      }
    };
    window.addEventListener("keydown", isle);
    return () => window.removeEventListener("keydown", isle);
  }, [kaydir, tamEkranDegistir, resimIcinde, rakamGir, activeId, tamEkran, toggleFavorite]);

  useEffect(() => {
    listeRef.current
      ?.querySelector('[data-secili="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  const filtreler: Filtre[] = ["Tümü", "Favoriler", ...CATEGORIES];
  const kanalNo = CHANNELS.findIndex((c) => c.id === activeId) + 1;

  return (
    <>
      {!girisBitti && (
        <GirisEkrani
          onBasla={() => {
            setGirisBitti(true);
            setAcilisAnimasyonu(true);
            setTimeout(() => setAcilisAnimasyonu(false), 950);
          }}
        />
      )}

      <main
        className={`min-h-dvh bg-neutral-950 text-neutral-100 ${
          acilisAnimasyonu ? "uygulama-ac" : ""
        }`}
      >
      <header className="z-20 border-b border-white/10 bg-neutral-950/90 backdrop-blur lg:sticky lg:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">
            Canlı TV <span className="text-neutral-500">· Türkiye</span>
          </h1>
          <input
            ref={aramaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kanal ara…"
            className="ml-auto w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none placeholder:text-neutral-500 focus:border-white/30"
          />
        </div>
      </header>

      <div className="mx-auto max-w-7xl sm:px-4 sm:py-6">
        <section className="lg:grid lg:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Mobilde grid kullanılmaz: sticky bir grid öğesi yalnızca kendi
                satırı boyunca yapışır, sayfa boyunca değil. Blok akışında ise
                kapsayıcı tüm sayfa olduğu için video yukarıda sabit kalır. */}
            <div
              ref={oynaticiRef}
              onPointerDown={tamEkran ? seridiGoster : undefined}
              className={
                tamEkran
                  ? "fixed inset-0 z-50 bg-black"
                  : "sticky top-0 z-30 bg-black lg:static lg:col-start-1 lg:row-start-1"
              }
            >
              <Player
                channel={active}
                dolu={tamEkran}
                kontroller={!(tamEkran && seritGorunur)}
              />

              {tuslanan && (
                <div className="pointer-events-none absolute right-4 top-4 z-30 rounded-lg bg-black/80 px-4 py-2 text-2xl font-bold tabular-nums text-white ring-1 ring-white/20">
                  {tuslanan}
                </div>
              )}

              {tamEkran && (
                <>
                  <button
                    onClick={seridiDegistir}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute left-3 top-3 z-30 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/80"
                  >
                    ☰ Kanallar
                  </button>
                  <button
                    onClick={tamEkranDegistir}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Tam ekrandan çık"
                    className="absolute right-3 top-3 z-30 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/80"
                  >
                    ✕
                  </button>
                  <KanalSeridi
                    kanallar={visible.length ? visible : CHANNELS}
                    epg={epg}
                    activeId={activeId}
                    gorunur={seritGorunur}
                    onSec={(id) => {
                      kanalSec(id);
                      seridiGoster();
                    }}
                  />
                </>
              )}
            </div>

            <div className="lg:col-start-1 lg:row-start-2">
            <div className="mt-3 flex flex-wrap items-center gap-2 px-4 sm:gap-3 sm:px-0">
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs tabular-nums text-neutral-400">
                {kanalNo}
              </span>
              <h2 className="text-lg font-semibold sm:text-xl">{active.name}</h2>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-neutral-300">
                {active.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                CANLI
              </span>

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => toggleFavorite(active.id)}
                  title="Favori (S)"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  {favorites.includes(active.id) ? "★" : "☆"}
                </button>
                <button
                  onClick={resimIcinde}
                  title="Resim içinde resim (P)"
                  className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10 sm:block"
                >
                  ⧉
                </button>
                <button
                  onClick={tamEkranDegistir}
                  title="Tam ekran (F)"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  ⛶
                </button>
              </div>
            </div>

            {(() => {
              const a = epg[active.id];
              if (!a?.simdi && !a?.sirada) return null;
              return (
                <div className="mt-3 px-4 sm:px-0">
                  {a.simdi && (
                    <>
                      <p className="text-sm">
                        <span className="text-neutral-500">Şimdi</span>{" "}
                        <span className="font-medium">{a.simdi.ad}</span>{" "}
                        <span className="text-xs text-neutral-500">
                          {saat(a.simdi.baslangic)}–{saat(a.simdi.bitis)}
                        </span>
                      </p>
                      {a.ilerleme !== null && (
                        <div className="mt-1.5 h-1 w-full max-w-md overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-red-500/80"
                            style={{ width: `${a.ilerleme}%` }}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {a.sirada && (
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Sırada {saat(a.sirada.baslangic)} · {a.sirada.ad}
                    </p>
                  )}
                </div>
              );
            })()}

            <p className="mt-3 hidden px-4 text-xs text-neutral-500 sm:block sm:px-0">
              <span className="text-neutral-400">Kısayollar:</span> ↑ ↓ kanal değiştir ·
              rakamlarla kanal no · <kbd>F</kbd> tam ekran · <kbd>P</kbd> küçük pencere ·{" "}
              <kbd>S</kbd> favori · <kbd>/</kbd> arama
            </p>
          </div>

          <aside className="mt-4 px-4 sm:px-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {filtreler.map((f) => (
                <button
                  key={f}
                  onClick={() => setCategory(f)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    category === f
                      ? "bg-white text-neutral-900"
                      : "bg-white/5 text-neutral-300 hover:bg-white/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">
                Bu filtreye uyan kanal yok.
              </p>
            ) : (
              <ul ref={listeRef} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {visible.map((c) => {
                  const no = CHANNELS.findIndex((x) => x.id === c.id) + 1;
                  return (
                    <li key={c.id}>
                      <button
                        data-secili={c.id === activeId}
                        onClick={() => kanalSec(c.id)}
                        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                          c.id === activeId
                            ? "bg-white/15 ring-1 ring-white/25"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <span className="hidden w-5 shrink-0 text-right text-xs tabular-nums text-neutral-600 lg:block">
                          {no}
                        </span>
                        <KanalLogo channel={c} className="h-10 w-14 shrink-0 rounded-md" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{c.name}</span>
                          <span className="block truncate text-xs text-neutral-500">
                            {epg[c.id]?.simdi?.ad ?? c.category}
                          </span>
                        </span>
                        {favorites.includes(c.id) && (
                          <span className="text-xs text-amber-400">★</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        {/* Altbilgi section içinde durur: sabit video, kapsayıcısı
            bitince sabitlenmeyi bırakır; dışarıda kalsaydı sayfa
            sonunda yukarı kayardı. */}

        <footer className="mt-12 border-t border-white/10 px-4 pb-8 pt-6 text-xs leading-relaxed text-neutral-500 sm:px-0 lg:col-span-2 lg:col-start-1 lg:row-start-3">
          Bu uygulama yalnızca yayıncıların kendi resmî ve halka açık canlı yayın
          kaynaklarına (TRT açık HLS yayınları ve kanalların doğrulanmış resmî YouTube
          canlı yayınları) bağlanır. Yayınlar ilgili kanallara aittir; hiçbir içerik
          kopyalanmaz, kaydedilmez veya yeniden yayınlanmaz.
        </footer>
        </section>
        </div>
      </main>
    </>
  );
}
