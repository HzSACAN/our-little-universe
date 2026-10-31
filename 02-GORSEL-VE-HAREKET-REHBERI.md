# Görsel ve hareket rehberi

## Sanat yönü

Hazret’in gönderdiği `referanslar/uzay-gorsel-referansi.png` temel görsel hedeftir. Görselin güçlü yanları: derin kobalt/lacivert zemin, mor ve fuşya ışık damarları, turkuazla aydınlanan gaz kıvrımları, sıcak altın bölgeler ve çok farklı parlaklıklarda yoğun yıldızlar. Büyük koyu boşluklarla renkli yoğunluklar birlikte bulunur.

Hedef, bu atmosferin içine girip hareket etmektir. Tüm ekranı eşit doygunlukta bir renk sisine çevirmeyin; koyu alanlar uzayın derinliğini, aydınlık bölgeler yolculuğun yönünü göstermeli. Renkleri bir araya getiren hacim ve ışık değişimleri görünür olmalı.

Referans bir ekran görüntüsüdür. Google yazısı, arama kutusu, tarayıcı çubuğu ve simgeler arayüze veya gökyüzü dokusuna taşınmayacak. Görselin kendisi tek bir düz arka plan olarak kaplanmayacak; renk ve ışık kompozisyonuna referans olacak.

## Başlangıç paleti

Bu değerler tasarım başlangıcıdır; shader, pozlama ve ton eşleme sonucuna göre gözle ayarlanır.

| Rol | Renk |
|---|---|
| Koyu uzay boşluğu | `#040616` |
| Derin lacivert | `#10135A` |
| Elektrik mavisi | `#3659E3` |
| Mor gaz | `#703CBE` |
| Fuşya ışık damarı | `#D94C9B` |
| Turkuaz ışık | `#6DE8DE` |
| Sıcak altın | `#E8C58F` |
| Ana yazı | `#F4F0E8` |
| İkincil yazı | `#BAC3D5` |

Yeşilimsi ışık, referanstaki gibi küçük vurgu bölgelerinde kullanılabilir. Her yerde aynı anda bütün renkleri göstermek yerine uzayın bölgeleri farklı renk ağırlıkları taşımalı. Uzayın merkezindeki ışık ile anı panelinin arkasındaki koyu alan bilinçli yerleştirilmeli.

## Sahne katmanları

### Uzak çevre

Çok uzak yıldız alanı ve düşük kontrastlı galaktik ışık. Kamera hareketine az tepki verir. Bir environment/sky katmanı burada kullanılabilir; uçuş hissi yalnızca buna bağlanmaz.

### Orta mesafe bulutsuları

Dünya uzayında farklı konum, ölçek ve açılara sahip, yumuşak kenarlı bulutsu yapıları. Turkuaz, mor, pembe ve altın kıvrımlar aralarında koyu boşluklar bırakarak bir geçit hissi oluşturur.

Pilot için bütçeye uygun, dokulu katmanlar veya shader tabanlı yumuşak hacim yaklaşımı kullanılabilir. Tam hacimsel raymarch zorunlu değildir. Ancak katmanların ön/arka sırası, birbirlerini örtmesi ve aralarından geçiş görünmelidir. Tek bir bulutsu görselini kameraya sabitlemek yeterli değildir.

Büyük, çakışan saydam düzlemlerin doldurma maliyetine dikkat edin. Kamera yaklaştığında düzlem sınırı, kare doku kenarı, tekrarlanan desen veya sert bir sis duvarı görünmemeli. Derinlik/yakınlık sönümlemesi ve yumuşak geçişler kullanın.

### Yakın yıldız tozu

Yakında az sayıda, hızlı hareket eden küçük ışıklar; uzakta daha yoğun ve sakin yıldızlar. Yakın parçacıklar, seyahatin hızını gösterir. Yıldızlar tek tek DOM elemanı veya ayrı mesh olarak oluşturulmaz; toplu çizim kullanılır. Bütün gökyüzü aynı ritimde parlamaz.

### Anı yıldızları

İlk yıldız: sıcak altın/şampanya ışığı, ince yüzey hareketi, yumuşak korona.

İkinci yıldız: buz mavisi ile lavanta arasında bir ışık ve küçük bir eş yıldız. Eş yıldızın yörüngesi, yaklaşıldığında derinliği anlaşılır kılar.

Bu cisimler ışık yayan yıldızlar olarak tasarlanmalı. Sert plastik parlaklığı, belirgin kraterler, rastgele dairelerden oluşan yüzey veya çizgi film gezegeni görünümü kullanılmamalı. Geniş alanlar beyaza patlayarak yüzey bilgisini yok etmemeli.

### Işık ve son işleme

Parlak yıldızlar ve seçilmiş ışık bölgeleri için kontrollü bloom kullanılabilir. Yazılar bu son işlemenin dışında HTML katmanında tutulmalı. Her yıldızın çevresinde aynı büyüklükte beyaz leke oluşmamalı.

Vinyet hafif olmalı; renkleri ve küçük ekrandaki görüş alanını boğmamalı. Ağır chromatic aberration, ekran sallama ve sürekli motion blur ana stil değildir. Yolculuğu güçlü yapan şey perspektif, mesafe ve katmanların hareket farkıdır.

