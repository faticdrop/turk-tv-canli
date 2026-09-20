"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_YOLU = "/giris-video.mp4";
/** Geçiş animasyonunun süresi; CSS süresiyle aynı olmalı. */
const GECIS_MS = 900;
/** Video başladıktan kaç ms sonra başlat düğmesi görünsün. */
const DUGME_GECIKMESI = 3000;

export default function GirisEkrani({ onBasla }: { onBasla: () => void }) {
  const [cikiyor, setCikiyor] = useState(false);
  const [videoVar, setVideoVar] = useState(true);
  const [basladi, setBasladi] = useState(false);
  const [dugmeGorunur, setDugmeGorunur] = useState(false);
  /** Kullanıcı hareketine rağmen ses engellendiyse (ender) gösterilir. */
  const [sessizKaldi, setSessizKaldi] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const zamanRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (zamanRef.current) clearTimeout(zamanRef.current);
  }, []);

  /**
   * Video yalnızca kullanıcı dokunuşuyla başlar. Dokunuş bir kullanıcı
   * hareketi sayıldığı için tarayıcı sesli oynatmaya izin verir; bu yüzden
   * ayrıca "sesi aç" adımına gerek kalmaz.
   */
  const oynat = useCallback(() => {
    const v = videoRef.current;
    if (!v || basladi) return;
    setBasladi(true);
    v.muted = false;
    v.play().catch(() => {
      // Beklenmedik biçimde engellenirse sessiz oynat ve ses seçeneği sun
      v.muted = true;
      setSessizKaldi(true);
      v.play().catch(() => {});
    });
  }, [basladi]);

  const sesiAc = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setSessizKaldi(false);
  };

  /** Düğme, video gerçekten oynamaya başladıktan 3 saniye sonra belirir. */
  const oynamayaBasladi = () => {
    if (zamanRef.current) return;
    zamanRef.current = setTimeout(() => setDugmeGorunur(true), DUGME_GECIKMESI);
  };

  const basla = () => {
    if (cikiyor) return;
    setCikiyor(true);
    setTimeout(onBasla, GECIS_MS);
  };

  return (
    <div
      onPointerDown={oynat}
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-neutral-950 transition-all duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
        cikiyor ? "pointer-events-none scale-110 opacity-0 blur-md" : "scale-100 opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute left-1/4 top-2/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-8">
        <h1 className="giris-yaz text-center text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          Fatih Özen&apos;den TV uygulaması
        </h1>

        <div className="giris-video relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/15">
          {videoVar ? (
            <>
              <video
                ref={videoRef}
                className="aspect-video h-full w-full object-cover"
                src={VIDEO_YOLU}
                playsInline
                preload="auto"
                onPlaying={oynamayaBasladi}
                onError={() => setVideoVar(false)}
              />

              {!basladi && (
                <div className="absolute inset-0 grid place-items-center bg-black/45">
                  <div className="flex flex-col items-center gap-3">
                    <span className="grid h-20 w-20 place-items-center rounded-full bg-white/95 shadow-2xl ring-4 ring-white/30">
                      <svg viewBox="0 0 24 24" className="ml-1.5 h-9 w-9 text-neutral-900" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-black/70 px-4 py-1.5 text-sm font-medium text-white">
                      Başlatmak için ekrana dokunun
                    </span>
                  </div>
                </div>
              )}

              {basladi && sessizKaldi && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sesiAc();
                  }}
                  aria-label="Sesi aç"
                  className="absolute bottom-3 left-3 rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white backdrop-blur"
                >
                  Sesi aç
                </button>
              )}
            </>
          ) : (
            <div className="grid aspect-video w-full place-items-center px-6 text-center">
              <p className="text-sm text-neutral-500">
                Giriş videosu bulunamadı.
                <br />
                <span className="text-neutral-600">
                  Dosyayı <code className="text-neutral-400">public/giris-video.mp4</code> olarak
                  ekleyin.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Düğme video oynamaya başladıktan 3 saniye sonra belirir */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            basla();
          }}
          aria-hidden={!dugmeGorunur}
          tabIndex={dugmeGorunur ? 0 : -1}
          className={`giris-dugme-dikkat relative rounded-full px-9 py-4 text-base font-bold tracking-wide shadow-xl transition-all duration-500 active:scale-95 sm:text-lg ${
            dugmeGorunur
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          Uygulamayı Başlat
        </button>
      </div>
    </div>
  );
}
