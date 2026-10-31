# Teknik devir ve doğrulama

## Prototipin kaynağı

Paket içindeki `prototip/dist/`, `c9da0a1b7a072470adc678f3f328e6995072ee55` anlık görüntüsünden alınmıştır. İçerik bağımsız çalışır. Hosting manifesti, Git verisi veya oturum bilgisi aktarılmamıştır.

- `index.html`: Türkçe ürün metinleri, HTML kontroller, anı ve mektup dialogları.
- `style.css`: önceki prototiplerden kalan bazı kullanılmayan kurallar da içerir. Asıl uygulamaya tamamını kopyalamayın; görsel hiyerarşiyi ve responsive niyeti referans alın.
- `app.js`: elle yazılmış JavaScript; hem WebGL hem perspektif Canvas çizim yolu içerir. İlk üretim uygulaması için okunabilir TypeScript modüllerine ayrılmalı.
- `vendor/three.module.min.js` ve `three.core.min.js`: Three.js 0.180.0 yerel kopyaları. Yeni projede paket yöneticisiyle kurulum ve lockfile tercih edilir.
- `fonts/`: yerel fontlar. Lisansları korunmalı.

## Yararlı kaynak bölgeleri

| Prototip bölümü | Nasıl yararlanılmalı? |
|---|---|
| `memories` | İçeriği görselden ayırma; yıldız rengi/kimliği, örnek başlık ve metin modeli |
| `configurePositions` | Farklı derinlik ve başlangıç kadrajı fikri; mevcut piksel oranına bağlı yeniden dağıtımı kalıcı dünya modeli olarak kopyalamayın |
| `destinationFor` | Masaüstü ve telefon için farklı varış kompozisyonları |
| `flightTo`, `frame` | Üç boyutlu eğri, hızlanma/fren, FOV ve bakış interpolasyonu |
| `arrive`, `updateProgress` | Varışta ziyaret işaretleme, tekrar ziyaretin tekilleştirilmesi |
| `updateConnections` | İlerideki altı yıldızlık takımyıldız; ilk pilotun zorunlu kapsamı değil |
| `projectLabels` | Dünya konumlarını HTML etiketlerine yansıtma ve örtülen etiketleri saklama |
| `setMotion` | Sistem/manuel hareket azaltma tercihi |
| `PerspectiveCanvasRenderer` | WebGL bulunmayan kontrol ortamı için yedek; yeni WebGL görünümünün kanıtı değil |

## Yeni uygulamanın önerilen ayrımı

`src/experience/` altında deneyim durumu ve sahne bileşenleri; `src/content/` altında anı verileri; `src/ui/` altında HTML kontroller ve anı paneli; `public/assets/` altında font ve yerel dokular. Shader dosyaları veya shader modülleri bulutsu/yıldız bileşenlerine yakın tutulabilir. Dosya adlarını repo geleneğine göre seçin; bu, birebir zorunlu bir klasör şeması değildir.

Kamera, etkileşim ve anı durumu aynı büyük component içinde karışmasın. React render döngüsü ile her-frame sahne güncellemesi ayrı tutulmalı. Tek `Canvas` ve tek ana render döngüsü yeterlidir.

### Durum modeli

`intro → travelling → arrived`, ayrıca overview, loading ve hata durumları. `selectedStarId`, `visitedStarIds`, `reducedMotion` ve kalite tercihi açık olarak yönetilir. Uçuş tamamlanma callback’i unmount veya yeni sahne kurulumundan sonra eski durumu yazamaz.

Component cleanup’ında event listener ve zamanlayıcılar kaldırılır; oluşturulan doku, geometry, material ve son işleme kaynakları uygun yaşam döngüsünde serbest bırakılır. React StrictMode çift kurulum/temizleme davranışında çoğalan render döngüsü veya ses oluşmamalı.

## Hareket ve dünya geometrisi

İki yıldız farklı Z değerlerine sahip olmalı. Yol üzerinde en az bir yakın ve bir uzak bulutsu bölgesi bulunmalı. Kamera hareketinde merkez çevre dönüşü ve ileri hareket birlikte hissedilmeli. Dünya uzayındaki geometriyi ekrana sabitlemek veya tüm nesneleri aynı transform ile taşımak, istenen derinlik etkisini vermez.

Yolculuğun tek sahibi bir kamera denetleyicisi olmalı. GSAP kullanılıyorsa timeline cleanup ve bitiş/iptal semantiği açık olmalı; Three.js frame döngüsüyle aynı transformların üzerine yazılmamalı.

## Başlangıç performans bütçesi

Aşağıdakiler tasarım başlangıcıdır, ölçülmüş garanti değildir. Görsel kaliteyi koruyarak gerçek cihaza göre ayarlanır.

