# Galaksi görsel yenilemesi — 2 Kasım 2026

> **Sonraki düzeltme:** Kullanıcının daha aydınlık sahne ve bulutsunun içinden geçiş geri bildirimi üzerine [hacimsel geçiş sürümü](hacim/README.md) eklendi. Aşağıdaki ilk yenilemenin ölçümleri tarihsel karşılaştırmadır.


Önceki dokulu pilotun tekrar eden parlak parçaları yerine özgün, bütünlüklü bir bulutsu kompozisyonu kullanılıyor. Koyu lacivert boşluklar, mor/mavi gaz, turkuaz ve altın ışıklı toz sınırları temel görsel dili oluşturuyor. Kullanıcının Chrome teması kopyalanmadı; yeni görseller yerleşik Imagegen aracıyla üretildi.

## Uygulama

- `Sky.tsx`: 6800 birim yarıçaplı, dünya konumu sabit bir uzak küre. Görsel açılış yönünde yaklaşık 103 derecelik bir alana yerleştiriliyor; kenarlar karanlık uzaya yumuşakça bağlanıyor. Kameranın konumu değiştiğinde perspektif değişiyor. Her karede gürültü hesaplayan shader ve büyük küp render hedefi gerekmiyor.
- `texturedNebulaLayout.ts`: yüksek/orta/düşük kalitede üç/iki/bir hafif saydam gaz katmanı, 1600–4200 birim uzaklıkta. Eski iki yoğun dokunun altı kez tekrarlanması kaldırıldı. Kaynak dosyalar tarihsel karşılaştırma için korundu.
- `Nebula.tsx`: mevcut hareketli yerel gaz korunuyor; yoğunluğu bütün rotalarda %5,5–12 aralığında. Uzaktaki ayrıntıyı örten mavi sis geri gelmiyor.
- `Starfield.tsx`: arka plan yıldızlarının ekran boyutu ve minimum parlaklığı azaltıldı. Anı yıldızlarının geometrisi, tıklama hedefi, kamera yolları, içerik ve Y düzeni değişmedi.
- Etiketlere, yıldız ipucuna ve alt bilgiye kontrast desteği eklendi.

Bu yaklaşım, gerçek 3B kamera/yıldızlar ile dokulu uzak küre ve saydam gaz yüzeylerini birleştirir; gazın tümü hacimsel bir simülasyon değildir. Ayrıntılı resim bütün 360 dereceyi kaplayan dikişsiz bir panorama olarak kullanılmıyor; arka yönler bilinçli olarak koyu. Kaynakların gerçek boyutu **1774×887**; 4K kaynak veya gerçek telefon testi iddiası yoktur.

## Görseller

- [Önce](once-masaustu.jpg)
- [Sonra](sonra-masaustu.jpg)
- [Telefon emülasyonu](sonra-telefon.jpg)

Kaynaklar: `public/assets/nebula/galaxy-panorama.png` (2.67 MB), `public/assets/nebula/galaxy-veil.png` (1.78 MB, alfa korunmuştur). Ağdan iki yeni görsel yüklenir. Üretim yöntemi ve tam yönergeler: [gorsel-uretim.md](gorsel-uretim.md).

## Doğrulama

- Mevcut 146 birim testi geçti.
- Üretim derlemesi ve TypeScript kontrolü geçti.
- 1920×1080 yüksek kalite ve 390×844 orta kalite emülasyonunda pilot 18/18: açılış, iki yöne bakış, ilk yıldıza uçuş, eve dönüş, altı etiket, tekil doku indirme, kaynak sayıları, ağ ve konsol.
- Altı yıldızın masaüstü ve telefon turları 4+4 kontrolle tamamlandı; yıldız/anı etkileşimleri 34/34 geçti (dokunma, sürükleme, ipucu çakışması, klavye, hareket azaltma, odak dönüşü).
- Pilot dönüşünde GPU kaynakları artmadı: masaüstü 21 doku / 13 geometri, telefon 17 / 13.
- Aynı makinedeki geliştirme sunucusunda, farklı zamanlarda alınan açılış örnekleri: önce p50 21.8 ms, sonra 18.1 ms. Bunlar cihazlar arası FPS garantisi veya kontrollü benchmark değildir.
- İlk geliştirme turunda dosyalar değişirken alınan ve iki test oturumunun çakıştığı ara sonuçlar geçerli kabul edilmedi. 18/18 sonucu tek oturumdaki sabit sürüme aittir.

Gerçek telefon/Safari kabulü ve kullanıcının estetik değerlendirmesi ayrıca gerekir. Değişiklikler yereldir; uzak repoya gönderim veya dağıtım yapılmamıştır.
