# Bizim Küçük Evrenimiz — altı yıldız, takımyıldız ve mektup

Hazret’ten Yağmur’a, 6 Kasım için. Renkli, üç boyutlu bir uzayda farklı derinliklerdeki **altı anı yıldızı** arasında kamera yolculuğu; keşfedilen komşu yıldızlar arasında açılan takımyıldız çizgileri ve altı farklı yıldız keşfedilince açılan mektup. Tüm anı metinleri, fotoğraf alanları ve mektup açıkça **örnektir**; gerçek anılar, fotoğraflar, mektup ve ilişkinin başlangıç yılı verilmedi ve uydurulmadı.

Bu sürüm, Codex’in `74d07a4` kontrol noktasından devam edilerek görsel olarak iyileştirildi ve gerçek WebGL2 sahnesinde doğrulandı (ayrıntılar aşağıda). Önceki iki yıldızlık pilotun ölçümleri en altta **tarihsel kayıt** olarak duruyor.

## Çalıştırma

Gereken: Node 20.19+ / 22.12+ ve pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm typecheck      # TypeScript kontrolü
pnpm test           # durum makinesi, rota ve içerik testleri
pnpm build          # tip kontrolü + üretim derlemesi (dist/)
pnpm preview        # üretim derlemesi: http://localhost:4173
```

Telefonda yerel ağdan denemek için `pnpm dev:host` (veya `pnpm build` ardından `pnpm preview:host`) ve komutun yazdırdığı yerel ağ adresini kullanın.

Ölçüm: adrese `?olcum` eklenirse arayüzde hiçbir şey görünmez; tarayıcı konsolunda `window.__olcum()` son frame sürelerini (p50/p95/p99), kalite kademesini, çizim çağrısı ve GPU kaynak sayılarını verir. `?olcum&kapat=nebula,post` gibi katmanlar tek tek kapatılabilir.

Otomatik tarayıcı kontrolleri (yerelde Chrome gerekir; `CHROME` ve `BASE` ortam değişkenleriyle ayarlanır, çıktı `scripts/.cikti/`):

```bash
pnpm dogrula:tur        # altı yıldız turu, genel görünüm, etiket çakışması, ölçüm
pnpm dogrula:mektup     # mektup kilidi, anıdan mektuba, Escape/odak, bağlam kaybı, WebGL yedeği
pnpm dogrula:etkilesim  # hızlı seçim, sürükleme, uçuşta boyut değişimi, gizli sekme, hareket azaltma
pnpm dogrula:ekranlar   # 360/430/844 ve masaüstünde taşma ve 44 px hedefleri
```

## Teknoloji

React 19.3 · TypeScript 7 · Vite 8 · three 0.186 · @react-three/fiber 9.8 · @react-three/postprocessing 3.2 (postprocessing 6.39). Sürümler sabitlendi, `pnpm-lock.yaml` kilitli. three 0.187 yerine 0.186: postprocessing 6.39 eş bağımlılığı `three < 0.187` istiyor. Drei ve GSAP kullanılmadı. Kamerayı tek bir denetleyici yönetiyor. Yeni bağımlılık eklenmedi.

## Dosyalar ve sorumlulukları

| Dosya | Sorumluluk |
|---|---|
| `src/content/memories.ts`, `letter.ts` | Altı örnek anı, benzersiz keşif kontrolü, sabit hikâye sırasındaki takımyıldız kenarları, örnek mektup. |
| `src/experience/state.ts` | Deneyim durumu: `intro → travelling → arrived / overview`, ziyaretler, mektup kilidi, yedek akışta keşif, uçuş kimliği (eski uçuş durumu yazamaz). |
| `src/experience/world.ts` | Sabit dünya koordinatları (açılış kadrajında kendini kesmeyen bir halka), masaüstü/telefon kadrajları, yıldızlara çarpmayan 3B uçuş eğrisi. |
| `src/experience/CameraRig.tsx` | Kameranın tek sahibi: uçuş, bakış geçişi, FOV genişlemesi, sınırlı bakınma, yeniden hedefleme, hareket azaltma. |
| `src/experience/MemoryStars.tsx` | Altı yıldızın yüzeyi ve koronası: altın/pembe granülasyon, ikili yıldızın akan bantları ve eş yıldızı, turkuaz plazma iplikleri, mor dev konveksiyon hücreleri, şafak yıldızının altından pembeye iki tonu. |
| `src/experience/Beacons.tsx` | Uzak yıldızlar için kendi renginde, en az birkaç düzine piksellik ışınlı parıltı; yaklaşınca söner. |
| `src/experience/Constellation.tsx` | Keşfedilen komşular arasında açılan çizgiler; korona kenarından başlar, yüzeyin önünden geçmez. |
| `src/experience/LabelProjector.tsx` | Etiketleri gerçek projeksiyonla konumlar; çakışmada etiketi yıldızın altına, üstüne veya yanına alır; başlık ve gezinme alanından kaçınır. |
| `src/experience/Nebula.tsx` + `nebulaLayout.ts` | Kıvrımlı damarlar boyunca hacim parçacıkları; derin bölümdeki yıldızların çevresi ve geçitleri dahil. |
| `src/experience/Sky.tsx`, `Starfield.tsx`, `noiseTexture.ts` | Küp dokuya pişirilen uzak ışık, katmanlı yıldız alanı, yakın toz, bulutsu gürültü dokusu. |
| `src/experience/Scene.tsx`, `quality.ts`, `timing.ts` | Tek Canvas, bloom + ACES + vinyet, bağlam kaybı, kalite yöneticisi, ölçüm kancası. |
| `src/App.tsx`, `src/ui/*`, `src/styles.css` | HTML arayüz: açılış, varış ve tamamlanma panelleri, altı duraklı gezinme, anı/liste/mektup dialogları, WebGL yedeği; masaüstü ve telefon için ayrı yerleşim. |
| `scripts/*.mjs` | Headless Chrome ile gerçek GPU’da otomatik kontroller ve ekran görüntüleri. |
| `docs/ekranlar-alti-yildiz/` | Bu sürümün WebGL2 ekran görüntüleri. `docs/ekranlar/` iki yıldızlık pilota aittir. |

## Bu sürümde yapılanlar (Claude, 31 Ekim 2026)

- **Genel görünüm yeniden kurgulandı.** Önceki konumlarda uzak yıldızlar sağ üstte kümeleniyor ve takımyıldız çizgileri birbirini kesiyordu. Altı yıldız, açılış kadrajında hikâye sırasıyla derinliğe doğru kıvrılan, kendini kesmeyen bir halka oluşturacak biçimde yeniden yerleştirildi (z derinlikleri korundu). Telefon için aynı dünyaya ayrı bir kamera kadrajı, etiket kutuları da hesaba katılarak arandı.
- **Uzak yıldız parıltıları** eklendi: genel görünümde her yıldız kendi renginde okunuyor, yaklaşınca gerçek yüzey görünür oluyor.
- **Dört yeni yıldıza ayrı karakter.** Turkuaz yıldız yapısız beyaz bir küre, mor yıldız ise rehberin istemediği bantlı bir gaz devi gibi görünüyordu. Turkuaza manyetik plazma iplikleri, mora dev konveksiyon hücreleri ve macenta kenar, şafak yıldızına altından pembeye dönen iki ton ve uzun korona iplikleri verildi.
- **Takımyıldız çizgileri** yıldız merkezinden değil korona kenarından başlıyor; önceden çizgi şafak yıldızının yüzeyinin önünden geçiyordu.
- **Etiket çakışmaları** giderildi: çakışan etiket yıldızın üstüne veya yanına geçiyor, başlık ve alt gezinmeden kaçınıyor (844×390’da 04/05 çakışması ve başlıkla temas düzeltildi).
- **Telefon yerleşimi:** açılışta “02” etiketinin “HAZRET’TEN YAĞMUR’A” satırıyla çakışması giderildi. Telefonda ve alçak yatay ekranda tamamlanma paneli kısaltıldı; “Sana bir mektup” düğmesi artık iki kez görünmüyor. Telefon etiketleri kompakt; dokunma hedefi halkanın kendisi (en az 44 px).
- Derin bölge için yeni bulutsu damarları; yıldız alanı yeni konumlara genişletildi; ölçüm çıktısına kalite kademesi eklendi; altı yıldız ve mektup için yeni kontrol betikleri (`tour.mjs`, `letter.mjs`).

## Doğrulananlar (bu sürüm)

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

### Ölçülen performans (bu sürüm, üretim derlemesi, uçuş sırasında)

| Görünüm | Kademe / DPR | p50 | p95 | GPU kaynakları |
|---|---|---:|---:|---|
| 1440×900 masaüstü | yüksek / 1 | 13,3–13,4 ms | 14,1–19,6 ms | 18 geometri, 20 doku, 14 program |
| 1920×1080 masaüstü | yüksek / 1 | 14,4–18,6 ms | 21,2–28,5 ms | 18 / 20 / 14 |
| 390×844 telefon emülasyonu | orta / 1,35 | 13,3 ms | 13,6–13,8 ms | 18 / 16 / 14 |

Dokuz uçuşluk turlarda (tamamlandıktan sonra üç tekrar ziyaret dahil) kaynak sayıları sabit kaldı; geometri artışı yalnız açılan altı takımyıldız çizgisinden ibaret. Çizim çağrısı 23–46. Bu headless Chrome ölçümleri **masaüstü entegre GPU’sundadır**; telefon emülasyonu telefon GPU’su ölçümü değildir.

## Kalanlar ve test edilemeyenler

- **Gerçek iPhone/Safari ve gerçek Android cihaz kontrolü yapılmadı**; mobil GPU performansı ölçülmedi. Telefon görünümleri masaüstü Chrome’da emüle edildi.
- Ayrık GPU, yüksek DPR’lı (2+) masaüstü ekran ve Safari/Firefox masaüstü denenmedi.
- Uçuş videosu kaydedilmedi; yerine ekran görüntüleri var.
- Görsel kabul Hazret’e ait: renk yoğunluğu, yıldız yüzeyleri (özellikle turkuaz yıldızın sulu dokusu) ve takımyıldız halkasının biçimi geri bildirime açık.
- Gerçek anılar, fotoğraflar, mektup metni ve başlangıç yılı geldiğinde `content/` dosyaları güncellenmeli; örnek etiketleri ancak o zaman kaldırılmalı.
- R3F kaynaklı `THREE.Clock` kullanım dışı uyarısı sürüyor.

## Nasıl değerlendirilmeli

1. `pnpm build` ve `pnpm preview` ile açın; masaüstünde ve telefonda (yerel ağ) “Yolculuğumuza başla”.
2. Yıldızları farklı sırayla gezin; uçuşta bulutsuların ve yakın tozun farklı hızlarda geçtiğine bakın.
3. “Tüm evreni gör” ile keşfedilen yıldızlar arasında açılan çizgileri izleyin.
4. Altıncı yıldızdan sonra genel görünümdeki takımyıldızı ve “Sana bir mektup”u açın.
5. Sağ üstteki dalga düğmesiyle hareketi azaltın; telefonu yan çevirip deneyin.

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