| Konu | Başlangıç yaklaşımı |
|---|---|
| Piksel oranı | Telefon yaklaşık 1–1,35; masaüstü yaklaşık 1–1,75. Sınırsız cihaz DPR’ı kullanmayın. |
| Parçacıklar | Toplu çizim. Telefonda birkaç bin; masaüstünde ihtiyaç ve ölçüme göre daha fazla. |
| Bulutsular | Farklı derinliklerde yeterli katman; saydam overdraw maliyetine dikkat. |
| Son işleme | Kontrollü bloom; düşük kalite modunda önce maliyetli efektlerin çözünürlüğü/yoğunluğu azaltılır. |
| Shader | Mobilde örnekleme ve noise octave maliyeti sınırlı; hacimsel raymarch gerekirse ayrı kalite seviyesi. |
| React state | Her frame state güncellemesi yok. |
| Varlık yükleme | Kullanılan dokular/fontlar yerel; yükleme/hata durumu ele alınmış. |
| Sekme görünürlüğü | Gizli sekmede duraklat; dönüşte zaman farkı yüzünden kamera sıçramasın. |

Hedef 60 fps hissidir. İlk ölçümde sürekli 30 fps altına düşülüyorsa önce sahne bütçesi düzeltilmeli; görüntüleri paylaşırken bu açıkça raporlanmalı. Akıcılık, yalnızca bir ortalama FPS sayısıyla değerlendirilmez; belirgin takılmalar ve uçuş sırasındaki uzun frame’ler de incelenir.

### Nasıl ölçülmeli?

- Hedef cihaz, tarayıcı, viewport, DPR ve kalite seviyesi kaydedilir.
- Üretim derlemesiyle en az birkaç normal uçuş ve ileri/geri dönüş gözlemlenir.
- Mümkünse p50/p95 frame süreleri, belirgin uzun frame’ler, draw call/triangle bilgisi ve yükleme boyutu not edilir. Ölçülmeyen değer uydurulmaz.
- Birkaç tekrar sonrası kaynak sayılarının sürekli artıp artmadığı kontrol edilir; her ziyaret yeni GPU kaynaklarını sınırsız biriktirmemeli.
- Masaüstü ölçümü telefon performansı olarak sunulmaz. Emulator viewport testi gerçek iPhone GPU kabulü değildir.
- Pahalı debug sayaçları normal hediye arayüzünde kalmaz.

## Kontrol senaryoları

- İlk açılış; font ve varlıklar yüklendikten sonraki kadraj.
- İlk yıldıza tam süreli uçuş; uçuşun ortasında ve varışta görünüm.
- İkinci yıldız, geri dönüş, genel görünüm.
- Uçuş sırasında hızlı tıklama; ardışık animasyon veya kilitlenme oluşmaması.
- Anı paneli aç/kapat; aynı yıldız konumuna dönme.
- Sürükleyip bırakma; pointercancel ve yıldız seçme ayrımı.
- Ekran yönü/viewport değişimi; kontrollerin görünür kalması.
- Sistem hareket azaltma ve manuel düğme; tercih değişiminde kamera durumunun tutarlılığı.
- Gizli sekmeden dönme; zaman atlaması olmaması.
- WebGL başlatma veya doku yükleme hatası; kullanılabilir yedek.
- Klavye ile yıldız/rota seçimi; dialog içinde odak ve Escape ile kapatma.

## Şu ana kadar doğrulananlar

Önceki prototipin JavaScript sözdizimi kontrolü geçti. Kontrol tarayıcısında WebGL kapalıydı; **GPU sahnesi ve shader çıktısı görsel olarak doğrulanmadı**. Perspektif Canvas çiziminde masaüstü akışı, 390 × 844 telefon uçuşları, hareket azaltma, altı anı, genel görünüm ve mektup denendi. 768 × 1024 tablet görünümü incelendi. Gerçek iPhone/Safari kontrolü yapılmadı.

Yeni uygulama kendi kontrollerini gerektirir. Eski prototipin gözlemleri yeni WebGL uygulamasının kabul kanıtı sayılmaz.

## Resmî teknik kaynaklar

31 Ekim 2026 tarihinde incelenen kaynaklar. Agent kurulum anında kararlı sürümleri ve peer dependency uyumunu yeniden kontrol etmeli.

- React Three Fiber kurulumu ve React major sürümü eşleşmesi: https://r3f.docs.pmnd.rs/getting-started/installation
- Canvas, DPR ve renderer seçenekleri: https://r3f.docs.pmnd.rs/api/canvas
- Performans yaklaşımı: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- Bloom kontrolü: https://react-postprocessing.docs.pmnd.rs/effects/bloom
- Three.js PerspectiveCamera: https://threejs.org/docs/pages/PerspectiveCamera.html

React 19 / Fiber 9 uyumlu belgelenmiş bir başlangıçtır. Alpha Fiber belgelerini kararlı sürüm belgesi sanarak sürüm seçmeyin. Bloom, seçilmiş parlak malzemelere uygulanmalı; tüm görüntüyü parlatan tek bir eşik ayarı görsel okunurluğu bozabilir. Bu kaynaklar teknik olanakları açıklar; paketteki sanat yönü ve performans sayıları bu proje için belirlenen tasarım kararlarıdır.
