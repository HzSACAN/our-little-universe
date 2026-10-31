# İkinci agent için inceleme görevi

İlk agentın iki yıldızlık teslimi tamamlandıktan sonra bu görevi kullan. Aynı dosyaları iki agentın eş zamanlı değiştirmesi yerine, önce uygulama teslim edilsin; ardından bağımsız inceleme yapılsın.

Repo kurallarını ve başlangıç paketinin 01/02/04 numaralı belgelerini oku. `referanslar/uzay-gorsel-referansi.png` görselini ve önceki etkileşim prototipini incele. Yeni uygulamayı çalıştır.

İlk teslimin hedefi iki yıldız arasında etkileyici ve renkli bir üç boyutlu yolculuktur. Altı yıldıza genişletme veya mektup ekleme istemiyorum. Önce mevcut teslimi değerlendir:

1. Görsel: referanstaki renkli, kıvrımlı, derin uzay atmosferi oluşmuş mu; yoksa yalnızca düz bir arka plan mı var?
2. Hareket: kamera gerçek 3B koordinatlar arasında gidiyor mu; bulutsulardan geçiş ve yakın/uzak hareket farkı görülüyor mu?
3. Kamera: giriş, hızlanma, fren ve bakış yönü akıcı mı; yıldızın içine girme veya düzlemden sert geçme var mı?
4. Mobil: yerleşim ayrıca tasarlanmış mı; yıldız, anı ve kontroller birbirini örtüyor mu; sürükleme yanlış seçim yapıyor mu?
5. Durum: hızlı tıklama, tekrar ziyaret, geri dönüş, anı kapatma, resize ve görünmeyen sekmeden dönüş çalışıyor mu?
6. GPU: gerçek WebGL yolu doğrulanmış mı; shader/texture hatası var mı; Canvas yedeği yanlışlıkla esas kabul kanıtı yapılmış mı?
7. Yaşam döngüsü: event listener, animation frame, doku, geometry, material ve son işleme kaynakları birikiyor mu; StrictMode veya unmount sonrası güncelleme sorunu var mı?
8. Performans: ölçüm hangi cihazda yapılmış; önemli takılma veya saydam katman maliyeti var mı; düşük kalite seçimi görsel dili koruyor mu?
9. Erişim: hareket azaltma, klavye, dialog odak yönetimi ve WebGL hata yolu kullanılabilir mi?
10. İçerik: Yağmur hitabı korunmuş mu; verilmemiş özel anılar veya yıl bilgisi uydurulmuş mu?

Bulgu raporunu önem sırasıyla yaz. Her bulgu için dosya/konum, yeniden üretme adımları, etkisi ve somut düzeltme önerisi ver. Gözlemlemediğin hatayı varmış gibi raporlama. Gerçek cihaz veya GPU kontrolü yapılamadıysa açıkça belirt. Yalnız build’in geçmesi üzerinden görsel veya performans onayı verme.

Bu görev incelemedir; kendiliğinden yeni özellik ekleme, deploy veya push yapma. Hata düzeltmesi istenirse önce bulguların kapsamına bağlı kal.
