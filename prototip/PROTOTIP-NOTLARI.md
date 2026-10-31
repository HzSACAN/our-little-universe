# Yağmur · Bizim Küçük Evrenimiz

Hazret’ten Yağmur’a, 6 Kasım yıl dönümü için etkileşimli uzay yolculuğu prototipi.

## Çalıştırma

`dist/` klasörünü herhangi bir statik HTTP sunucusuyla sunun. Örnek: `python3 -m http.server 8080 --directory dist`. Yerel ES modülleri kullanıldığı için HTML dosyasını doğrudan file:// üzerinden açmayın. Derleme ve kurulum gerekmez.

## Teknoloji

HTML, CSS, JavaScript ve yerel olarak saklanan **Three.js 0.180.0**. Gerçek PerspectiveCamera, XYZ uzay koordinatları, üç boyutlu yıldız küreleri, Sprite bulutsular, Points yıldız alanı ve eğrisel kamera yolları. Varsayılan çizim WebGLRenderer’dır. WebGL bağlamı oluşturulamıyorsa aynı kamera, dünya koordinatları ve perspektifi kullanan Canvas çizim yolu çalışır; uzay yolculuğu korunur. Canvas yolu küreleri prosedürel doku ile, WebGL yolu shader ile çizer.

Dış CDN, izleme, hesap veya sunucu veri deposu kullanılmaz. İsteğe bağlı ses kullanıcı tıklamasıyla Web Audio API üzerinden başlar. Fontlar yereldir; lisans FONT-LICENSE.txt içinde. Three.js lisansı dist/vendor/THREE-LICENSE.txt içinde.

## Deneyim

1. Açılışta altı farklı derinlikte anı yıldızı görünür.
2. Bir yıldız seçildiğinde kamera dünya uzayında eğrisel bir yolla o yıldıza gider. Görüş açısı yolculuğun ortasında hafif genişler; uzaktaki bulutsular ve yakındaki yıldızlar farklı hızlarda görünür.
3. Varışta anı özeti görünür. Anıyı açmak, fotoğraf alanını ve daha uzun metni gösterir.
4. Sonraki/önceki eylemleri, rota düğmeleri ve anı listesi yıldızlar arasında seyahat sağlar. Sürüklemek bakışı değiştirir; fareyle hafif paralaks da vardır.
5. Keşfedilen komşu yıldızlar arasında üç boyutlu bağlantılar oluşur. Altı yıldız tamamlanınca mektup açılır. Tüm evreni gör eylemi tamamlanan takımyıldızı gösterir.

İlerleme sayfa belleğindedir; yenilemede sıfırlanır. Başlangıç yılı bilinmediği için yıl sayısı ya da gün sayacı yoktur.

## Kişiselleştirme

Hitap **Yağmur**. `dist/app.js` içindeki `memories` dizisi örnek içeriktir. Fotoğraf alanları ve mektup `dist/index.html` içindedir. Kişisel hikâye ve fotoğraflar eklenmeden örnek içerik etiketlerini kaldırmayın.

## Tasarım ve cihaz davranışı

Gece laciverti #050912; sıcak beyaz #eeeadf; altın vurgu #d3b785. Editoryal serif başlıklar, sade arayüz yazısı. Tam ekran uzay; masaüstünde anı solda, yıldız sağda; telefonda yıldız yukarıda, metin ve gezinme aşağıda. Telefon yıldız düğmeleri geniş HTML hedefleridir; rota alternatif olarak listeden de kullanılabilir.

Sistem hareket azaltma tercihi ve manuel düğme desteklenir. Hareket azaltıldığında kamera uçuşu, gezinme ve sürekli hareket kısa/durağan geçişe dönüşür. Gizli sekmede çizim durur ve seyahat süresi askıya alınır. Piksel oranı ve yıldız sayısı sınırlandırılır. Canvas çizim yolu yaklaşık 30 fps ile sınırlandırılır. Native dialog, klavye odak sınırlaması ve Escape ile kapatma kullanılır.

## Doğrulama

- JavaScript sözdizimi kontrolü geçti.
- Kontrol tarayıcısında WebGL devre dışı olduğundan **WebGL çizimi bu ortamda görsel olarak doğrulanamadı**. Canvas perspektif çizim yolu gözlemlendi.
- Masaüstünde altı yıldıza varış, keşif durumu, tamamlanan takımyıldızın genel görünümü ve mektup açma akışı denendi.
- 390 × 844 telefon görünümünde gerçek süreli kamera yolculukları, ardından hareket azaltma ile tüm akış ve mektup denendi. Kaydırma/taşma ölçümleri ekran boyutuyla eşit.
- 768 × 1024 tablet görünümü incelendi.
- Gerçek iPhone/Safari, GPU shader çıktısı ve cihaz performans kabulü henüz yapılmadı.

## Sonraki uygulama

Tasarım onayından sonra React + TypeScript + Vite ve Three.js/React Three Fiber ile bileşenlere ayrılabilir. GSAP isteğe bağlıdır; bu prototip kamera yollarını Three.js eğrileri ve requestAnimationFrame ile yürütür. Görsel dil, farklı derinlikler, yolculuk hissi ve mobil sahne kompozisyonu korunmalıdır. Fotoğraf kırpımları gerçek varlıklara göre ayrıca belirlenmelidir.