## Kamera koreografisi

Aşağıdaki süreler ilk ayar aralıklarıdır; mesafe ve görsel değerlendirmeye göre değiştirilebilir.

| Evre | Yaklaşık süre | Beklenen his |
|---|---:|---|
| Açılışın yerleşmesi | 0,8–1,2 sn | Gökyüzü ve davetin sakin görünmesi |
| Uçuşa hazırlanma | 0,25–0,4 sn | Metinlerin çekilmesi; hedefin kısa süre belirginleşmesi |
| Yol alma | 2,2–3,4 sn | Hızlanma, bulutsuların arasından geçme, yakın yıldızların akması |
| Yaklaşma ve fren | 0,7–1,1 sn | Hedefin büyümesi, hızın düşmesi, kompozisyonun oturması |
| Anının görünmesi | 0,45–0,7 sn | Sabitlenmiş sahnede rahat okunabilir metin |

Toplam normal uçuş yaklaşık 3–5 saniye. Her geçişte aynı animasyonun yalnızca rengi değişmez; gerçek başlangıç, hedef, mesafe ve görüş yönü kullanılır.

- Kamera yolu üç boyutlu eğriyle belirlenir; giriş/çıkış yönleri akıcı olmalı.
- Bakış yönü kameradan bağımsız ani atlamaz. Başlangıç yönelimi korunup hedefe yumuşak geçilir.
- Yıldızın merkezine uçulmaz; yüzey dışında, metni destekleyen bir varış konumu seçilir.
- Uçuş ortasında görüş açısı hafif genişleyebilir; varışta başlangıç değerine döner. Belirgin balık gözü etkisi oluşmamalı.
- Yalpa/roll çok küçük ve isteğe bağlıdır. Telefon deneyiminde yatay çizgi dönmesi özellikle sınırlı tutulur.
- Varışta mikro hareket olabilir; metin sürekli yüzüyormuş gibi hareket etmez.
- Kamera kontrolünün sahibi tektir. Aynı anda OrbitControls, özel pointer kontrolü ve GSAP kamerayı yazmaz.

## Masaüstü kompozisyonu

Açılışta sol tarafta büyük ve zarif tipografi, sağ/orta bölgede uzay ve yıldızlar. Görsel yıldız etiketleri hafif; navigasyon dikkat çekmek için yarışmaz.

Varışta anı metni solda; yıldız sağda ve kadrajın tamamını kaplamadan belirgin büyüklükte. Uzayın içindeki başka derinlikler hâlâ görünür. Alt kısımda önceki/sonraki ve genel görünüme dönüş açıkça erişilebilir.

Yıldızla birlikte HTML etiketleri gerçek projeksiyondan hesaplanır. Ekran dışında veya öndeki yıldızın arkasında kalan etiketler saklanır; parlak yüzeyin üzerinden başka yıldızın adı okunmaz.

## Telefon kompozisyonu

Masaüstü ekranını küçülterek uygulamayın. Açılış metni, yıldızların dağılımı ve kamera varış noktası telefon oranına göre düzenlenir.

Varışta yıldız üst bölgede, kısa anı paneli altta. Gezinme panelin altında; alt güvenli alan ve tarayıcı araç çubuğu dikkate alınır. Başlık veya yıldızın parlayan merkezi temel kontrolleri örtmez. Kontroller için yaklaşık 44 CSS px dokunma alanı hedefleyin; kompakt rota işaretleri için erişilebilir liste alternatifi sunun.

Bakınma sürüklemeyle çalışır. Cihaz hareket sensörü izni istenmez; deneyim telefonu eğme zorunluluğuna dayanmaz. Tek parmakla her temel eylem yapılabilmeli.

## Tipografi ve arayüz

Büyük, zarif serif başlıklar; sade ve küçük ama okunaklı sans arayüz. Paketteki Nimbus fontları kullanılabilir veya Türkçe karakterleri kapsayan yerel fontlarla aynı karakter korunabilir. Tek bir ana yazı hiyerarşisi ve tutarlı boşluk düzeni oluşturun.

Başlangıç metni örneği: “Bütün yıldızların arasında, sen.” Alt metinde “Yağmur” hitabı korunur. Görünür ürün metinlerinde WebGL, shader, render veya FPS gibi geliştirme terimleri kullanılmaz.

## Varlık üretimi

Bulutsu dokuları gerekiyorsa referansın renk ve biçim dilinden hareketle özgün/prosedürel varlıklar hazırlanır. Her doku kenarlarda saydamlaşmalı, farklı ölçeklerde kullanılabilmeli ve dikiş/kare sınırı oluşturmamalı. Varlık üretimi yapılamıyorsa bunu saklamayın; shader/prosedürel yaklaşımı uygulayıp hangi varlıkların sonradan geliştirilebileceğini belirtin.

Gerçek fotoğraflar henüz yoktur. Anı kartlarında yer tutucu kullanın; internetten bulunan kişilerin fotoğraflarını çiftin fotoğrafı gibi sunmayın.
