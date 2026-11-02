# Aydınlık ve bulutsunun içinden geçiş — 2 Kasım 2026

İlk galaksi yenilemesinde uzak küre görüntüyü taşıyor, yakındaki gaz ise çok düşük yoğunlukta kalıyordu. Bu sürüm, kullanıcının iki düzeltmesini uygular: daha aydınlık bir palet ve yıldızlar arasında gazın gerçekten içinden geçen kamera.

## Değişiklikler

- Gökyüzünde gölgeler ve orta tonlar açıldı; parlak kenarlar yalnız genel pozlama çarpanıyla yükseltilmedi. Kenar karartması 0.42'den 0.22'ye indirildi.
- `JourneyNebula.tsx` yeni bir ışın boyunca hacim örnekleme geçişi ekler. Gürültü 3B dünya konumundan okunur; kamera bulutun içine girdiğinde de yoğunluk hesaplanır. Uçuş yüzdesine bağlı bir ekran sisi değildir.
- `journeyClouds.ts` altı sonlu elipsoit gaz bölgesini tanımlar. Kamera gidişte bunların içine girip çıkar; dönüşte aynı dünya konumlarını yeniden geçer.
- Gaz, arkasındaki yıldız ışığını zayıflatır. Ana ve eş yıldızların yüzeyine isabet eden ışınlar yüzeyde durur; arkadaki gaz yüzeyin üzerine çizilmez. Yıldız yakınlarında yoğunluk yumuşakça azalır.
- Aynı altı geçiş bölgesine ince, saydam doku kenarları eklendi. Bunlar yakınlaşırken farklı hızlarda kadrajdan akar; hacim geçiş sırasında devam eder. Önceki uzak küre ve ince dış katmanlar korunur. Geçit dokuları 1100–1600 birimde yumuşakça söner; daha uzaktakiler çizilmez.
- Kamera kurulumunun eski 9000 uzak kırpma değeri, sahnedeki 14000 değeriyle eşitlendi.
- Hacim hesabı yüksek/orta/düşük kalitede 28/22/16 örnek kullanır. Hacim ara hedefinin uzun kenarı 480/384/288 pikselle sınırlıdır; ince görsel dokular tam çözünürlükte kalır. Bulutların Z aralıkları çakışmadığı için boş bölgeler erken elenir.

Uzak görsel ve ince gaz kenarları hâlâ dokuludur; eklenen yerel gaz katmanı hacimseldir. Tam fiziksel ışık saçılımı veya çoklu saçılım simülasyonu değildir. Yeni görsel dosyası üretilmedi; mevcut özgün dokular yeniden kullanıldı.

## Doğrulama

- 161/161 test geçti. Yeni 15 kontrol, gerçek uçuş eğrilerinin sonlu gaz bölgelerinin içinden geçtiğini doğrular. Masaüstü ve telefon için en uzak yıldıza doğrudan gidiş/dönüş en az dört bölgeyi keser; sırayla yapılan her yıldız yolculuğu en az bir bölgeye girer. Ek kontrol, erken eleme için gereken Z aralıklarının çakışmaması koşulunu korur.
- TypeScript ve üretim derlemesi geçti.
- Son sürümde yıldız/anı etkileşimleri 34/34 geçti: ana/eş yıldız, dokunma, sürükleme, klavye, hareket azaltma, ipucu konumu ve odak dönüşü.
- Masaüstü/telefon pilotu: açılış, sürükleme, ilk yıldıza uçuş, eve dönüş, altı etiket, tekil doku yüklemesi, ağ ve konsol 18/18 geçti. Dönüşte kaynak artışı yok: masaüstü 22 doku / 14 geometri, telefon 18 / 14.
- İlk hacim sürümündeki aşırı sis ve sabit piksel titreşiminin kafes deseni kaldırıldı. İlk yüksek çözünürlüklü hacim geçişinin masaüstü maliyeti nedeniyle ara hedefe piksel sınırı getirildi.
- Video kaydı ve ara kare ekran görüntüleri performansı etkiler; bu kaydın FPS değerleri normal kullanım ölçümü olarak alınmaz.

Telefon görüntüleri emülasyondur. Değişiklikler yereldir; push/deploy yapılmadı.

## Kayıtlar

Aydınlık açılış (masaüstü ve telefon emülasyonu) kareleri ile en uzak yıldıza uçuş videosu (`derin-ucus.webm`, yalnız 3B kanvas) repodan kaldırıldı; `57ac112` commit’inde git geçmişinde duruyor.

Aynı tarayıcı oturumundaki 1920×1080 yüksek kalite karşılaştırmasında hacim kapalı p50 25.3–28.2 ms, açık 29.4 ms ölçüldü; yalnız dokulu gaz da kapatıldığında 22.4 ms. Normal kullanımda mevcut otomatik kalite düşürme sürer. Bu entegre GPU örneği cihazlar arası FPS garantisi değildir.

Doğrudan en uzak yıldıza uçuşta varış, ardından eve dönüşte genel görünüm doğrulandı. Uzun VP8 video dışa aktarımı takıldığı için son kısa kayıt VP9 ile alındı; videoda doğrudan gidiş gösterilir.
