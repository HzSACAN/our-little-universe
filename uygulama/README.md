# Bizim Küçük Evrenimiz — Y takımyıldızı, yıldıza dokunarak anılar ve mektup

Hazret’ten Yağmur’a, 6 Kasım için. Renkli, üç boyutlu bir uzayda farklı derinliklerdeki **altı anı yıldızı** arasında kamera yolculuğu. Genel görünümde altı yıldız, Yağmur’un baş harfi olan bir **Y** takımyıldızı oluşturur; anılar **yıldızın kendisine dokunarak** açılır; altı farklı yıldız keşfedilince mektup açılır.

Tüm anı metinleri, fotoğraf alanları ve mektup hâlâ açıkça **örnektir**. Gerçek anılar, fotoğraflar, mektup ve ilişkinin başlangıç yılı verilmedi ve uydurulmadı (bkz. “İçerik bekleyenler”).

Geliştirme `main` dalında sürüyor; önceki `fix/pilot-review-2026-10-31` dalı (PR #1) `main`’e birleştirildi. Önceki sürümlerin kayıtları en altta **tarihsel kayıt** olarak duruyor.

## Çalıştırma

Gereken: Node 20.19+ / 22.12+ ve pnpm.

```bash
pnpm install --frozen-lockfile
pnpm dev            # http://localhost:5173
pnpm typecheck      # TypeScript kontrolü
pnpm test           # durum makinesi, dokunuş koruması, Y grafiği, rota ve kadraj testleri
pnpm build          # tip kontrolü + üretim derlemesi (dist/)
pnpm preview        # üretim derlemesi: http://localhost:4173
```

Telefonda yerel ağdan denemek için `pnpm dev:host` (veya `pnpm build` ardından `pnpm preview:host`) ve komutun yazdırdığı yerel ağ adresini kullanın.

Ölçüm: adrese `?olcum` eklenirse arayüzde hiçbir şey görünmez; tarayıcı konsolunda `window.__olcum()` son frame sürelerini (p50/p95/p99), kalite kademesini, çizim çağrısı ve GPU kaynak sayılarını verir. `?olcum&kapat=nebula,post` katmanları kapatır; `?olcum&kademe=high|medium|low` kademeyi sabitler ve kalite yöneticisini devre dışı bırakır (yalnız ölçüm içindir).

### Otomatik tarayıcı kontrolleri

Yerelde Chrome ve **gerçek WebGL2 GPU’su** gerekir (`CHROME` ve `BASE` ortam değişkenleri; çıktı `scripts/.cikti/`). Üretim derlemesiyle: `BASE=http://localhost:4173`.

```bash
pnpm dogrula:yildiz     # yıldıza dokunma: fare/dokunma, sürükleme, çoklu dokunma, touchcancel, eş yıldız, odak
pnpm dogrula:dialog     # çakışan dialog istekleri: dokunuş + liste/yolculuk/ana sayfa/Escape, tek dialog kuralı
pnpm dogrula:ekranlar   # 360/430/844 ve masaüstü: taşma, 44 px, ipucu ve etiket çakışması, anı geçişi
pnpm dogrula:tur        # altı yıldız turu farklı sıralarla, Y genel görünümü, etiket çakışması
pnpm dogrula:mektup     # mektup kilidi, anıdan mektuba, Escape/odak, bağlam kaybı, WebGL yedeği
pnpm dogrula:etkilesim  # hızlı seçim, sürükleme, uçuşta boyut değişimi, gizli sekme, hareket azaltma, klavye
```

Her kontrol `GEÇTİ`/`KALDI` yazar; **tek bir `KALDI`, rapor edilen taşma/küçük hedef/çakışma, uygulama konsol hatası ya da betiğin yarıda kesilmesi komutu 1 ile bitirir** (`scripts/check.mjs`). Hata yolu: `node scripts/check.mjs --hata-yolu` bilerek başarısız olur ve 1 döndürür. Ayrıca: `scripts/perf.mjs` (sabit kademede uçuş ölçümü), `scripts/compare.mjs` (önce/sonra kareleri), `scripts/video.mjs` (kabul videosu, ffmpeg gerekir).

### Sürekli entegrasyon

`.github/workflows/ci.yml`: `main`’e her push’ta ve PR’larda kilitli kurulum (`pnpm install --frozen-lockfile`), tip kontrolü, birim testleri, üretim derlemesi ve doğrulama yardımcısının hata yolunun 1 ile çıktığı kontrol edilir. **GitHub Actions’ta GPU yoktur; `dogrula:*` tarayıcı kontrolleri CI’da çalışmaz** ve CI sonucu onların geçtiği anlamına gelmez. Onlar aşağıdaki yerel makinede çalıştırıldı.

## Teknoloji

React 19.3 · TypeScript 7 · Vite 8 · three 0.186 · @react-three/fiber 9.8 · @react-three/postprocessing 3.2 (postprocessing 6.39). Sürümler sabitlendi, `pnpm-lock.yaml` kilitli. three 0.187 yerine 0.186: postprocessing 6.39 eş bağımlılığı `three < 0.187` istiyor. Drei ve GSAP kullanılmadı. Kamerayı tek bir denetleyici yönetiyor. Bu sürümde yeni bağımlılık eklenmedi.

## Dosyalar ve sorumlulukları

| Dosya | Sorumluluk |
|---|---|
| `src/content/memories.ts`, `letter.ts` | Altı örnek anı ve **hikâye sırası**, benzersiz keşif kontrolü, örnek mektup. Görsel koddan ayrıdır; gerçek içerik buraya gelecek. |
| `src/experience/constellationGraph.ts` | **Y takımyıldızı**: yıldızların Y’deki rolü, genel görünüm göz noktasından yön/uzaklık düzeni ve hikâye sırasından bağımsız beş kenarlı bağlantı grafiği. |
| `src/experience/state.ts` | Deneyim durumu: `intro → travelling → arrived / overview`, ziyaretler, mektup kilidi, **birbirini dışlayan anı/mektup/liste dialogları**, `touchStar` (uzak yıldız → yolculuk, bulunulan yıldız → anı), varış kimliği, anısı açılmış yıldızlar. |
| `src/experience/tapGuard.ts` | Dokunuş koruması: sürükleme, pointercancel, çoklu dokunma ve varıştan önce başlayan basış anı açmaz. |
| `src/experience/world.ts` | Y düzeninden türetilen sabit dünya koordinatları, masaüstü/telefon kadrajları ve görüş açıları, yıldızlara çarpmayan 3B uçuş eğrisi. |
| `src/experience/CameraRig.tsx` | Kameranın tek sahibi: uçuş, bakış ve görüş açısı geçişi, sınırlı bakınma, yeniden hedefleme, hareket azaltma. |
| `src/experience/MemoryStars.tsx` | Altı yıldızın yüzeyi ve koronası; davet halkası, hover/odak tepkisi, anı açılırken korona genişlemesi ve yayılan ışık dalgası; eş yıldızın dünya konumu. |
| `src/experience/LabelProjector.tsx` | Etiketleri, bulunulan yıldızın erişilebilir dokunma hedefini (eş yıldız dahil) ve ipucunu gerçek projeksiyonla konumlar; metin, başlık ve gezinmeden kaçınır. |
| `src/experience/Nebula.tsx`, `nebulaLayout.ts`, `noiseTexture.ts` | Y çevresindeki damarlar boyunca hacim parçacıkları; damar başına ortak dünya gaz alanı; geniş gövde → orta doku → yalnız parlak kenar ve yoğunlaşmalarda ince ayrıntı; yumuşak toz; bölgesel renk vurguları; renk korumalı ton sıkıştırma; 4 kanallı 3B gürültü dokusu. |
| `src/experience/Sky.tsx`, `Starfield.tsx`, `Beacons.tsx` | Küp dokuya pişirilen lacivert/mavi atmosfer; keskin küçük yıldızlar ve seçilmiş az sayıda dört kollu parıltı; yakın toz; uzak anı yıldızlarının parıltısı. |
| `src/experience/Constellation.tsx` | Y kenarlarını iki ucu keşfedilince, korona kenarından başlayarak açar. |
| `src/experience/Scene.tsx`, `quality.ts`, `timing.ts` | Tek Canvas, bloom + ACES + vinyet, bağlam kaybı, kalite yöneticisi, ölçüm kancası. |
| `src/App.tsx`, `src/ui/*`, `src/styles.css` | HTML arayüz; `ui/StarTarget.tsx` yıldızın erişilebilir hedefi ve ipucu; `ui/Dialogs.tsx` yıldızdan doğan/oraya dönen anı geçişi. |
| `scripts/*.mjs` | Headless Chrome ile gerçek GPU’da otomatik kontroller, ölçüm, ekran görüntüsü ve video. |
| `docs/ekranlar-bulutsu-revizyon/` | 2 Kasım bulutsu revizyonu: Google referansı, 5d412ab, c9449cb ve revizyon aynı kadrajlarda. |
| `docs/ekranlar-y-surumu/` | Y sürümünün (c9449cb) önce/sonra karşılaştırmaları, kabul kareleri ve videoları. Eski klasörler önceki sürümlere aittir. |

## Bu turda yapılanlar (Claude, 2 Kasım 2026)

### A. Bulutsu görsel revizyonu — Hazret’in görsel kabulünü bekliyor

Geri bildirim: c9449cb daha ayrıntılı ama atmosferden uzaklaştı. Görüntüde kalın neon damarlar ve sert koyu oyuklar vardı, birçok renk aynı anda öne çıkıyordu. Önceki sürümün (5d412ab) renk uyumu ve yumuşak hacimleri daha başarılıydı. Hedef “daha keskin/kontrastlı/doygun” değil; bütünlüklü gaz hacimleri, doğal renk geçişleri ve seçili bölgelerde ince ayrıntı. Ana referans Google teması.

Aynı kadrajlardaki karşılaştırmada nedenler koddaydı. Bloom, blur ve genel doygunluk değiştirilmedi.

| c9449cb’deki neden | Görünen etki | Revizyon |
|---|---|---|
| Düşük frekanslı sırt gürültüsü (`pow(ridge,10)`, ölçek ×1,7) bütün gövdede tam güçle çiziliyordu. | Her yerde birbirine benzeyen kalın, kıvrımlı neon şeritler. | Bu katman kaldırıldı. İnce filament tek ve yüksek frekanslı (×3,8, `pow 18`). Yalnız gaz gövdesinin parlak kenar bandında ve damarın yoğunlaşma alanında görünür. |
| Kapsama alanı dar bir eşikle (`-0.12…0.42`) ve erken `discard` ile boşluk açıyordu. | Sert, siyah yarıklar. | Kapsama geniş ve yumuşak (`-0.5…0.55`): boşluklar gazın inceldiği koyu bölgeler. |
| Toz, keskin bir sırt alanından (`0.86…0.975`) geliyordu; alfa ×2,6. | Kabartma hissi veren koyu oyuklar. | Toz, düşük frekanslı bir alandan yumuşak geçişle gelir. Çekirdekleri örtmez; yoğunluğu ~%40’a indi. |
| Parçacık maskesi düzdü; gövde yüksek eşikliydi (`0.5…0.84`). | Yarı saydam geniş gaz gövdeleri kayboldu. | Merkezden kenara yumuşak maske ve düşük eşikli geniş gövde (`0.34…0.84`). Orta ölçekli doku fbm’den gelir. |
| Her damarda çekirdek rengi her yerde baskındı; birleştirmede doygunluk ×1,12. | Mor, turkuaz, fuşya, altın ve yeşil her bölgede aynı kuvvetteydi. | Renkler bölgesel bir alanla maskelenir: kenar rengi (çoğunlukla mavi/lacivert) her yerde, vurgu rengi yalnız yoğun kısımlarda ve kendi bölgesinde. Damar renkleri mavi, buz mavisi ve indigo ağırlıklı yeniden dağıtıldı. Doygunluk artışı kaldırıldı. |
| Keskinleştirme bütün görüntüye uygulanıyordu. | Sönük gaz da sertleşiyordu. | Keskinleştirme yalnız parlak bölgelerde. |
| Gökyüzü küp dokusu koyulaştırılmıştı. | Mavi atmosfer zemini yoktu. | 5d412ab’nin geniş lacivert/mavi atmosferi geri geldi; mor ve fuşya yalnız galaktik bant içinde. |

Damar başına **yoğunlaşma gücü** (`glow`) eklendi. Parlak, beyaza yaklaşan çekirdek ve ince kenar ayrıntısını yalnız seçili damarlar taşır:
- ana turkuaz-yeşil gövde (referanstaki ışıyan bölge);
- altın, şafak, fuşya ve sol kol bölgeleri daha az;
- arka plandaki geniş mavi hacimler neredeyse hiç.

Ortak dünya gaz alanı, damar ölçekleri, dünya konumları, paralaks, yakın tül katmanları, kademeler ve 4 kanallı gürültü dokusu korundu. Parça başına doku okuması yüksek kademede 9’dan 7’ye indi (aşağıda, performans). Özel hazırlanmış bulutsu dokusu kullanılmadı; gerekirse sonraki adım olarak mevcut 3B katmanlarla birlikte eklenebilir.

### B. Çakışan dialog istekleri

Hata yeniden üretildi (`scripts/race.mjs`, düzeltmeden önce **8 KALDI**):
- Anı dialogu 320 ms gecikmeyle açılıyordu.
- Başlık yalnız uçuşta kilitleniyordu ve liste ayrı bir `useState` ile açılıyordu.
- Yıldıza dokunup hemen “Anılarımız”a basınca liste açılıyor, ardından gecikmeli anı da açılıyordu. Ekranda iki dialog kalıyor ve Escape/odak bozuluyordu.

Düzeltme:
- **Liste reducer’a taşındı.** Anı, mektup ve liste aynı durumda, birbirini dışlayan alanlar:
  - `openList` açık ya da açılmayı bekleyen anının ve mektubun yerini alır;
  - `openLetter` listeyi ve bekleyen anıyı kapatır;
  - `travel` hepsini kapatır;
  - liste veya mektup açıkken `touchStar`/`openDetail` yok sayılır;
  - uçuşta liste açılmaz.
- **Bekleyen açılış iptal edilebilir.** Gecikme sırasında `open` false olursa zamanlayıcı temizlenir. Bu, liste, mektup, yolculuk veya ana sayfa geçişinde olur. Bekleme sırasında Escape açılışı iptal eder; dialog açılınca Escape yeniden tarayıcıya geçer, kapanış animasyonu korunur.
- **Son güvenlik:** zamanlayıcı dolduğunda başka bir dialog açıksa istek düşer ve durum kapatılır.

Testler:
- `state.test.ts` **tek dialog kuralı** bölümü 5 test ekler:
  - dokunuş + liste;
  - liste açıkken dokunuş;
  - mektup/liste geçişi;
  - yolculuk;
  - 200 rastgele giriş dizisinin her adımında en çok bir dialog.
- `pnpm dogrula:dialog` (`scripts/race.mjs`) gerçek fare ve klavye girdisiyle, açık dialog sayısını her animasyon karesinde izleyerek şu senaryoları dener:
  - dokunuş + hemen liste / yolculuk / genel görünüm / Escape;
  - liste açıkken yıldız hedefi;
  - hızlı giriş dizisi;
  - hareket azaltmada Enter/Escape ve odak dönüşü.

### Bu turun doğrulamaları

Aynı ortam: Windows 11, AMD Renoir entegre GPU, ANGLE/D3D11, Chrome headless gerçek GPU yolu, üretim derlemesi.

- **Temel kontroller:** `pnpm typecheck` ✔ · `pnpm test` ✔ **146/146** (7 dosya) · `pnpm build` ✔ · `node scripts/check.mjs --hata-yolu` → 1.
- **Yeni dialog kontrolü:** `dogrula:dialog` **17/17**. Düzeltmeden önce aynı betik **9 geçti, 8 kaldı**: iki dialog aynı anda açık kalıyordu (`memory-dialog` + `list-dialog`).
- **Diğer tarayıcı kontrolleri:**
  - `dogrula:yildiz` **34/34**
  - `dogrula:ekranlar` **156/156**
  - `dogrula:etkilesim` **23/23** + klavye **10/10**
  - `dogrula:mektup` **26/26**
  - `dogrula:tur` 1→6, 3,1,6,2,5,4 ve 6,5,4,3,2,1 sıralarında geçti.
- **Klavye betiğinde tespit ve düzeltme:** klavye betiği bu oturumda önce 3 kez **5 KALDI** ile 1 döndürdü. Varıştan hemen sonra Tab’a basıyordu; yıldız hedefi ise ilk projeksiyon karesine kadar ~130 ms gizli kalıyordu. Bugün GPU yavaş olduğundan bu süre uzamıştı.
  - Betiğe varıştan sonra 400 ms bekleme eklendi; ardından üç tekrarda **10/10** geçti.
  - Uygulama davranışı değişmedi: odak anı başlığında, sonraki Tab yıldız hedefinde.

### Bulutsu revizyonunun performansı (2 Kasım, aynı cihaz)

`scripts/perf.mjs`, sabit kademe, uçuş sırasında, dört uçuşun aralığı. **Bu oturumda GPU, 1 Kasım ölçümlerinden belirgin yavaştı.** Aynı c9449cb sürümü bugün 1440 yüksekte p50 19–34 ms verdi; 1 Kasım’da 14,5–19,4 ms’ydi. Bu yüzden karşılaştırma yalnız bu oturumda, iki sürüm sırayla çalıştırılarak yapıldı. 1 Kasım tablosuyla doğrudan karşılaştırılmamalıdır.

| Görünüm | Kademe | c9449cb p50 | revizyon p50 | c9449cb p95 | revizyon p95 |
|---|---|---:|---:|---:|---:|
| 1440×900 | yüksek | 19,4–31,5 ms | 20,1–30,1 ms | 26–40 ms | 27,3–43,6 ms |
| 1440×900 | düşük | 13,4–14,8 ms | 13,3–16,3 ms | 17,6–23,2 ms | 14,5–23,8 ms |
| 1920×1080 | yüksek | 26,8–50,4 ms | 26,8–46 ms | 38–119 ms | 35–55 ms |
| 1920×1080 | orta | 18,7–27,6 ms | 18,8–38 ms | 27–46 ms | 25,5–57 ms |
| 390×844 emülasyon | orta / 1,35 | 13,3 ms | 13,3–13,5 ms | 13,8–13,9 ms | 13,7–20,6 ms |
| 390×844 emülasyon | düşük / 1 | 13,3 ms | 13,3 ms | 13,6–13,8 ms | 13,7–13,8 ms |

İlk revizyon (5/4 oktav) yüksek ve orta kademede c9449cb’den ağırdı: 1440 yüksek p50 22–42 ms. Sebep, yumuşak ve geniş gövdelerin daha az parçayı erken atmasıydı. Ayrıntı artık ayrı bir kenar katmanından geldiği için iki değişiklik yapıldı:
- gövde fbm’i yüksek kademede 4, ortada 3 oktava indi;
- görünmeyecek kadar sönük kesitler gürültüden önce atılıyor.

Görüntü değişmedi. Sonuç:
- **1440 yüksek:** c9449cb ile aynı aralıkta.
- **1920 orta:** altına uçuşta daha ağır (p50 38 / 27,6 ms), diğer uçuşlarda eşit.
- **1920 yüksek:** bu entegre GPU’da iki sürümde de sürdürülemiyor; kalite yöneticisi kademeyi indiriyor.
- **Telefon emülasyonu:** iki kademede de tabanda.

Gerçek telefon ölçümü yapılmadı.

### Görsel kabul malzemesi (bu tur)

`docs/ekranlar-bulutsu-revizyon/`:

- `dortlu-referans-acilis.jpg`, `dortlu-referans-ucus.jpg`:
  - sol üst: Google referansı (tarayıcı çubuğu kırpıldı);
  - sağ üst: 5d412ab;
  - sol alt: c9449cb;
  - sağ alt: **revizyon**.
  - 1440×900 açılış ve ikiliye uçuşun ortası. Kadrajlar 16:9’a kırpıldı.
- `uclu-masaustu-<1..6>.jpg`, `uclu-telefon-<1..6>.jpg`: soldan sağa **5d412ab · c9449cb · revizyon**.
  - Kareler aynı betik ve adımlarla çekildi: açılış, altına uçuş ortası, altın varış, ikiliye uçuş ortası, ikili varış, genel görünüm.
  - Masaüstü yüksek kademededir. Telefon 390×844 emülasyonu, orta kademededir; gerçek telefonlar da ortadan başlar.
  - 5d412ab’de kademe sabitleme yoktu; orada kalite yöneticisinin seçtiği kademe kullanıldı.
  - Açılış ve genel görünüm, takımyıldız Y’ye geçtiği için 5d412ab’de farklı kadrajdadır.
- `revizyon-masaustu-acilis.jpg`, `revizyon-telefon-acilis.jpg`: revizyonun tam boy açılış kareleri.

**Bu yön, Hazret’in görsel kabulü gelene kadar tamamlanmış sayılmaz.** Kabul edilmezse ayarlanabilecek başlıca değişkenler: ana turkuaz-yeşil gövdenin parlaklığı ve kapladığı alan, ince kenar ayrıntısının miktarı, mavi ile mor/fuşya dengesi ve toz yoğunluğu. Gerekirse bunların yanına özel hazırlanmış bulutsu dokuları da eklenebilir.

## Önceki tur: Y sürümü (c9449cb, Claude, 1 Kasım 2026)

Aşağıdaki bulutsu tablosu c9449cb’nin değişikliklerini anlatır. Ortak dünya gaz alanı ve derinlik altyapısı korundu; görsel parametreleri 2 Kasım revizyonunda yeniden düzenlendi (yukarıda).

### 1. Bulutsu: sütlü/pastel bulanıklığın gerçek nedenleri

Yalnız bloom, doygunluk veya çözünürlük artırılmadı. Kodda bulunan nedenler ve düzeltmeleri:

| Neden | Etki | Düzeltme |
|---|---|---|
| Her parçacık **kendi rastgele tohumuyla** gürültü örnekliyordu. | Üst üste binen yüzlerce parçacığın deseni birbirini ortalıyor, kontrast düşüp sütlü bir sise dönüşüyordu (asıl neden). | Aynı damarın bütün parçacıkları **ortak, dünyaya bağlı bir gaz alanının** kesitlerini gösterir; parçacık yalnız maske olur. Üst üste binen kesitler aynı yapıyı güçlendirir. Alan ölçeği damar başına (70–360 birim). |
| Tek yumuşak yoğunluk eğrisi, her yerde emisyon. | Koyu boşluk yok, her yer pus. | Büyük ölçekli kapsama alanı damar içinde de düzensiz koyu boşluklar açar; boş bölgede pahalı ayrıntı hesaplanmaz (erken `discard`). |
| İnce yapı yalnız fbm’in yüksek oktavlarındaydı. | Büyütmede kayboluyordu. | İki ölçekte **sırt (ridged) gürültü** ile ince, keskin ışıklı filamentler; büyük gövde içinde ışıyan çekirdek katmanı. |
| Toplamsal karışım hiçbir şeyi karartamıyordu. | Koyu toz şeridi yoktu. | Alfa kanalı toz yoğunluğu olarak toplanır; birleştirme `bulutsu + gökyüzü × (1 − toz)`; gaz kendi tozuyla da kesilir. |
| Yoğun bölgeler 1,0’ı aşıp bloom eşiğine ve ACES beyazlatmasına taşıyordu. | Parlak bölgeler beyaza düzleşip ayrıntı bloom altında kayboluyordu. | Birleştirmede **renk korumalı yumuşak sıkıştırma** (en yüksek kanal ≤ 0,9): bulutsu bloom eşiğinin altında kalır, ışımayı yalnız yıldızlar yapar. |
| Ara hedef 0,6 / 0,5 / 0,34 çözünürlükte bilineer büyütülüyordu. | Ek bulanıklık. | 0,7 / 0,65 / 0,5 ve dört komşulu hafif keskinleştirme. Asıl kazanç çözünürlükten değil yukarıdaki alan değişikliğinden gelir. |
| Gökyüzü küp dokusu her yeri yumuşak mor bir pusla dolduruyordu. | Pastel zemin. | Zemin çoğunlukla koyu lacivert boşluk; renkli bölgeler ince ölçekle kümelere bölündü, toz damarları koyulaştı. |

Gürültü dokusu dört kanallı yapıldı (aynı alanın hücre boyundan uzak kaydırılmış kopyaları); parça başına doku okuması 13’ten 9’a indi. Kademeler: yüksek 5 oktav, orta 4, düşük 3; filament ve toz sırtları oktav sayısından bağımsız olduğundan **düşük kademede de ana filament yapısı korunur**. Bulutsular dünya içindeki farklı derinliklerde kalır; uçuşta paralaks ve yakın tül katmanları sürer. Yıldız alanında küçük yıldızlar net noktalar; parlak yıldızların yalnız küçük bir alt kümesi ince dört kollu parıltı taşır.

### 2. Anılar yıldıza dokunarak açılıyor

- Varış panelindeki “Anıyı aç” düğmesi kaldırıldı. Genel görünümde veya başka yıldızdayken uzak yıldıza (etiketine ya da kanvastaki gövdesine) dokunmak yolculuk başlatır; varıştan sonra bulunulan yıldıza dokunmak anıyı açar (`touchStar`). Önceden bulunulan yıldıza seçim reducer’da sessizce yok sayılıyordu; şimdi bu durum açıkça anı açmaya yönlenir.
- Dokunuşun başladığı andaki **varış kimliği** saklanır: yolculuğu başlatan ya da varıştan önce başlayan basış varışta anıyı açmaz; anı kendiliğinden de açılmaz. Sürükleme (>10 px), pointercancel ve ikinci parmak dokunuşu açmaz; uçuş sırasında yıldız hedefi yoktur ve reducer kilitlidir.
- İkili yıldızın ana gövdesi ve eş yıldızı (ayrı ≥44 px alan) aynı anıyı açar.
- **Erişilebilir HTML karşılığı:** yıldızın ekrandaki diskine oturan, en az 44 px’lik düğme (“Anıyı aç: başlık. Yıldıza dokun, anımızı keşfet.”); klavye odağı, Enter/Space; hover’da ince halka, odakta altın halka. Varıştan sonra Tab sırası başlıktan yıldıza geçer. WebGL yedeğindeki açık metin düğmeleri korundu.
- **Yönlendirme:** varıştan ~0,7 sn sonra yıldızın yanında, yüzeyi, metni ve gezinmeyi kapatmayan bir yana yerleşen kısa ipucu — dokunmatikte “Bu yıldızda bir anımız saklı. Dokun.”, masaüstünde “Bu yıldızda bir anımız saklı. Yıldıza dokun, anımızı keşfet.” Koronada nefes alan ince bir ışık halkası. Anı bir kez açıldıktan sonra ipucu ve davet halkası o yıldızda tekrarlanmaz.

### 3. Anının açılış geçişi

Yüzeyde kısa ışık tepkisi ve kontrollü korona genişlemesi → yüzeyden yayılan ince ışık dalgası ve seyrek kıvılcımlar (~1 sn) → ~0,3 sn sonra anı kartı yıldızın ekrandaki konumundan büyüyerek doğar; sahne hafifçe geri çekilip kararır. Kapanışta (✕, Escape, dışarı dokunma) kart aynı yıldıza küçülerek döner; bakış açılışta yıldıza yeniden yerleştiği için aynı kamera kadrajına dönülür. Sert beyaz flaş veya kamera sarsıntısı yok. Hızlı tekrar dokunma tek dialog bırakır (reducer kilidi ve açılıştan sonraki 650 ms’de dışarı dokunmanın yok sayılması). Hareket azaltmada ışık efektleri yok, kart sade bir solmayla açılır/kapanır. Odak dialoga girer, Escape kapatır, odak yıldızın erişilebilir hedefine döner (Safari’de tıklanan düğme odak almasa bile yedek hedef var); anıdan mektuba geçiş tek dialog bırakır.

### 4. Y takımyıldızı

- Altın (gövde ucu) → ikili → pembe (çatal) gövdeyi; turkuaz → mor sol kolu; şafak sağ kolu oluşturur. Hikâye sırası (`memories.ts`) ile bağlantı grafiği (`constellationGraph.ts`) ayrıdır; eski halkanın son yıldızdan ilkine kapanış kenarı yoktur.
- Konumlar, genel görünüm göz noktasından yön ve uzaklıkla tanımlanır; yıldızlar 700–3800 birim arasında **farklı derinliklerde** kalır, Y ekrana çizilmez ve uçuşta derinliği açığa çıkar. Hafif asimetri ve düzensiz aralıklar bilinçlidir. Masaüstü ve telefon aynı göz noktasından bakar (şekil bozulmaz): masaüstünde Y sağda; telefonda başlık ile metin arasında, biraz daha geniş görüş açısıyla.
- Bir kenar iki ucu keşfedilince açılır; farklı ziyaret sıraları her adımda aynı kenar kümesini ve aynı nihai Y’yi üretir. Mektup altı farklı keşifle açılır; belirli bir sıraya veya son numaralı yıldıza bağlı değildir.
- Testler: ağaç yapısı (5 kenar, döngü yok, tek çatal), 40 rastgele sırada önek eşitliği, kapanış kenarının yokluğu; altı ekran oranında Y okunurluğu (gövde yaklaşık dikey, kollar 55–110° açılır, kol/gövde oranı, kesişme yok, yıldızlar arası ≥ ~55 px, masaüstünde sağ yarı, telefonda başlık ile metin arası) ve 84 yönlü uçuş rotası.

### 5. Teknik eksikler

- `scripts/check.mjs`: bütün doğrulama betikleri başarısızlıkları sayar ve 1 ile biter; taşma, küçük hedef, etiket/ipucu çakışması ve uygulama konsol hatası otomatik başarısızlıktır; beklenmeyen istisna da başarısızlıktır ve tarayıcı her durumda kapanır. Chrome başlatılamazsa açık hata verir.
- Hata yolu gerçekten doğrulandı: `node scripts/check.mjs --hata-yolu` 1 döndürür; ayrıca geliştirme sırasında `dogrula:etkilesim` ve `dogrula:mektup` gerçek birer başarısızlıkta 1 ile bitti (aşağıda).
- GitHub Actions temel CI eklendi (yukarıda). Diğer düzeltmeler: ilk çizim ile resize dinleyicisi arasında kaçan boyut değişimi; açılış metninin etiket yerleştirmede engel sayılmaması.

## Doğrulananlar (c9449cb, 1 Kasım)

Ortam: Windows 11, AMD Radeon entegre GPU (Renoir, ANGLE/Direct3D11), Chrome headless gerçek GPU yolu, üretim derlemesi (`pnpm build` + `pnpm preview`). Canvas `data-renderer="webgl2"`. Ekran 75 Hz olduğundan **13,3 ms tabandır**.

- `pnpm typecheck` ✔ · `pnpm test` ✔ **141/141** (7 dosya) · `pnpm build` ✔ (başlangıç JS gzip ≈79 kB, sahne gzip ≈284 kB)
- `dogrula:yildiz` **34/34**: uzak yıldıza dokunma yolculuk başlatır; uçuşta hedef yok; varışta anı kendiliğinden açılmaz; ipucu görünür, yüzeyi ve paneli kapatmaz; yıldızda başlayan sürükleme açmaz; hover halkası; dokunma anıyı açar, hızlı ikinci dokunma tek dialog bırakır; kart yıldızdan doğar, ✕ ile yıldıza döner, odak yıldız hedefine döner; ipucu tekrarlanmaz; Space/Enter; eş yıldız ve ana gövde aynı anıyı açar; varıştan önce başlayan basış açmaz; genel görünümde uzak yıldıza dokunma; hareket azaltmada solma; telefonda iki parmak, dokunarak sürükleme ve touchcancel açmaz, tek dokunma açar.
- `dogrula:ekranlar` **156/156**: 360×740, 430×932, 844×390, 1440×900, 1920×1080’de açılış, varış (ipucu dahil), ikili yıldız ve Y genel görünümünde yatay taşma yok, görünür düğmeler ≥44 px, panel/gezinme çakışması yok, etiketler birbirleriyle ve metinle çakışmıyor, ipucu taşmıyor/çakışmıyor; her görünümde gerçek fare/dokunma girdisiyle yıldıza dokunma anıyı açtı ve kart taşmadı.
- `dogrula:tur`: 1→6 (1440×900), 3,1,6,2,5,4 (360×740) ve 6,5,4,3,2,1 (844×390) sıralarında mektup yalnız altıncı farklı keşifte açılabiliyor; Y genel görünümünde altı etiket görünür ve çakışmasız; konsol temiz.
- `dogrula:mektup` **26/26**, `dogrula:etkilesim` **23/23**, klavye **10/10**.
- Gizli sekme kontrolü (“gizliyken uçuş ≤ %2 ilerledi”) zamanlamaya duyarlı: bir çalıştırmada %2,03 ile **KALDI** ve komut 1 ile bitti; iki tekrarda %1,2 ve %0,6 ile geçti. İlerleme sekme gizlenene kadar geçen birkaç kareden geliyor; gizliyken uçuş duruyor. Eşik değiştirilmedi.
- Geliştirme sırasında `dogrula:mektup` 4 KALDI ile 1 döndürdü (betik, yıldız hedefi ilk karede konumlanmadan odaklanıyordu; betik düzeltildi, uygulama davranışı doğru).

### Ölçülen performans — c9449cb (1 Kasım oturumu)

`scripts/perf.mjs`, sabit kademe (`?olcum&kademe=…`), uçuş sırasında, dört uçuşun aralığı. GPU kaynakları sabit kaldı (12–13 geometri; 20/16/12 doku; 13–14 program; tur boyunca yalnız açılan Y kenarları kadar geometri artışı).

| Görünüm | Kademe / DPR | p50 | p95 | Not |
|---|---|---:|---:|---|
| 1440×900 | yüksek / 1 | 14,5–19,4 ms | 21,7–27,9 ms | entegre GPU’da kalite yöneticisi zaman zaman ortaya indiriyor |
| 1440×900 | düşük / 1 | 13,3 ms | 13,7–13,8 ms | |
| 1920×1080 | yüksek / 1 | 22,4–29,3 ms | 32,6–46 ms | bu GPU’da sürdürülemez; yönetici iner |
| 1920×1080 | orta / 1 | 13,5–15,1 ms | 20,6–21,8 ms | |
| 390×844 telefon emülasyonu | orta / 1,35 | 13,3 ms | 13,6–13,7 ms | **masaüstü GPU’sunda emülasyon; telefon ölçümü değildir** |
| 390×844 telefon emülasyonu | düşük / 1 | 13,3 ms | 13,7–13,8 ms | aynı not |

### Aynı betikle önceki sürüm (5d412ab, kalite yöneticisi açık)

| Görünüm | Kademe | p50 | p95 |
|---|---|---:|---:|
| 1440×900 | yüksek | 13,4–13,9 ms | 17,2–27,7 ms |
| 1920×1080 | yüksek → orta | 13,3–25,8 ms | 15,1–39,8 ms |
| 390×844 emülasyon | orta | 13,3 ms | 13,7–13,8 ms |

Sonuç: yeni bulutsu bu entegre GPU’da yüksek kademede 1440’ta p50’yi ~1–5 ms artırıyor; 1920’de önceki sürüm gibi orta kademeye iniliyor ve orada akıcı. Telefon kademeleri emülasyonda tabanda. Gerçek telefon GPU’sunda ölçüm yapılmadı.

## Görsel kabul malzemesi

Bu turun malzemesi yukarıda (“Görsel kabul malzemesi (bu tur)”). 1 Kasım (c9449cb) malzemesi, `docs/ekranlar-y-surumu/`:

- `once-sonra-<masaustu|telefon>-<1..6>.jpg`: aynı betik, aynı GPU ve aynı adımlarla **solda önceki sürüm (5d412ab), sağda bu sürüm**: açılış, altına uçuşun ortası, altın varış, ikiliye uçuşun ortası, ikili varış, genel görünüm. Açılış ve genel görünüm kareleri Y düzeni nedeniyle bilerek farklı kadrajdadır; varış kareleri aynı yıldız kadrajındadır. “Sonra” kareleri, kalite yöneticisinin o çekimde seçtiği **orta** kademededir.
- `v-*`: 360×740 açılış ve Y, 430×932 ipucu ve anı kartı, 844×390 ipucu ve Y, 1440×900 ipucu ve anı kartı, 1920×1080 Y; `s-*`: yıldıza dokunarak açılan anı (masaüstü ve telefon).
- `video-masaustu-ucus-dokunma-ani.mp4`, `video-telefon-ucus-dokunma-ani.mp4` (~26 sn, gerçek hızda): açılış → uçuş → varış ipucu → yıldıza dokunma → ışık dalgası ve kartın yıldızdan doğması → kapanış → ikili yıldıza uçuş → genel görünüm. Bulutsu ayrıntısının uçuş sırasında korunduğu buradan izlenebilir.

**Görsel kabul Hazret’e aittir**; bu dosyalar kabul değil, kabul için malzemedir.

## Bekleyenler

### Gerçek cihazda bekleyenler

Gerçek iPhone/Safari ve Android cihaza erişim olmadı; masaüstü emülasyonu gerçek cihaz kabulü sayılmadı. Kısa manuel kontrol (aynı Wi-Fi’de, `pnpm build` ardından `pnpm preview:host`, yazdırılan ağ adresi):

1. Açılış: Y başlık ile metin arasında okunuyor mu, etiketler çakışıyor mu? Telefonu yatay çevirip tekrar bakın.
2. “Yolculuğumuza başla”: uçuş akıcı mı (takılma, uzun donma)? Bulutsu uçuşta ayrıntılı mı?
3. Varışta “Bu yıldızda bir anımız saklı. Dokun.” görünüyor mu; yıldızı veya metni kapatıyor mu?
4. Yıldızda başparmakla sürükleyin → anı açılmamalı; iki parmakla dokunun → açılmamalı; tek dokunun → ışık dalgası ve kart yıldızdan açılmalı. Çabuk iki kez dokunun → tek kart.
5. Kartı ✕ ile kapatın → kart yıldıza dönmeli. İkili yıldızda küçük pembe eş yıldıza dokunun → aynı anı.
6. “Hareketi azalt” (iOS) / “Animasyonları kaldır” (Android) açıkken sayfayı yenileyip bir anı açın → sade solma.
7. iPhone’da VoiceOver ile yıldız hedefi “Anıyı aç: …” diye okunuyor ve çift dokunmayla açılıyor mu?
8. Mümkünse `?olcum` ile açıp Safari Web Inspector / Chrome uzak hata ayıklamada `window.__olcum()` sonucunu (kademe, p50/p95) not edin.

### İçerik bekleyenler

Gerçek anılar, fotoğraflar ve mektup gelmedi; bu bölüm tamamlanmış sayılmadı. İçerik `src/content/memories.ts` ve `letter.ts`’e, fotoğraflar `public/` altına (mobil/masaüstü kadrajı, boyut, gecikmeli yükleme ve alternatif metinle) eklenecek; örnek etiketleri yalnız gerçek içerikle değiştirilen alanlardan kaldırılacak. Tarih, başlangıç yılı, olay veya söz uydurulmadı.

### Görsel kabul bekleyenler

**2 Kasım bulutsu revizyonu** (`docs/ekranlar-bulutsu-revizyon/`): açılış/genel görünüm yönü onaylanana kadar tamamlanmış sayılmaz. Ayrıca: toz miktarı, parıltılı yıldız sayısı, ipucunun konumu ve dili, anı geçişinin süresi, Y’nin biçimi (özellikle kol açıları ve telefondaki boyutu). Bilinen: R3F kaynaklı `THREE.Clock` kullanım dışı uyarısı sürüyor.

---

## Tarihsel kayıt — altı yıldızlı halka sürümü (5d412ab, 31 Ekim 2026)

Aşağıdakiler önceki sürüme aittir; bu sürümün sonucu değildir. Takımyıldız o sürümde halkaydı ve anılar “Anıyı aç” düğmesiyle açılıyordu.

### O sürümde yapılanlar

- **Genel görünüm yeniden kurgulandı.** Önceki konumlarda uzak yıldızlar sağ üstte kümeleniyor ve takımyıldız çizgileri birbirini kesiyordu. Altı yıldız, açılış kadrajında hikâye sırasıyla derinliğe doğru kıvrılan, kendini kesmeyen bir halka oluşturacak biçimde yeniden yerleştirildi (z derinlikleri korundu). Telefon için aynı dünyaya ayrı bir kamera kadrajı, etiket kutuları da hesaba katılarak arandı.
- **Uzak yıldız parıltıları** eklendi: genel görünümde her yıldız kendi renginde okunuyor, yaklaşınca gerçek yüzey görünür oluyor.
- **Dört yeni yıldıza ayrı karakter.** Turkuaz yıldız yapısız beyaz bir küre, mor yıldız ise rehberin istemediği bantlı bir gaz devi gibi görünüyordu. Turkuaza manyetik plazma iplikleri, mora dev konveksiyon hücreleri ve macenta kenar, şafak yıldızına altından pembeye dönen iki ton ve uzun korona iplikleri verildi.
- **Takımyıldız çizgileri** yıldız merkezinden değil korona kenarından başlıyor; önceden çizgi şafak yıldızının yüzeyinin önünden geçiyordu.
- **Etiket çakışmaları** giderildi: çakışan etiket yıldızın üstüne veya yanına geçiyor, başlık ve alt gezinmeden kaçınıyor (844×390’da 04/05 çakışması ve başlıkla temas düzeltildi).
- **Telefon yerleşimi:** açılışta “02” etiketinin “HAZRET’TEN YAĞMUR’A” satırıyla çakışması giderildi. Telefonda ve alçak yatay ekranda tamamlanma paneli kısaltıldı; “Sana bir mektup” düğmesi artık iki kez görünmüyor. Telefon etiketleri kompakt; dokunma hedefi halkanın kendisi (en az 44 px).
- Derin bölge için yeni bulutsu damarları; yıldız alanı yeni konumlara genişletildi; ölçüm çıktısına kalite kademesi eklendi; altı yıldız ve mektup için yeni kontrol betikleri (`tour.mjs`, `letter.mjs`).

### O sürümde doğrulananlar

Ortam: Windows 11, AMD Radeon entegre GPU (Renoir, ANGLE/Direct3D11), Chrome headless, gerçek GPU yolu. Çalışan sayfanın bu derlemenin dosyalarını yüklediği `performance` kayıtlarıyla doğrulandı (ör. `index-DEHxHtAj.js` / `Scene-QEL0vkjB.js`; hash’ler her derlemede değişir). Canvas `data-renderer="webgl2"`. Konsolda uygulama hatası ve shader derleme hatası yok.

- `pnpm typecheck` ✔ · `pnpm test` ✔ **124/124** (5 dosya; iki düzende 84 yönlü rota ve altı ekran oranında takımyıldızın kendini kesmemesi dahil) · `pnpm build` ✔ (başlangıç JS gzip 77,6 kB, sahne gzip 281 kB)
- Altı yıldıza tek tek uçuş ve varış: yüzey, korona, ikili yıldızın eş yıldızı ve yörünge izi, çizgiler ve etiketler görüldü. Uçuşlar 3,9–5,0 sn.
- Farklı ziyaret sıraları (1→6; 3,1,6,2,5,4; 2,4,6,1,3,5; 5,2,6,3,2,4): beş keşifte mektup kilitli ve başlıktaki mektup düğmesi açılmıyor; altıncı farklı keşifte açılıyor; tekrar ziyaret sayacı artırmıyor.
- Anı kartından “Mektubunu aç”: tek açık dialog, odak mektupta; Escape ile kapanıyor ve odak sayfadaki “Anıyı aç” düğmesine dönüyor. Başlıktaki mektup düğmesi klavyeyle açılıyor; Escape sonrası odak o düğmeye dönüyor. Klavyeyle başlatma, varışta odağın başlığa geçmesi ve anı kartı ayrıca doğrulandı.
- Genel görünümde altı yıldız ve tamamlanan takımyıldız: 1440×900, 1920×1080, 360×740, 430×932 ve 844×390’da görünür etiketlerde çakışma yok.
- 360×740, 430×932, 844×390, 1440×900, 1920×1080: yatay taşma yok, görünür düğmeler ≥44 px, panel ile gezinme çakışmıyor (açılış ve varışta otomatik ölçüm; genel görünüm ekran görüntüleriyle incelendi).
- Hızlı tekrar seçim tek uçuş; uçuşta gezinme kilitli; kanvasta ve etikette başlayan sürükleme uçuş başlatmıyor; uçuş ortasında masaüstü→telefon boyut değişimi yolculuğu yeniden hedefliyor ve ziyaretleri koruyor; hareket azaltma düğmeyle (geçiş ~0,7 sn) ve sistem tercihiyle çalışıyor.
- Sekme gizlendiğinde uçuş 2,5 sn boyunca ilerlemedi (gizlenme anına kadar bir-iki karelik, ≈%1 ilerleme); dönüşte sıçramadan tamamlandı.
- WebGL bağlam kaybı: yedek okuma görünümüne geçiyor, 6/6 ziyaret korunuyor; “Gökyüzünü yeniden dene” WebGL2 sahnesini yeniden kuruyor ve ziyaretler korunuyor. Bu sırada three’nin kendi “Context Lost” ve “WEBGL_lose_context extension not supported” uyarıları konsola düşüyor.
- WebGL yokken: altı anı okunarak 5/6’da mektup kilitli, aynı anı tekrar sayılmıyor, altıncıda mektup açılıyor; Escape ile kapanıp odak mektup düğmesine dönüyor.

#### O sürümün ölçülen performansı (üretim derlemesi, uçuş sırasında)

| Görünüm | Kademe / DPR | p50 | p95 | GPU kaynakları |
|---|---|---:|---:|---|
| 1440×900 masaüstü | yüksek / 1 | 13,3–13,4 ms | 14,1–19,6 ms | 18 geometri, 20 doku, 14 program |
| 1920×1080 masaüstü | yüksek / 1 | 14,4–18,6 ms | 21,2–28,5 ms | 18 / 20 / 14 |
| 390×844 telefon emülasyonu | orta / 1,35 | 13,3 ms | 13,6–13,8 ms | 18 / 16 / 14 |

Dokuz uçuşluk turlarda (tamamlandıktan sonra üç tekrar ziyaret dahil) kaynak sayıları sabit kaldı; geometri artışı yalnız açılan altı takımyıldız çizgisinden ibaret. Çizim çağrısı 23–46. Bu headless Chrome ölçümleri **masaüstü entegre GPU’sundadır**; telefon emülasyonu telefon GPU’su ölçümü değildir.

## Tarihsel kayıt — iki yıldızlık pilot

Aşağıdaki ölçüm ve kontroller önceki iki yıldızlık sürüme aittir; bu sürümün sonucu değildir.

### İki yıldızlık pilot kontrolleri (48acfbb)

Ortam: Windows 11, AMD Radeon entegre GPU (Renoir, ANGLE/Direct3D11), Chrome headless (gerçek GPU yolu). WebGL2 çizimi doğrulandı (`UNMASKED_RENDERER`: AMD Radeon Graphics, D3D11). Ekran görüntülerinin tamamı WebGL sahnesinden alındı; Canvas yedeği yoktur.

- `pnpm typecheck` ✔ · `pnpm test` ✔ 22/22 · `pnpm build` ✔ (JS ≈ 357 kB gzip, CSS 4 kB)
- Uçuşlar: açılış→altın ~3.1–3.4 sn, altın→ikili ~4.0–4.2 sn, geri ~3.8–4.1 sn, genel görünüm ~3.1–3.3 sn.
- Otomatik etkileşim senaryoları: hızlı tekrar tıklama tek uçuş; uçuşta gezinme kilitli; kanvasta ve etikette başlayan sürükleme uçuş başlatmıyor; anı dialogu Enter ile açılıp Escape ile kapanıyor, odak geri dönüyor, kamera yerinde; uçuş ortasında masaüstü→telefon boyutu değişimi yolculuğu yeni kadraja yeniden hedefliyor, ziyaretler korunuyor; düğme ve sistem tercihiyle hareket azaltma (geçiş ~0.9 sn); listeden yolculuk; WebGL kapatıldığında anı listesi. Konsol hatası yok.
- Sekme gizlenince çizim durdu, dönüşte uçuş sıçramadan devam etti (gizlenme anına kadar geçen çok kısa bir ilerleme görüldü).
- 360×740, 430×932, 844×390 (yatay) ve 1440×900, 1920×1080: yatay taşma yok, görünür düğmeler ≥44 px, panel ile gezinme çakışmıyor.
- GPU kaynakları dört uçuş boyunca sabit (11 geometri, 20 doku, 12 program).

#### Pilot performansı (iki yıldız; bu sürümün ölçümü değildir)

| Görünüm | DPR | p50 | p95 | Not |
|---|---:|---:|---:|---|
| 1440×900 masaüstü, yüksek kalite | 1 | 16.8 ms | 30.6 ms | entegre AMD GPU |
| 1920×1080 masaüstü, yüksek kalite | 1 | 26.6–29.5 ms | 39.4–44.8 ms | ilk saniyeler |
| 1920×1080, kalite yöneticisi orta kademeye indikten sonra | 1 | 14.1 ms | 29.2 ms | ~6 sn içinde otomatik; kaynak sayısı sabit |
| 360/430 px telefon emülasyonu, orta kalite | 1.35 | 13.3 ms | 13.7 ms | **masaüstü GPU’sunda emülasyon; telefon ölçümü değildir** |

İlk sürümde bulutsu tam çözünürlükte simplex gürültüyle çiziliyordu ve aynı GPU’da kare başına ~200 ms sürüyordu. Gökyüzü küp dokuya pişirildi, bulutsu düşük çözünürlüklü ara hedefe ve doku tabanlı gürültüye taşındı.

### Bağımsız inceleme düzeltmeleri (0179524)

Başlangıç commit’i: `48acfbb5a382fedead7a72f3ff0b5d7e2e418184`.

- Kalite yöneticisi artık aktif sahnede 250 ms’den uzun kareleri yok saymıyor. Sabit 120 kare beklemek yerine ısınma sonrası iki ardışık iki saniyelik pencereyi değerlendiriyor; böylece çok yavaş GPU’da da tepki verebiliyor.
- Kamera yolculuğu süresi düşük FPS’te 50 ms ile kırpılmıyor. Görünmeyen sekmeden dönüşün ilk delta’sı ayrıca atlanıyor; aktif uçuş zamanı gerçek geçen süreyle ilerliyor.
- Mipmap bloom için etkisiz `resolutionScale` yerine kaliteye bağlı `levels` (8/6/4) kullanılıyor. Bu bir çözünürlük ayarı olarak raporlanmıyor.
- Ekran düzeni ve basit bakış sınırları Three.js’ten ayrıldı. Başlangıç JS’i 620,02 kB → 241,04 kB (gzip 177,20 → 75,79 kB). Bu **ilk paket** azalmasıdır; 3B sahne desteklenen cihazda ayrıca indirilir.
- WebGL1-only cihazlar artık WebGL2 sahnesini başlatmaya çalışmadan erişilebilir yedeğe geçer.
- Uçuş sırasında anı listesi düğmesi de kilitlenir; seçimin sessizce yok sayıldığı durum önlenir. Yıldız etiketleri aynı frame’in güncel kamera matrisini kullanır.
- Geliştirme önizlemesi için yalnız `terminal.local` ek host olarak kabul edilir; tüm hostlara açık bir ayar yoktur.

Kontroller: `pnpm typecheck`, **37/37 test**, `pnpm build`, `git diff --check` geçti. Yeni testler düşük FPS’te uçuş süresini, gizli sekmeden dönüşü, çok yavaş karelerde kalite düşüşünü ve WebGL2 gereksinimini kapsıyor.

İlk kod incelemesi Linux/Node 24 ortamında, WebGL bulunmayan kontrol tarayıcısıyla yapıldı. Ardından kullanıcı yerel sunucuyu açınca **`0179524` sürümünün gerçek WebGL2 yolu bağlı Chrome’da doğrulandı** (`index-BcYzalt3.js`, `Scene-DtXHGss8.js`). İki yıldız arasında normal yolculuk, geri dönüş, genel görünüm, listeden seçim, anı kartı, Escape ile odak geri dönüşü, sürükleme ve manuel hareket azaltma denendi. 360×740, 430×932 ve 844×390 viewport’ları incelendi; 360 px görünümde görünür düğmeler en az 44 px, 360/430 px görünümlerde yatay taşma yoktu. Uygulamadan gelen konsol hatası görülmedi; bilinen R3F/THREE.Clock uyarısı devam ediyor.

Canlı incelemede yatay telefon metninin yıldızın parlak bölgesine uzanabildiği görüldü; yalnız bu yerleşimde anı paneli en fazla `42vw` ile sınırlandı. Bu son CSS ayarı yerel üretim derlemesine yeniden alınmalı. Sayısal FPS/GPU kaynak ölçümü bu canlı kontrolde tekrarlanmadı; önceki Windows/AMD değerleri tarihsel kayıttır. Viewport kontrolü gerçek iPhone/Safari veya Android cihaz kabulü değildir.

Ayrıntılar ve sonraki aşama: [İnceleme notları](docs/INCELEME-2026-10-31.md).
