/** YouTube IFrame Player API'sinin kullandığımız küçük bir bölümü. */
export interface YTPlayer {
  playVideo(): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
  /** Canlı yayında geri sarma penceresi içinde konum değiştirir. */
  seekTo(saniye: number, hemen: boolean): void;
  getCurrentTime(): number;
  /** Canlı yayında geri sarma penceresinin uzunluğu. */
  getDuration(): number;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    ayar: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onError?: (e: { data: number }) => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let yukleme: Promise<YTNamespace> | null = null;

/** API betiğini bir kez yükler, sonraki çağrılar aynı sözü paylaşır. */
export function ytApiYukle(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("sunucu"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (yukleme) return yukleme;

  yukleme = new Promise<YTNamespace>((coz, reddet) => {
    const oncekiHazir = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      oncekiHazir?.();
      if (window.YT?.Player) coz(window.YT);
      else reddet(new Error("YT yüklenemedi"));
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => reddet(new Error("YT betiği yüklenemedi"));
    document.head.appendChild(s);
  });
  return yukleme;
}

/**
 * Yayının gömülü oynatılmasının kalıcı olarak mümkün olmadığını gösteren
 * hata kodları. 101/150: hak sahibi site dışında gösterimi engellemiş.
 * 100: video yok/kaldırılmış. 5: oynatıcı bu içeriği açamıyor.
 */
export const KALICI_HATALAR = new Set([2, 5, 100, 101, 150]);
