# Bizim Küçük Evrenimiz — iki yıldızlık pilot ve altı yıldız geliştirme noktası

> **Güncel dal notu:** Altı yıldız, takımyıldız ve mektup için derlenebilir bir geliştirme noktası eklendi; yeni sürümün WebGL ve görsel kabulü tamamlanmadı. Mevcut uygulanan kapsam ve Claude için kalan işler: [Devir kaydı](docs/DEVIR-ALTI-YILDIZ-2026-10-31.md). Aşağıdaki pilot kapsamı ve performans ölçümleri önceki iki yıldızlık teslimin tarihsel kaydıdır.

Hazret’ten Yağmur’a, 6 Kasım için. Bu klasör, başlangıç paketindeki şartnamelere göre kurulan ilk gerçek uygulamadır: renkli, üç boyutlu bir uzayda **iki anı yıldızı** arasında kamera yolculuğu. Altı yıldız, takımyıldız ve mektup bu aşamanın kapsamında değil; içerikler açıkça **örnektir**.

## Çalıştırma

Gereken: Node 20.19+ / 22.12+ ve pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm typecheck      # TypeScript kontrolü
pnpm test           # durum makinesi ve uçuş geometrisi testleri
pnpm build          # tip kontrolü + üretim derlemesi (dist/)
pnpm preview        # üretim derlemesi: http://localhost:4173
```

Telefonda yerel ağdan denemek için `pnpm dev:host` ve `http://<bilgisayarın-yerel-IP'si>:5173` kullanın. Üretim derlemesi için `pnpm build` ardından `pnpm preview:host`; varsayılan önizleme portu `4173` olur. Komutun yazdırdığı gerçek adresi esas alın.

Ölçüm: adrese `?olcum` eklenirse arayüzde hiçbir şey görünmez; tarayıcı konsolunda `window.__olcum()` son frame sürelerini (p50/p95/p99), çizim çağrısı ve GPU kaynak sayılarını verir. `?olcum&kapat=nebula,post` gibi katmanlar tek tek kapatılabilir.

## Teknoloji

React 19.3 · TypeScript 7 · Vite 8 · three 0.186 · @react-three/fiber 9.8 · @react-three/postprocessing 3.2 (postprocessing 6.39). Sürümler sabitlendi, `pnpm-lock.yaml` üretildi. three 0.187 yerine 0.186: postprocessing 6.39 eş bağımlılığı `three < 0.187` istiyor. Drei ve GSAP kullanılmadı. Kamerayı tek bir denetleyici yönetiyor.

## Dosyalar ve sorumlulukları

| Dosya | Sorumluluk |
|---|---|
| `src/content/memories.ts` | İki örnek anı (başlık, özet, metin, fotoğraf notu). Görselden ayrı. |
| `src/experience/state.ts` | Deneyim durumu: `intro → travelling → arrived / overview`, ziyaretler, uçuş kimliği (eski uçuş durumu yazamaz). |
| `src/experience/world.ts` | Sabit dünya koordinatları, masaüstü/telefon kadrajları, yıldızlara çarpmayan 3B uçuş eğrisi, süre ve yumuşatma. |
| `src/experience/CameraRig.tsx` | Kameranın tek sahibi: uçuş, bakış geçişi (quaternion), FOV genişlemesi, sınırlı sürükleyerek bakınma, yeniden hedefleme, hareket azaltma. |
| `src/experience/Nebula.tsx` + `nebulaLayout.ts` | Kıvrımlı damarlar boyunca dizilmiş hacim parçacıkları; düşük çözünürlüklü ara hedefe çizilip sahneye eklenir. |
| `src/experience/noiseTexture.ts` | Açılışta bir kez üretilen döşenebilir 3B gürültü dokusu (bulutsu shader’ı için). |
| `src/experience/Sky.tsx` | Uzak galaktik ışık; açılışta küp dokuya pişirilir, sahne arka planı olur. |
| `src/experience/Starfield.tsx` | Uzak kabuk, yol boyu yıldızlar ve kameraya bağlı sarılan yakın toz + uçuşta kısa toz izleri. |
| `src/experience/MemoryStars.tsx` | Altın yıldız (granülasyon, korona iplikleri) ve ikili yıldız (akan bantlı buz mavisi yüzey, lavanta kenar, yörüngede pembe-beyaz eş yıldız ve sönen iz). |
| `src/experience/LabelProjector.tsx` | Yıldız etiketlerini gerçek projeksiyonla konumlar; ekran dışı / öndeki yıldızın arkası gizlenir. |
| `src/experience/Scene.tsx` | Tek Canvas, bloom + ACES ton eşleme + hafif vinyet, WebGL bağlam kaybı, kalite yöneticisi, ölçüm kancası. |
| `src/experience/quality.ts` | Kalite kademeleri (DPR sınırı, parçacık sayısı, bulutsu çözünürlüğü/oktav, bloom geçiş sayısı). |
| `src/experience/hooks.ts` | Ekran düzeni, hareket azaltma, sekme görünürlüğü, WebGL tespiti, sürükleme (pointercancel, çoklu dokunuş). |
| `src/App.tsx`, `src/ui/*` | HTML arayüz: açılış, varış paneli, gezinme, yıldız etiketleri, anı ve liste dialogları, WebGL yoksa erişilebilir yedek. |
| `src/styles.css` | Masaüstü ve telefon için ayrı yerleşimler; güvenli alan, `100dvh`, 44 px dokunma alanları. |
| `scripts/*.mjs` | Headless Chrome ile gerçek GPU’da otomatik kontroller ve ekran görüntüleri (`pnpm dogrula:*`). |
| `docs/ekranlar/` | Teslimdeki ekran görüntüleri. |

