"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_YOLU = "/giris-video.mp4";
/** Geçiş animasyonunun süresi; CSS süresiyle aynı olmalı. */
const GECIS_MS = 900;

export default function GirisEkrani({ onBasla }: { onBasla: () => void }) {
  const [cikiyor, setCikiyor] = useState(false);
  const [videoVar, setVideoVar] = useState(true);
  const [sessiz, setSessiz] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Tarayıcılar sesli otomatik oynatmayı engeller. Önce sesli denenir
   * (kullanıcı siteyle daha önce etkileşmişse izin verilebilir), engellenirse
   * sessize alınıp yeniden denenir — böylece video her hâlükârda başlar.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play().then(
      () => setSessiz(false),
      () => {
        v.muted = true;
        setSessiz(true);
        v.play().catch(() => {});
      },
    );
  }, []);

  /** Kullanıcı hareketi olduğu için burada sesi açmaya izin verilir. */
  const sesiAc = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setSessiz(false);
    v.play().catch(() => {});
  };

  const basla = () => {
    if (cikiyor) return;
    setCikiyor(true);
    setTimeout(onBasla, GECIS_MS);
  };

  return (
    <div
      // Ekranın herhangi bir yerine dokunmak da sesi açar
      onPointerDown={sessiz ? sesiAc : undefined}
      className={`fixed inset-0 z-50 overflow-hidden bg-neutral-950 transition-all duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
        cikiyor ? "pointer-events-none scale-110 opacity-0 blur-md" : "scale-100 opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute left-1/4 top-2/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center gap-6 px-5 py-8">
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
                autoPlay
                loop
                playsInline
                preload="auto"
                onVolumeChange={(e) => setSessiz(e.currentTarget.muted)}
                onError={() => setVideoVar(false)}
              />

              {sessiz && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sesiAc();
                  }}
                  className="absolute inset-0 grid place-items-center bg-black/30 transition hover:bg-black/40"
                  aria-label="Sesi aç"
                >
                  <span className="flex items-center gap-2.5 rounded-full bg-white/95 px-5 py-3 text-sm font-semibold text-neutral-900 shadow-xl">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a6.99 6.99 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
                    </svg>
                    Sesi aç
                  </span>
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            basla();
          }}
          className="giris-dugme group relative overflow-hidden rounded-full bg-white px-8 py-3.5 text-base font-semibold text-neutral-900 shadow-xl transition hover:scale-[1.04] active:scale-95"
        >
          <span className="relative z-10">Uygulamayı Başlat</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-sky-200/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>
      </div>
    </div>
  );
}
