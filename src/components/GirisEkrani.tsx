"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_YOLU = "/giris-video.mp4";
/** Geçiş animasyonunun süresi; CSS süresiyle aynı olmalı. */
const GECIS_MS = 900;

export default function GirisEkrani({ onBasla }: { onBasla: () => void }) {
  const [cikiyor, setCikiyor] = useState(false);
  const [videoVar, setVideoVar] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Tarayıcılar sesli otomatik oynatmayı engeller; video sessiz başlar.
  useEffect(() => {
    videoRef.current?.play().catch(() => {
      /* otomatik oynatma engellendiyse kullanıcı yine de başlatabilir */
    });
  }, []);

  const basla = () => {
    if (cikiyor) return;
    setCikiyor(true);
    setTimeout(onBasla, GECIS_MS);
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-neutral-950 transition-all duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
        cikiyor ? "pointer-events-none scale-110 opacity-0 blur-md" : "scale-100 opacity-100"
      }`}
    >
      {/* arka plan parıltısı */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute left-1/4 top-2/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center gap-6 px-5 py-8">
        <h1 className="giris-yaz text-center text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          Fatih Özen&apos;den TV uygulaması
        </h1>

        <div className="giris-video w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/15">
          {videoVar ? (
            <video
              ref={videoRef}
              className="aspect-video h-full w-full object-cover"
              src={VIDEO_YOLU}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setVideoVar(false)}
            />
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
          onClick={basla}
          className="giris-dugme group relative overflow-hidden rounded-full bg-white px-8 py-3.5 text-base font-semibold text-neutral-900 shadow-xl transition hover:scale-[1.04] active:scale-95"
        >
          <span className="relative z-10">Uygulamayı Başlat</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-sky-200/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>
      </div>
    </div>
  );
}
