/**
 * Kanal kimliği -> tvyayinakisi.com kanal sayfası slug'ı.
 *
 * Program bilgisi yayın hakkı gerektirmez; bu sayfalar schema.org
 * BroadcastEvent formatında yapısal yayın akışı veriyor. Yalnızca
 * program adı ile başlangıç/bitiş saati alınır, tanıtım metinleri alınmaz.
 *
 * Listede olmayan kanallar (TRT Arabi, TBMM TV, PowerTürk TV) için
 * program bilgisi gösterilmez.
 */
export const EPG_SLUG: Record<string, string> = {
  trt1: "trt-1",
  "trt-haber": "trt-haber",
  "trt-cocuk": "trt-cocuk",
  "trt-muzik": "trt-muzik",
  "trt-avaz": "trt-avaz",
  "trt-turk": "trt-turk",
  "trt-kurdi": "trt-kurdi",
  "trt-world": "trt-world",
  "trt-belgesel": "trt-belgesel",
  show: "show-tv",
  kanald: "kanal-d",
  atv: "atv",
  now: "now",
  star: "star-tv",
  teve2: "teve2",
  a2: "a2",
  kanal7: "kanal-7",
  ntv: "ntv",
  cnnturk: "cnn-turk",
  ahaber: "a-haber",
  tgrt: "tgrt-haber",
  tv100: "tv100",
  sozcu: "sozcu-tv",
  halktv: "halk-tv",
  haberglobal: "haber-global",
  ulusal: "ulusal-kanal",
  ekoturk: "ekoturk",
  tv24: "24",
  tv360: "360",
  tv4: "tv-4",
  aspor: "a-spor",
  bein: "bein-sports-haber",
  powertv: "power-tv",
};
