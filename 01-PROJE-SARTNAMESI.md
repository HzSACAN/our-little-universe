# Ürün şartnamesi

## Hedef

Yağmur’un telefonda veya bilgisayarda keşfedebileceği, Hazret ile ilişkilerine ait anıları yıldızlar aracılığıyla anlatan kişisel bir yıl dönümü hediyesi. Duygu: merak, yakınlık, hayranlık ve sakin bir keşif hissi. Ana deneyim, renkli bir uzayın içinde yıldızdan yıldıza yapılan kamera yolculuğudur.

Bir kart galerisi veya yalnızca uzay fotoğrafı üzerinde çalışan sayfa geçişi, kabul edilen etkileşimi karşılamaz. Sahne; üç boyutlu dünya koordinatlarına, perspektif kameraya ve nesneler arasındaki gerçek derinlik farkına sahip olmalıdır.

## Kesinleşen kişisel bilgiler

- Hediyeyi hazırlayan: Hazret.
- Hitap: Yağmur. Kullanıcıya dönük metinlerde öncelikli isim budur.
- Özel gün: 6 Kasım.
- İlk sevgili olunan yıl bilinmiyor. Yıl dönümü sayısı veya birlikte geçirilen gün sayısı uydurulmayacak.
- Gerçek fotoğraflar, kişisel anı metinleri, mektup ve şarkı henüz verilmedi.
- Örnek içerik açıkça örnek olarak anlaşılmalı. Gerçekmiş gibi olay, mekân, tarih veya özel konuşma oluşturulmayacak.

## Son ürünün planlanan akışı

1. Açılış: “Hazret’ten Yağmur’a” ve davet metni; arka planda yaşayan uzay.
2. Keşif: farklı uzaklıklarda altı anı yıldızı.
3. Yolculuk: seçilen yıldıza uzayın içinden gidilir.
4. Varış: yavaşlama, yıldızın çevresinde konumlanma ve anı metninin açılması.
5. Anı ayrıntısı: fotoğraf ve kişisel not; kapatılınca aynı konuma dönülür.
6. Takımyıldız: keşfedilen komşu anılar arasında dünya uzayında bağlantılar oluşur.
7. Altı anı tamamlandığında mektup erişilebilir olur. Genel görünüm tamamlanan yıldız haritasını gösterir.

Bu tam akış, eldeki prototipte örnek içerikle bulunmaktadır. İlk gerçek uygulama görevi yalnızca aşağıdaki kapsamı üretir.

## İlk teslim: iki yıldızlık görsel pilot

### Dahil

- React + TypeScript + Vite projesi.
- Three.js sahnesi; React Three Fiber ile bileşen yönetimi.
- Tek bir uzay çevresi içinde belirgin biçimde farklı derinliklerde **iki** anı yıldızı.
- Renkli, katmanlı, içinden geçilebilen bulutsu sahnesi.
- Açılış, ilk yıldıza yolculuk, ikinci yıldıza yolculuk, geri dönüş ve genel görünüm.
- Dokunarak/tıklayarak seçim; sınırlı sürükleyerek bakınma.
- Varışta kısa anı paneli; ayrıntıda örnek fotoğraf alanı ve örnek not.
- Hareket azaltma tercihi ve WebGL hata durumunda erişilebilir içerik yolu.
- Masaüstü ve telefon için ayrı sahne kompozisyonu.
- Ölçülmüş performans notları ve çalıştırılabilir üretim derlemesi.

### Sonraki teslimler

İlk görsel pilot değerlendirildikten sonra diğer dört anı, altı yıldızın takımyıldızı, mektup ve gerçek içerik entegrasyonu yapılır. İlk iki yıldız tamamlanınca altı anılık hikâye tamamlanmış gibi davranılmayacak; pilotun kapsamı teknik teslim notlarında açıklanacak. Mevcut prototipteki altı örnek anı, ilk sürüme otomatik olarak taşınmayacak.

İlk görevde özel alan adı, yayınlama, kullanıcı hesabı, yönetim paneli, veritabanı, dosya yükleme sistemi veya müzik seçimi yapılmayacak. Proje yerelde çalışacak; mevcut prototip sitesi korunacak.

## Etkileşim kuralları

- Yolculuk süresince tek kamera denetleyicisi çalışır. Hızlı/tekrarlı seçimler üst üste animasyon başlatmaz.
- İlk uygulamada yolculuk sırasında yeni seçimler kilitlenir; bitince düğmeler tekrar kullanılabilir olur.
- Keşfedildi durumu varışta işaretlenir; düğmeye basıldığı anda değil.
- Tekrar ziyaret sayacı artırmaz ve farklı bir anı oluşturmaz.
- Kullanıcı anı kartını kapattığında kamera sıçramaz; bulunduğu yıldızın yanında kalır.
- Ekran döndürülmesi veya yeniden boyutlandırma, ziyaretleri sıfırlamaz. Sürmekte olan yolculuk güvenli biçimde sonlandırılır veya yeniden hedeflenir.
- Mobil sürükleme ile yıldız seçme birbirinden ayrılmalı; sürükleme bırakılırken yanlışlıkla uçuş başlamamalı.
- Bakınma açısı sınırlıdır. Ekranın ters dönmesine veya yıldızların tümünün kaybolmasına izin verilmez.
- Parmak kaldırıldığında kontrol takılı kalmaz; pointercancel ve çoklu dokunuşlar ele alınır.
- Ses eklenirse yalnızca kullanıcı isteğiyle başlar. Bu pilotta ses zorunlu değildir.

## Kabul ölçütleri

1. Görsel referanstaki mavi/mor zemin ve turkuaz/pembe/altın bulutsu ışıkları, hem masaüstünde hem telefonda fark edilir.
2. Kamera ilerlerken bulutsu ve parçacıklar gerçek dünya konumlarına bağlı hareket eder; yakın ve uzak katmanların hareket farkı görünür.
3. İlk yıldızdan ikinciye geçiş, kararma veya pencere değişimi yerine uzayda mesafe katetme hissi verir.
4. Uçuş başlangıcı ve bitişi yumuşaktır; yıldız yüzeyinden veya yoğun, düz bir bulutsu düzleminden geçilmez.
5. İki yıldız aynı kürenin yalnızca renk değiştirilmiş kopyası gibi görünmez; yüzey, ışık davranışı veya ikili yapı bakımından ayrılır.
6. Anı metni rahat okunur; fotoğraf alanının yer tutucu olduğu açıktır.
7. 360–430 CSS px telefon genişliklerinde ve masaüstünde kontroller görünür, dokunulabilir ve taşmasızdır.
8. Sistem hareket azaltma tercihi ilk açılıştan itibaren uygulanır. Hareket düğmesiyle değiştirmek de çalışır.
9. WebGL bulunmadığında boş ekran oluşmaz. Görsel yedek veya erişilebilir anı listesi sunulur; bu yedek, WebGL testinin yapıldığı anlamına gelmez.
10. Gerçek WebGL çalışması mümkün bir tarayıcıda doğrulanır. Kullanılamıyorsa bu durum açıkça raporlanır.
11. Performans hedefleri ölçümle değerlendirilir; yalnızca build sonucuna bakılarak “akıcı” veya “tamamlandı” denmez.
12. Eksik fotoğraf, yükleme hatası, hızlı tıklama veya pencere kapatma sahneyi kullanılmaz hâle getirmez.
