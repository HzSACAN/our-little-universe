# İlk uygulama görevi — renkli uzayda iki yıldız arasında yolculuk

Bu projeyi yerelde uygulayan frontend/creative development agentısın. Görevi çalışan, görsel olarak incelenebilir bir ilk teslimle tamamla. Yalnızca plan veya kurulum yapıp bırakma.

## Önce bağlamı edin

Çalışma alanındaki AGENTS.md ve diğer repo kurallarını oku. Ardından bu paket içinde şu kaynakları bul ve incele:

1. `00-BURADAN-BASLA.md`
2. `01-PROJE-SARTNAMESI.md`
3. `02-GORSEL-VE-HAREKET-REHBERI.md`
4. `04-TEKNIK-DEVIR.md`
5. `referanslar/uzay-gorsel-referansi.png` — görseli gerçekten açıp incele.
6. `prototip/dist/index.html`, `style.css` ve `app.js` — çalışan etkileşim referansı.

Paket çalışma alanının bir alt dizinindeyse yolları oradan çöz. Canlı prototip bağlantısı hesapla giriş isteyebilir; buna ihtiyacın yok, kaynaklar yerelde mevcut.

## Yapılacak iş

Hazret’in, Yağmur için 6 Kasım yıl dönümüne hazırladığı “Bizim Küçük Evrenimiz” sitesinin ilk gerçek uygulamasını oluştur. Yağmur hitabını kullan. İlk ilişkinin yılı, gerçek anılar ve fotoğraflar verilmedi; bunları uydurma. Örnek içerikler örnek olarak anlaşılmalı.

Etkileşim kararı kesin: gerçek üç boyutlu uzayda, farklı uzaklıklarda bulunan anı yıldızları arasında kamera yolculuğu. Mevcut prototip bu hareketin referansıdır. Görsel kaliteyi ise referans ekran görüntüsündeki renkli uzay yönünde belirgin biçimde yükselt:

- Derin mavi/mor uzay; turkuaz, pembe/fuşya ve sıcak altın ışıklarla aydınlanan kıvrımlı bulutsular.
- Farklı uzaklıklarda yıldızlar, yakın yıldız tozları, yumuşak korona ve kontrollü ışık yayılması.
- Kamera ilerlerken bulutsuların ve parçacıkların arasından geçildiği anlaşılmalı.
- Bir düz arka planın önünde büyütülen küreler veya paneller arası geçiş bu görevi karşılamaz.
- Google arayüzünü ve tarayıcı öğelerini taşımayacaksın. Görsel, atmosfer referansıdır.

İlk teslimi **iki anı yıldızıyla** sınırla: sıcak altın bir yıldız ve mavi/lavanta bir ikili yıldız. İlk yıldıza giriş, ikinci yıldıza geçiş, geri yolculuk, genel görünüm, sınırlı bakınma ve örnek anı kartları çalışsın. Diğer dört yıldız ve mektup akışını bu aşamada genişletme.

## Uygulama yapısı

Mevcut uygulama varsa önce inceleyip uygun biçimde ilerlet. Yalnızca bu paket varsa paket kökünde `uygulama/` klasöründe React + TypeScript + Vite kur.

Three.js ve React Three Fiber kullan. Uyumlu kararlı paket sürümlerini kurulum sırasında resmi belgeler/peer dependency’lerle kontrol et; lockfile üret. React 19 ile Fiber 9 belgelenmiş bir uyumlu başlangıçtır; alpha sürümü kendiliğinden seçme. Yardımcılar için Drei, kontrollü bloom için React Postprocessing kullanılabilir. GSAP zorunlu değildir; kullanılırsa tek kamera denetleyicisinin sorumluluğunda olsun.

Prototipi okunabilir bileşenlere ve verilere ayır. Minify edilmiş tek dosyayı React içine gömmek veya prototipin Canvas yedeğini ana teslim olarak sunmak uygun değildir. Ana kabul WebGL sahnesi üzerinden yapılır; WebGL yoksa erişilebilir yedek korunur.

