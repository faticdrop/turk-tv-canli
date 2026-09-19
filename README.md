# Canlı TV · Türkiye

Türk televizyon kanallarını **yalnızca resmî ve halka açık yayın kaynaklarından**
izlemek için yapılmış web uygulaması.

## Kaynak politikası

İki tür kaynak kullanılır:

| Tür | Açıklama | Kanal sayısı |
|---|---|---|
| `hls` | TRT'nin kendi CDN'i üzerinden yayınladığı açık HLS akışları | 9 |
| `youtube` | Kanalın **doğrulanmış** resmî YouTube hesabındaki canlı yayını | 24 |

Korsan IPTV listeleri **bilinçli olarak kullanılmaz**: telif açısından sorunludur,
uygulama mağazalarından red alır ve linkler günler içinde ölür.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # üretim derlemesi
```

## Kanal ekleme

Tüm katalog tek dosyada: `src/data/channels.ts`

```ts
{ id: "ornek", name: "Örnek TV", category: "Genel", color: "#0b6fb8",
  source: { kind: "hls", url: "https://…/master.m3u8" },
  fallback: { kind: "youtube", channelId: "UC…" },   // opsiyonel
  site: "https://…" }
```

Birincil kaynak düşerse oynatıcı otomatik olarak `fallback` kaynağına geçer.

### YouTube kanal ID'si bulma

```bash
curl -s -A "Mozilla/5.0" -L "https://www.youtube.com/@KANAL_HANDLE/live" \
  | grep -o '"channelId":"UC[A-Za-z0-9_-]\{22\}"' | head -1
