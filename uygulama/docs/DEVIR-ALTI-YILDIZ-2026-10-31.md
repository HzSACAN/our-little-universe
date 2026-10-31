# Altı yıldız aşaması — geliştirme devir noktası

31 Ekim 2026. Bu kayıt, tamamlanmış görsel teslim değil, Claude'un devam etmesi için derlenebilir bir çalışma noktasıdır. Kullanıcının talimatıyla geliştirme durduruldu; mevcut değişiklikler daha sonra açıkça verilen commit/push talimatıyla kaydedildi.

## Başlangıç

Dal: `fix/pilot-review-2026-10-31`, mevcut PR: #1. Önceki commit: `97bf8b426680bb985096b94aad0e584ec4357d8c`. Main'e merge veya deploy yapılmadı. Bu dosyayı içeren commit altı yıldız aşamasının başlangıç kontrol noktasıdır.

## Kodda eklenenler

- `content/memories.ts`: altı örnek anı, benzersiz keşif kontrolü, sabit hikâye sırasındaki takımyıldız bağlantıları ve sıradaki keşfedilmemiş yıldız seçimi.
- `content/letter.ts`: açıkça örnek olarak işaretli mektup. Gerçek fotoğraf, metin ve başlangıç yılı sağlanmadı.
- `experience/world.ts`: gold, binary, rose, azure, violet, dawn için farklı dünya konumları. Cubic Bezier kontrol noktaları en yakın eğri noktasının ağırlıklarıyla itilerek yeni rotalardaki yıldız kesişmeleri giderildi.
- `MemoryStars.tsx`: ortak geometri kullanan altı yüzey/korona, ikili yıldızın eş yıldızı ve yörüngesi. Dört yeni yıldızın görsel karakteri henüz GPU üzerinde değerlendirilmedi; aynı shader modlarının farklı renk/hız kombinasyonlarını kullanırlar.
- `Constellation.tsx`: iki ucu keşfedilen komşular arasında shader ile açılan çizgiler. Son kapanış çizgisi ancak altısı da keşfedilince eklenir.
- Yıldız alanı ve bulutsu dağılımı uzatıldı.
- Reducer, App ve HTML arayüz: altı durak, ilerleme, son mektup kilidi, tamamlanma paneli, mektup dialogu, yeni anı görsel alanları ve telefonda iki satırlı gezinme.
- WebGL yedeğinde altı anı okunup keşif düğmeleriyle aynı mektuba erişilebilir.

## Gerçekte tamamlanan kontroller

- `pnpm --dir uygulama typecheck`: geçti.
- `pnpm --dir uygulama test`: 5 dosya, 118 test geçti. Masaüstü ve portre için ev + altı yıldız arasındaki 84 yönlü rota, uç noktalar ve yıldızlardan uzaklık; keşif, mektup kilidi, sıra bağımsızlığı ve yedek akış durumu kapsanır.
- `pnpm --dir uygulama build`: geçti. Başlangıç JS gzip 77,56 kB, Scene gzip 279,31 kB; bunlar performans ölçümü değildir.
- `git diff --check`: geçti.
- Yeni uygulama WebGL olmayan kontrol tarayıcısında açıldı: altı örnek anı, 0/6 sayaç ve kilitli mektup düğmesi görüldü. Bu akış tıklanarak sonuna kadar test edilmedi.

## Tamamlanmayanlar — buradan devam et

1. Güncel dalı yerelde al, üretim derlemesini yeniden oluştur ve çalışan sayfanın yeni JS dosyasını kullandığını doğrula. Bağlı kullanıcı Chrome'unda son görülen `index-BcYzalt3.js` eski iki yıldızlı sürümdür. Yeni build `index-f-oJxhH0.js` / `Scene-B0UjxvqL.js` üretmiştir; sonraki değişikliklerle hash'ler değişebilir.
2. Altı yıldızı gerçek WebGL2 sahnesinde incele: shader derlemesi, yıldız/korona görünümü, çizgilerin görünürlüğü, altı yıldızın genel görünüm kadrajı ve etiket çakışmaları henüz doğrulanmadı.
3. Tüm akışı farklı keşif sıralarıyla dene. Beş keşifte mektup kilitli, altıncıda kullanılabilir olmalı. Genel görünüm, tekrar ziyaret, önceki/sonraki, liste seçimi ve geri uçuşları kontrol et.
4. Anı dialogundan mektuba geçişte tek açık dialog, Escape, odak geri dönüşü ve klavye kullanımını kontrol et. WebGL yedeğinde altı keşif ve mektup açma/kapatmayı tamamla.
5. 360×740, 430×932, 844×390 ve masaüstünde panel/başlık/gezinme taşmasını, en az 44 px hedefleri ve yıldızın metin altında kalmamasını incele. Yeni CSS henüz tarayıcıda görsel olarak doğrulanmadı.
6. Hareket azaltma, sekme gizleme, bağlam kaybı/yeniden deneme ve uçuş ortasında ekran düzeni değişiminin önceki davranışlarını koruduğunu doğrula.
7. Güncel altı yıldız sahnesinde GPU performansı ve kaynak sayısı ölç. README'deki iki yıldızlı pilot ölçümlerini yeni sürümün ölçümü gibi kullanma. Gerçek iPhone/Safari ve Android kontrolü bekliyor.
8. Bulguları düzelt; README'nin halen iki yıldızlık pilota ait bölümlerini güncel kapsamı açıkça anlatacak şekilde düzenle. Tarihsel ölçümleri tarihsel olarak sakla. Görsel kalite ve kabul tamamlanmadan aşamayı bitmiş olarak raporlama.

Yeni bağımlılık eklenmedi. Bu kontrol noktası için yeni altı yıldız WebGL ekran görüntüsü veya videosu bulunmuyor. Önceki pilotun gerçek WebGL2 incelemesi yeni aşamanın kanıtı değildir.
