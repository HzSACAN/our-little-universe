# Yağmur · Bizim Küçük Evrenimiz

Hazret’ten Yağmur’a, 6 Kasım yıl dönümü için kişisel bir hediye. İkisi de bilgisayar mühendisi. Yağmur, kendisine “Yağmur” diye hitap edilmesini tercih ediyor.

Bu paket, Claude Code veya Codex’in asıl uygulamayı geliştirmeye başlaması içindir. Yeni bir tasarım fikri aranmayacak: etkileşim onaylandı, görsel dünyanın daha renkli ve etkileyici olması istendi.

## Hemen başlamak için

1. Paketi yerel bilgisayarınızda bir klasöre çıkarın.
2. Claude Code veya Codex’i bu klasörde açın. Çalışma alanının paket dosyalarına erişebildiğinden emin olun.
3. `03-ILK-GOREV-PROMPTU.md` dosyasının tamamını ilk mesaj olarak verin.
4. Agent, varsa mevcut repo kurallarını okuyacak; yoksa bu klasörün içinde `uygulama/` adında yeni proje açacak.
5. İlk teslim iki yıldız ve aralarındaki uzay yolculuğudur. Hazret görsel kaliteyi değerlendirmeden altı anılık tam sürüme genişletilmeyecek.

Yerel bir repo zaten varsa paketi reponun içine `tasarim-referansi/` olarak koyabilirsiniz. Agent kaynak/asset yollarını bulunduğu yere göre çözmelidir; bu paketteki mutlak üretim ortamı yollarına ihtiyaç yoktur.

## Paketteki dosyalar

| Dosya | Amaç |
|---|---|
| `01-PROJE-SARTNAMESI.md` | Ürün kapsamı, ilk aşama ve sonraki aşamalar |
| `02-GORSEL-VE-HAREKET-REHBERI.md` | Renkler, uzay katmanları, sahne kompozisyonu ve kamera hareketleri |
| `03-ILK-GOREV-PROMPTU.md` | Agenta doğrudan verilecek tam görev |
| `05-INCELEME-PROMPTU.md` | İkinci agent için görsel, etkileşim ve teknik inceleme görevi |
| `04-TEKNIK-DEVIR.md` | Prototipten yararlanılacak bölümler, sınırlar, teknik kaynaklar ve doğrulama |
| `referanslar/uzay-gorsel-referansi.png` | Hazret’in beğendiği renkli uzay teması; görsel atmosfer referansı |
| `prototip/dist/` | Onaylanan etkileşimin çalışan kaynakları; index.html, CSS, JS, fontlar ve Three.js |
| `prototip/PROTOTIP-NOTLARI.md` | Önceki uygulamanın teknoloji ve doğrulama notları |
| `prototip/FONT-LICENSE.txt` | Font lisansları |
| `DOSYA-OZETLERI.sha256` | Paketteki içeriklerin bütünlük kaydı |

## Prototipi yerelde açmak

Bir statik HTTP sunucusu ile `prototip/dist/` dizinini sunun. VS Code Live Server veya kurulu başka bir statik sunucu kullanılabilir. HTML dosyasını doğrudan çift tıklamak ES modülleri nedeniyle uygun değildir.

Örnek tek komut: `npx --yes serve prototip/dist -l 8080`

Bu örnek komut internet/paket erişimi ister; kurulu bir sunucunuz varsa onu kullanın. Asıl React uygulamasının başlatma komutları agentın tesliminde ayrıca verilecektir.

## İki referansın önceliği

- **Nasıl hareket edecek?** Çalışan prototip.
- **Nasıl görünecek?** Renkli uzay ekran görüntüsü + `02-GORSEL-VE-HAREKET-REHBERI.md`.

Prototipin soluk renkleri ve mevcut küre yüzeyleri nihai görsel hedef değildir. Ekran görüntüsündeki Google arayüzü de ürün tasarımına taşınmayacaktır.

## Mevcut durum

Prototip kaynak anlık görüntüsü: `c9da0a1b7a072470adc678f3f328e6995072ee55`.

Etkileşim prototipi: https://yagmur-bizim-evrenimiz.actualmango.chatgpt.site/

Canlı prototip hesapla giriş isteyebilir. Agentın bu adrese erişebilmesi gerekmez; çalışan kaynaklar pakettedir. Bu paket herhangi bir hesap bilgisi, token veya dağıtım manifesti içermez. Mevcut siteyi değiştirmek bu ilk görevin parçası değildir.