Önerilen sorumluluklar: deneyim durumu, kamera yolculuğu, uzay/bulutsu sahnesi, yıldızlar, parçacıklar, kalite yönetimi ve HTML arayüzü. Sahne için her frame React state güncelleme; pozisyon/zaman değerlerini frame döngüsü ve ref/uniform üzerinden yönet.

## Kalite ve hareket

Görsel rehberdeki kamera koreografisini uygula. Normal uçuş yaklaşık 3–5 saniye; yumuşak hızlanma ve frenleme. Kamera yıldızın içine girmesin. Bakış yönü zıplamasın. Yolculuk sırasında ikinci bir uçuş başlamasın. Anı paneli varıştan sonra belirsin.

Mobil yerleşim ayrıca tasarlansın: yıldız yukarıda, metin ve gezinme aşağıda; dokunma alanları, safe area ve tarayıcı araç çubukları hesaba katılsın. Gerçek dünya geometrisini ekran her değiştiğinde keyfî biçimde yeniden dağıtma; kamera kadrajını uyarlamayı tercih et.

Doygunluk ve bloom yüzünden yıldızların yüzeyi veya yazı okunurluğu kaybolmasın. Doku kenarları, sis duvarları, dönen billboard kartları veya tekrar eden bulutsu parçaları görünmesin. Metinleri postprocessing dışında HTML katmanında tut.

Hareket azaltma ilk açılışta sistem tercihine uysun, manuel düğme de çalışsın. Görünmeyen sekmede animasyon/çizim duraklasın. WebGL context kaybı, varlık yükleme hatası, pointercancel, ekran döndürme ve component cleanup ele alınsın. Kamera denetleyicisi, event listener, GPU doku/geometry ve animasyonlar sızıntı bırakmasın.

## Çalışma ve doğrulama

Bağımlılıkları kur; uygulamayı çalıştır; uygun statik kontrol ve üretim derlemesini tamamla. `pnpm dev`, `pnpm typecheck` ve `pnpm build` gibi açık scriptler sağla; mevcut repo başka paket yöneticisi kullanıyorsa onunla tutarlı kal. Telefon yerel ağ testi gerekiyorsa kullanılacak host komutunu belirt.

Tarayıcı erişimin varsa gerçek ekranları incele, hataları düzelt. Desktop ve telefon kadrajını, uçuş ortasını, varışı ve anı kartını kontrol et. Hızlı tıklama, geri dönüş, tekrar ziyaret, yeniden boyutlandırma ve hareket azaltmayı dene. WebGL/GPU çiziminin gerçekten çalışıp çalışmadığını doğrula; Canvas yedeğiyle yapılan kontrolü WebGL kontrolü diye raporlama.

Performansı `04-TEKNIK-DEVIR.md` yaklaşımıyla ölç. Yalnızca build geçtiği için performans veya görsel kabul iddiasında bulunma. Anlamlı durum makinesi testleri gerekli görülürse eklenebilir; shader görünümünü doğruladığını iddia eden yapay birim testleri yazma.

## Teslim

Kullanıcıdan fotoğraf veya anı gelmesini beklemeden örnek içerikle çalışan ilk görsel pilotu bitir. Mevcut siteyi yayımlama/değiştirme; yerel teslim yap. İzinsiz commit/push veya dış servise yükleme bu görevin parçası değildir.

Teslimde şunları ver:

1. Çalıştırma ve build komutları.
2. Değişen/oluşan temel dosyalar ve kısa sorumlulukları.
3. Masaüstü ve telefon görüntüleri; mümkünse kısa uçuş videosu.
4. Gerçekte çalıştırılan kontroller ve sonuçları.
5. WebGL çiziminin doğrulanıp doğrulanmadığı; test edilen cihaz/viewport ve ölçülen performans.
6. Bilinen eksikler, özellikle gerçek iPhone/Safari kontrolü yapılmadıysa açık kayıt.
7. İki yıldızlık ilk teslimin nasıl değerlendirileceği.

Bu teslim hazır olduktan sonra Hazret’in görsel geri bildirimi alınacak. Öncesinde altı yıldızlık tam ürüne genişleme veya yeni özellik ekleme yapma.