```

## Yayın sağlık kontrolü

`GET /api/health` tüm HLS kaynaklarını kontrol eder ve kırılanları listeler:

```json
{ "toplam": 23, "bozukSayisi": 0, "kanallar": [ { "name": "TRT 1", "status": "calisiyor" } ] }
```

Bu uç noktayı bir cron'a bağlamak **önemlidir** — yayın linkleri zamanla değişir,
düzenli kontrol edilmezse uygulama sessizce bozulur. Vercel'de `vercel.ts` içine:

```ts
crons: [{ path: "/api/health", schedule: "0 */6 * * *" }]
```

## Klavye ve kumanda kısayolları

| Tuş | İşlev |
|---|---|
| `↑` `↓` `←` `→` | Önceki / sonraki kanal (görünen listede) |
| `0`-`9` | Kanal numarasıyla doğrudan geçiş (iki haneli yazılabilir) |
| `F` | Tam ekran |
| `P` | Resim içinde resim (küçük pencere) |
| `S` | Favorilere ekle / çıkar |
| `/` | Arama kutusuna geç (`Esc` ile çık) |

Son izlenen kanal ve favoriler tarayıcıda saklanır, uygulama açıldığında kaldığı
yerden devam eder.

## Kanal resmî mi, nasıl anlaşılır?

Listeye kanal eklerken **yeniden yayıncı (korsan) hesaplardan** kaçınmak için üç
sinyale bakılır:

1. YouTube onay rozeti (`BADGE_STYLE_TYPE_VERIFIED`)
2. Abone sayısı
3. Kanalın kendi tanıttığı dış bağlantının yayıncının resmî alan adı olması

Örnek: TV8 aramasında çıkan canlı yayınların tamamı "Stres Müzik", "Barak Music
Company" gibi üçüncü taraf hesaplara aitti — onay rozeti ve resmî alan adı
bağlantısı olmadığı için **listeye alınmadı**. Aynı nedenle KRT TV ve Medya Haber
de dışarıda bırakıldı.

## Program rehberi (EPG)

Her kanalda **şu an ne oynadığı** ve **sıradaki program** gösterilir: oynatıcının
altında saat aralığı ve ilerleme çubuğuyla, kanal listesinde ve tam ekran
şeridinde program adıyla.

| | |
|---|---|
| Kaynak | tvyayinakisi.com kanal sayfaları |
| Biçim | schema.org `BroadcastEvent` (JSON-LD) |
| Kapsam | 39 kanalın 36'sı |
| Önbellek | Sunucuda 30 dakika |
| Tazeleme | Tarayıcıda 5 dakikada bir |

Program bilgisi **yayın hakkı gerektirmez** — saat ve program adı olgusal veridir.
Yalnızca ad ile başlangıç/bitiş saati alınır; tanıtım metinleri alınmaz.

Sayfalar HTML kazınmaz: veriler sayfadaki JSON-LD bloğundan okunur, bu yüzden
tasarım değişikliklerinden etkilenmez. Kanal eşleşmesi `src/data/epg-kaynak.ts`
içindedir. TRT Arabi, TBMM TV ve PowerTürk TV kaynakta listelenmediği için
onlarda program bilgisi gösterilmez.

### Neden bu kaynak?

Yayıncıların kendi siteleri denendi ve yetersiz kaldı: yalnızca TRT 1 ve TRT Spor
gerçek günlük akış veriyor; Show TV ile Kanal D sayfaları günlük akış değil
haftalık dizi vitrini. Digiturk'ün rehber ucu yurt dışı IP'lerine kapalı (403).

## Mobil kullanım

- **Video yukarıda sabit kalır.** Kanal listesi kaydırılırken yayın görünmeye
  devam eder; aşağı-yukarı kaydırıp durmak gerekmez.
- **Tam ekranda ekrana dokununca** altta yatay kaydırılabilir kanal şeridi açılır.
  Şerit ~4,5 saniye sonra kendiliğinden gizlenir, tekrar dokununca geri gelir.
  Şeritten seçilen kanala geçilir ve tam ekrandan çıkılmaz.
- **Sol üstteki ☰ Kanallar** düğmesi şeridi elle açar. YouTube kaynaklı
  kanallarda dokunuşlar iframe'in içinde kaldığı için bu düğme şarttır.

### Mobilde dikkat edilecek üç nokta

1. **Sticky bir grid öğesi sayfa boyunca yapışmaz**, yalnızca kendi grid alanı
   boyunca. Bu yüzden mobilde grid kapalıdır (`lg:grid`) ve oynatıcı blok
   akışında durur; kapsayıcısı tüm sayfa olduğu için yukarıda sabit kalabilir.
2. **Oynatıcının yüksekliği sınırlanmalıdır** (`max-h-[60vh]`). Aksi halde
   yatay moddaki telefonda 16:9 video ekrandan taşar ve altındaki düğmelerle
   kanal listesi erişilemez hale gelir.
3. **Kaplama düğmeleri dokunuşu yukarı iletmemelidir.** Sarmalayıcıdaki
   "dokununca şeridi göster" işleyicisi önce çalışır, ardından düğme onu geri
   kapatır; `☰` ve `✕` bu yüzden `stopPropagation` kullanır.

### Tam ekran neden CSS ile yapılıyor?

iPhone Safari `<div>` öğelerini gerçek tam ekrana alamaz; yalnızca `<video>`
etiketini alır, o da kendi yerel arayüzünü açtığı için kanal şeridi görünmez
olurdu. Bu nedenle tam ekran `fixed inset-0` ile kurulur ve destekleyen
tarayıcılarda ayrıca yerel tam ekran da denenir.

## Kaynak seçerken karşılaşılan engeller

Bir kanalın kaynağı çalışmıyorsa sebebi genelde şu dördünden biridir:

| Belirti | Sebep | Ne yapılır |
|---|---|---|
| iframe içinde "Video kullanılamıyor / nicht verfügbar" | Hak sahibi YouTube yayınının site dışında gösterimini engellemiş | Kanal listeden çıkarılır; yedeğe düşmek kullanıcıya bu ekranı gösterdiği için yedek de tanımlanmaz |
| Konsolda `ERR_FAILED` + CORS uyarısı | Kaynak CORS başlığı göndermiyor; sunucudan erişilse de tarayıcı engelliyor | Kanal kullanılamaz |
| Uzun süre "Yayın açılıyor", sonra yedeğe düşüş | Manifest açılıyor ama alt akış adresi bozuk/erişilemez | Çalışan kaynak birincil yapılır |
| `/api/live` 503 | Yayıncı o an canlı yayında değil | Beklenen durum; yayına girince kendiliğinden çalışır |

Ciner grubu (Bloomberg HT, HT Spor) ilk iki maddenin ikisine birden takıldı:
YouTube yayınları site dışına kapalı, HLS uçları CORS göndermiyor. Bu yüzden
listede yer almıyorlar.

NTV'de Doğuş CDN'i alt akış adresini bozuk üretiyor
(`ntv_1080p.m3u8&?sid=...` — `?` yerine `&?`), hls.js bunu çözemiyor.
Bu nedenle NTV'de YouTube birincil, HLS yedek.

### Kanal testi nasıl yapılmalı

YouTube kaynaklı bir kanalda **iframe'in var olması oynadığı anlamına gelmez.**
Doğru kontrol, iframe'in içine girip hem hata metnine hem de `video.currentTime`
değerinin ilerleyip ilerlemediğine bakmaktır. Ayrıca kanal başına en az 10 saniye
beklenmelidir; daha kısa pencerede yavaş açılan kanallar yanlışlıkla bozuk görünür.

## İleri / geri sarma

Ekrana dokununca oynatıcının ortasında kontrol çubuğu çıkar ve **5 saniye sonra
kendiliğinden kaybolur**. Adımlar: 1 dakika, 5 dakika, 30 dakika (her iki yöne)
ve canlı yayına dönmek için **CANLI** düğmesi.

Butonlar, o kanalda gerçekten gidilebilecek kadarına göre etkinleşir; pencerenin
dışına taşan adım pasif görünür. Böylece basıp hiçbir şey olmaması yerine neden
olmadığı anlaşılır.

### Hangi kanalda ne kadar geri gidilebilir?

Geri sarma, yayıncının CDN'inde tuttuğu pencere kadar mümkündür ve kanaldan
kanala çok değişir:

| Kanal | Pencere |
|---|---|
| TRT 1, TRT Avaz | ~24 saat |
| Halk TV | ~48 dakika |
| Kanal 7 | ~42 dakika |
| Kanal D | ~5 dakika |
| Diğer TRT kanalları, 24 TV, TBMM, TV360, TV4, Power | ~1 dakika (pratikte yok) |
| YouTube kaynaklı kanallar | yok |

**YouTube kanallarında kontrol çubuğu hiç gösterilmez.** YouTube'un gömülü canlı
oynatıcısı geri sarmayı kabul etmiyor: konum değiştirilse bile birkaç saniye
içinde kendini canlı uca geri çekiyor. Bu, `seekTo` API'si ile de,
`video.currentTime` doğrudan yazılarak da aynı şekilde davranıyor.

## Otomatik başlatma (dokunmadan oynatma)

Kanal seçilir seçilmez yayın kendiliğinden başlar; kullanıcının dokunması
gerekmez. Bunun çalışması için yayın **sessiz** başlatılır:

- Telefonlar ve masaüstü tarayıcılar **sesli** otomatik oynatmayı engeller,
  **sessiz** oynatmaya izin verir. Ses açıkken `play()` reddedilir ve kullanıcı
  dokunana kadar siyah ekran kalır.
- HLS tarafında `video.muted = true` ile başlanır; YouTube tarafında
  oynatıcı `mute: 1` ile kurulur.
- Sol altta **"Sesi aç"** düğmesi çıkar. Tek dokunuş sesi açar — bu bir kullanıcı
  hareketi olduğu için tarayıcı izin verir.
- Ses bir kez açıldıktan sonra oturum boyunca hatırlanır: sonraki kanallar
  doğrudan sesli açılır (`sesAcildi` bayrağı).

## YouTube neden ham iframe ile gömülmüyor?

Bazı yayıncılar (Ciner grubu) canlı yayınlarının YouTube dışında gösterilmesini
engelliyor. Ham `<iframe>` kullanıldığında bu durum kullanıcıya YouTube'un kendi
"video kullanılamıyor" ekranı olarak görünür ve uygulama bunu fark edemez —
çerçeve farklı kaynakta olduğu için içeriği okunamaz.

Bu yüzden oynatıcı resmî **IFrame Player API** ile kurulur: engel, `onError`
olayıyla (hata kodu 101/150) anında bildirilir. Uygulama bunu yakalayıp yedek
kaynağa geçer, yedek yoksa kendi hata ekranını gösterir.

Aynı sebeple Habertürk, Bloomberg HT ve HT Spor listede yer almıyor: YouTube
yayınları site dışına kapalı, HLS uçları da CORS göndermiyor.

## Oynatıcı notları (dikkat edilmesi gerekenler)

Bu üç tuzak uygulamayı sessizce bozar, değiştirirken dikkat:

1. **`canPlayType` ile Safari tespiti yapılmaz.** Chromium HLS MIME türü için
   `"maybe"` döndürür — boş olmayan, yani "doğru" sayılan bir değer. Buna güvenip
   `.m3u8` adresini doğrudan `<video src>` içine koymak Chrome'da
   `DEMUXER_ERROR_COULD_NOT_PARSE` verir. Doğru sıra: **önce `Hls.isSupported()`**,
   yerel oynatma yalnızca MSE yoksa (Safari/iOS) denenir.
2. **Manifest hatasında `hls.startLoad()` çağrılmaz.** Bu yalnızca parça yüklemeyi
   yeniden başlatır, manifesti tekrar istemez; kaynak 403 dönerse oynatıcı sonsuza
   kadar "yükleniyor" durumunda asılı kalır. Manifest hatalarında doğrudan yedek
   kaynağa geçilir.
3. **Tam ekranda şerit açıkken video kontrolleri gizlenir.** Aksi halde
   tarayıcının kendi kontrol çubuğu kanal şeridinin üzerine biner.
4. **Otomatik oynatma engeli hata değildir.** Tarayıcı sesli otomatik oynatmayı
   engellediğinde `play()` reddedilir; bu durumda hata katmanı değil "başlat"
   düğmesi gösterilir.

## Bilinen kısıtlar

- **TRT Spor, TRT 2, TV8, Tele1**: resmî ve açık bir canlı yayın kaynağı
  bulunamadı. (TV8 için YouTube'da yalnızca korsan yeniden yayınlar var.)
- **TRT Belgesel**: resmî YouTube hesabı var ama sürekli canlı yayın yapmıyor.
  Yayına girdiğinde kendiliğinden çalışır.
- **TRT Çocuk**: TRT'nin HLS ucu zaman zaman 403 döndürüyor; bu durumda oynatıcı
  otomatik olarak kanalın resmî YouTube yayınına geçer.
- Kanal logoları telif nedeniyle kullanılmaz; yerine baş harf döşemeleri gösterilir.

## YouTube canlı yayınları nasıl çözülüyor?

YouTube'un eski `embed/live_stream?channel=…` uç noktası **artık çalışmıyor**
("Bu video kullanılamıyor" hatası verir). Bunun yerine `/api/live/<channelId>`
rotası kanalın `/live` sayfasından o anki yayının video ID'sini çözer ve
oynatıcı `embed/<videoId>` adresini gömer. Sonuçlar 5 dakika bellekte tutulur.

## Telif

Yayınlar ilgili kanallara aittir. Uygulama hiçbir içeriği kopyalamaz, kaydetmez
veya yeniden yayınlamaz; yalnızca yayıncının kendi açık kaynağına bağlanır.
