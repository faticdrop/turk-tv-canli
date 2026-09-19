export type Category =
  | "Genel"
  | "Haber"
  | "Spor"
  | "Ekonomi"
  | "Çocuk"
  | "Müzik"
  | "Belgesel"
  | "Uluslararası";

export type Source =
  | { kind: "hls"; url: string }
  | { kind: "youtube"; channelId: string };

export interface Channel {
  id: string;
  name: string;
  category: Category;
  /** Tile rengi (marka logosu kullanılmıyor, telif nedeniyle monogram gösteriliyor) */
  color: string;
  /** Tercih edilen kaynak */
  source: Source;
  /** Birincil kaynak düşerse denenecek kaynak */
  fallback?: Source;
  /** Kanalın resmî sayfası */
  site?: string;
}

const hls = (url: string): Source => ({ kind: "hls", url });
const yt = (channelId: string): Source => ({ kind: "youtube", channelId });

/**
 * Yalnızca resmî / halka açık yayın kaynakları.
 * - hls: TRT'nin kendi CDN'i üzerinden yayınladığı açık HLS akışları
 * - youtube: kanalın kendi resmî YouTube hesabındaki 7/24 canlı yayını
 * Korsan IPTV listeleri bilinçli olarak kullanılmamaktadır.
 */
export const CHANNELS: Channel[] = [
  // ---- TRT: doğrudan resmî HLS ----
  { id: "trt1", name: "TRT 1", category: "Genel", color: "#0b6fb8",
    source: hls("https://tv-trt1.medya.trt.com.tr/master.m3u8"), site: "https://www.trt1.com.tr" },
  { id: "trt-haber", name: "TRT Haber", category: "Haber", color: "#c8102e",
    source: hls("https://tv-trthaber.medya.trt.com.tr/master.m3u8"),
    fallback: yt("UCBgTP2LOFVPmq15W-RH-WXA"), site: "https://www.trthaber.com" },
  { id: "trt-cocuk", name: "TRT Çocuk", category: "Çocuk", color: "#f4a300",
    source: hls("https://tv-trtcocuk.medya.trt.com.tr/master.m3u8"),
    fallback: yt("UCrFf5dtMe6M1XJHqbKJ4X6Q"), site: "https://www.trtcocuk.net.tr" },
  { id: "trt-muzik", name: "TRT Müzik", category: "Müzik", color: "#8e44ad",
    source: hls("https://tv-trtmuzik.medya.trt.com.tr/master.m3u8") },
  { id: "trt-avaz", name: "TRT Avaz", category: "Uluslararası", color: "#1f8a70",
    source: hls("https://tv-trtavaz.medya.trt.com.tr/master.m3u8"),
    fallback: yt("UCib1E6oJRLd2pXkxqzxyg7A") },
  { id: "trt-turk", name: "TRT Türk", category: "Uluslararası", color: "#2f5d9e",
    source: hls("https://tv-trtturk.medya.trt.com.tr/master.m3u8") },
  { id: "trt-kurdi", name: "TRT Kurdî", category: "Uluslararası", color: "#6b8e23",
    source: hls("https://tv-trtkurdi.medya.trt.com.tr/master.m3u8") },
  { id: "trt-arabi", name: "TRT Arabi", category: "Uluslararası", color: "#b8860b",
    source: hls("https://tv-trtarabi.medya.trt.com.tr/master.m3u8"),
    fallback: yt("UC5GvVahlgulCyo4cshSmbcg") },
  { id: "trt-world", name: "TRT World", category: "Uluslararası", color: "#37474f",
    source: hls("https://tv-trtworld.medya.trt.com.tr/master.m3u8"),
    fallback: yt("UC7fWeaHhqgM4Ry-RMpM2YYw") },
  { id: "trt-belgesel", name: "TRT Belgesel", category: "Belgesel", color: "#00695c",
    source: yt("UCalAM_EpRfd9LNlp1AvxO2w") },

  // ---- Ulusal kanallar: resmî YouTube canlı yayınları ----
  { id: "show", name: "Show TV", category: "Genel", color: "#d81b60",
    source: yt("UC9JMe_We017gYrRc7kZHgmg"), site: "https://www.showtv.com.tr" },
  { id: "kanald", name: "Kanal D", category: "Genel", color: "#e53935",
    source: hls("https://demiroren.daioncdn.net/kanald/kanald.m3u8?app=kanald_web"),
    fallback: yt("UCFoe1tg8MuHjRzmqXtV816A"), site: "https://www.kanald.com.tr" },
  { id: "atv", name: "atv", category: "Genel", color: "#e64a19",
    source: yt("UCUVZ7T_kwkxDOGFcDlFI-hg"),
    fallback: yt("UCeUtFCS_4mlix3lxZsbX-6A"), site: "https://www.atv.com.tr" },
  { id: "now", name: "NOW TV", category: "Genel", color: "#7b1fa2",
    source: yt("UCJe13zu6MyE6Oueac41KAqg"),
    fallback: yt("UCxw5iQs7tt4qbcLa31shZ7Q"), site: "https://www.nowtv.com.tr" },
  { id: "star", name: "Star TV", category: "Genel", color: "#1e88e5",
    source: yt("UCsFINj3y7SjBaeUxiSdRjlA"), site: "https://www.startv.com.tr" },
  { id: "teve2", name: "teve2", category: "Genel", color: "#00acc1",
    source: yt("UCFJBVnqU3i74W3HeIcGFmYQ"), site: "https://www.teve2.com.tr" },
  { id: "a2", name: "a2", category: "Genel", color: "#f4511e",
    source: yt("UCNcexIxh3KbJUQYeh9FeSUA") },
  { id: "kanal7", name: "Kanal 7", category: "Genel", color: "#00897b",
    source: hls("https://kanal7-live.daioncdn.net/kanal7/kanal7.m3u8"),
    fallback: yt("UCcSTvyzpNjH__VgvDSArSEw"), site: "https://www.kanal7.com" },

  // ---- Haber ----
  // Dogus CDN'i varyant adresini bozuk uretiyor ("ntv_1080p.m3u8&?sid=..."),
  // hls.js bunu cozemiyor; bu yuzden YouTube birincil, HLS yedek.
  { id: "ntv", name: "NTV", category: "Haber", color: "#1565c0",
    source: yt("UC9TDTjbOjFB9jADmPhSAPsw"),
    fallback: hls("https://dogus.daioncdn.net/ntv/ntv.m3u8"), site: "https://www.ntv.com.tr" },
  { id: "cnnturk", name: "CNN Türk", category: "Haber", color: "#b71c1c",
    source: yt("UCV6zcRug6Hqp1UX_FdyUeBg"), site: "https://www.cnnturk.com" },
  { id: "ahaber", name: "A Haber", category: "Haber", color: "#c62828",
    source: yt("UCKQhfw-lzz0uKnE1fY1PsAA"), site: "https://www.ahaber.com.tr" },
  { id: "tgrt", name: "TGRT Haber", category: "Haber", color: "#283593",
    source: yt("UCzgrZ-CndOoylh2_e72nSBQ") },
  { id: "tv100", name: "TV100", category: "Haber", color: "#00838f",
    source: yt("UCndsdUW_oPLqpQJY9J8oIRg") },
  { id: "sozcu", name: "Sözcü TV", category: "Haber", color: "#ef6c00",
    source: yt("UCOulx_rep5O4i9y6AyDqVvw") },
  { id: "halktv", name: "Halk TV", category: "Haber", color: "#d32f2f",
    source: hls("https://halktv-live.daioncdn.net/halktv/halktv.m3u8"),
    fallback: yt("UCf_ResXZzE-o18zACUEmyvQ"), site: "https://halktv.com.tr" },
  { id: "haberglobal", name: "Haber Global", category: "Haber", color: "#455a64",
    source: yt("UCtc-a9ZUIg0_5HpsPxEO7Qg") },
  { id: "ulusal", name: "Ulusal Kanal", category: "Haber", color: "#c0392b",
    source: yt("UC6T0L26KS1NHMPbTwI1L4Eg"), site: "https://ulusal.com.tr" },

  // ---- Ekonomi ----
  { id: "ekoturk", name: "Ekotürk", category: "Ekonomi", color: "#00695c",
    source: yt("UCAGVKxpAKwXMWdmcHbrvcwQ"), site: "https://www.ekoturk.com" },
  { id: "tv24", name: "24 TV", category: "Haber", color: "#37474f",
    source: hls("https://turkmedya-live.ercdn.net/tv24/tv24.m3u8") },
  { id: "tbmm", name: "TBMM TV", category: "Haber", color: "#5d4037",
    source: hls("https://meclistv-live.ercdn.net/meclistv/meclistv.m3u8") },
  { id: "tv360", name: "TV360", category: "Genel", color: "#6a1b9a",
    source: hls("https://turkmedya-live.ercdn.net/tv360/tv360.m3u8") },
  { id: "tv4", name: "TV4", category: "Genel", color: "#ad1457",
    source: hls("https://turkmedya-live.ercdn.net/tv4/tv4.m3u8") },
  { id: "powerturk", name: "PowerTürk TV", category: "Müzik", color: "#e65100",
    source: hls("https://livetv.powerapp.com.tr/powerturkTV/powerturkhd.smil/playlist.m3u8") },
  { id: "powertv", name: "Power TV", category: "Müzik", color: "#bf360c",
    source: hls("https://livetv.powerapp.com.tr/powerTV/powerhd.smil/playlist.m3u8") },

  // ---- Spor ----
  { id: "aspor", name: "A Spor", category: "Spor", color: "#2e7d32",
    source: yt("UCJElRTCNEmLemgirqvsW63Q"), site: "https://www.aspor.com.tr" },
  { id: "bein", name: "beIN SPORTS Türkiye", category: "Spor", color: "#4527a0",
    source: yt("UCPe9vNjHF1kEExT5kHwc7aw") },
];

export const CATEGORIES: Category[] = [
  "Genel", "Haber", "Spor", "Ekonomi", "Çocuk", "Müzik", "Belgesel", "Uluslararası",
];

export const initials = (name: string) =>
  name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