## İlk teslimde yapılan kontroller (31 Ekim 2026, önceki commit)

Ortam: Windows 11, AMD Radeon entegre GPU (Renoir, ANGLE/Direct3D11), Chrome headless (gerçek GPU yolu). WebGL2 çizimi doğrulandı (`UNMASKED_RENDERER`: AMD Radeon Graphics, D3D11). Ekran görüntülerinin tamamı WebGL sahnesinden alındı; Canvas yedeği yoktur.

- `pnpm typecheck` ✔ · `pnpm test` ✔ 22/22 · `pnpm build` ✔ (JS ≈ 357 kB gzip, CSS 4 kB)
- Uçuşlar: açılış→altın ~3.1–3.4 sn, altın→ikili ~4.0–4.2 sn, geri ~3.8–4.1 sn, genel görünüm ~3.1–3.3 sn.
- Otomatik etkileşim senaryoları: hızlı tekrar tıklama tek uçuş; uçuşta gezinme kilitli; kanvasta ve etikette başlayan sürükleme uçuş başlatmıyor; anı dialogu Enter ile açılıp Escape ile kapanıyor, odak geri dönüyor, kamera yerinde; uçuş ortasında masaüstü→telefon boyutu değişimi yolculuğu yeni kadraja yeniden hedefliyor, ziyaretler korunuyor; düğme ve sistem tercihiyle hareket azaltma (geçiş ~0.9 sn); listeden yolculuk; WebGL kapatıldığında anı listesi. Konsol hatası yok.
- Sekme gizlenince çizim durdu, dönüşte uçuş sıçramadan devam etti (gizlenme anına kadar geçen çok kısa bir ilerleme görüldü).
- 360×740, 430×932, 844×390 (yatay) ve 1440×900, 1920×1080: yatay taşma yok, görünür düğmeler ≥44 px, panel ile gezinme çakışmıyor.
- GPU kaynakları dört uçuş boyunca sabit (11 geometri, 20 doku, 12 program).

### Ölçülen performans (üretim derlemesi, uçuş sırasında)

| Görünüm | DPR | p50 | p95 | Not |
|---|---:|---:|---:|---|
| 1440×900 masaüstü, yüksek kalite | 1 | 16.8 ms | 30.6 ms | entegre AMD GPU |
| 1920×1080 masaüstü, yüksek kalite | 1 | 26.6–29.5 ms | 39.4–44.8 ms | ilk saniyeler |
| 1920×1080, kalite yöneticisi orta kademeye indikten sonra | 1 | 14.1 ms | 29.2 ms | ~6 sn içinde otomatik; kaynak sayısı sabit |
| 360/430 px telefon emülasyonu, orta kalite | 1.35 | 13.3 ms | 13.7 ms | **masaüstü GPU’sunda emülasyon; telefon ölçümü değildir** |

İlk sürümde bulutsu tam çözünürlükte simplex gürültüyle çiziliyordu ve aynı GPU’da kare başına ~200 ms sürüyordu. Gökyüzü küp dokuya pişirildi, bulutsu düşük çözünürlüklü ara hedefe ve doku tabanlı gürültüye taşındı.

## Bilinen eksikler

- **Gerçek iPhone/Safari ve gerçek Android cihaz kontrolü yapılmadı.** Telefon görünümü yalnızca masaüstü Chrome’da emüle edildi; mobil GPU performansı ölçülmedi.
- Uçuş videosu kaydedilmedi; yerine uçuş ortası ekran görüntüleri var.
- Fotoğraflar, gerçek anı metinleri ve ilişkinin başlangıç yılı verilmedi; uydurulmadı.
- İlk teslimde three ana paketteydi; aşağıdaki inceleme düzeltmesinde 3B sahne dinamik pakete ayrıldı.
- R3F içinden gelen `THREE.Clock` kullanım dışı uyarısı konsolda görünür (kütüphane kaynaklı).
- Bulutsu kenarları düşük çözünürlüklü ara hedef nedeniyle bilinçli olarak yumuşaktır; çok ince damar ayrıntısı bu kalite/performans dengesinin sonucudur.

## Nasıl değerlendirilmeli

1. `pnpm dev` ile açın; masaüstünde ve telefonda (yerel ağ) “Yolculuğumuza başla”.
2. Uçuş sırasında bulutsuların ve yakın tozun kameraya göre farklı hızlarda geçtiğine, iki yıldızın derinlik farkına bakın.
3. Altın yıldızdan ikili yıldıza, sonra “←” ile geri ve “Tüm evreni gör”.
4. Varışta sürükleyerek bakının, “Anıyı aç” ile kartı açıp kapatın.
5. Sağ üstteki dalga düğmesiyle hareketi azaltın.
6. Renk yoğunluğu, yıldız yüzeyleri ve yerleşim için geri bildirim, altı yıldızlık sürüme geçmeden önce alınmalı.


## Bağımsız inceleme düzeltmeleri (31 Ekim 2026)

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
