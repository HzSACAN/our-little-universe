// Gerçek anı geldikçe `sample` false yapılır ve `photo` eklenir; örnek etiketleri kendiliğinden kalkar.
export type StarId = 'gold' | 'binary' | 'rose' | 'azure' | 'violet' | 'dawn';

export interface MemoryPhoto {
  /** public/ altındaki göreli yol, ör. anilar/gold.jpg (scripts/fotograf.mjs üretir). */
  src: string;
  width: number;
  height: number;
  /** Ekran okuyucu için fotoğrafta ne göründüğü. */
  alt: string;
  /** CSS object-position; masaüstündeki yatık kalp kadrajı. Varsayılan '50% 40%'. */
  focus?: string;
  /** Telefondaki uzun kalp kadrajı; verilmezse `focus`. */
  focusMobile?: string;
  /** Masaüstü kalpte kısa cümlenin yeri; yüzler kalbin alt yarısındaysa 'top'. Varsayılan alt. */
  scriptAt?: 'top';
}

export interface Memory {
  id: StarId;
  index: number;
  title: string;
  short: string;
  summary: string;
  text: string;
  script: string;
  /** Fotoğraf gelene kadar yer tutucuda görünen not. */
  photoNote: string;
  photo?: MemoryPhoto;
  /** true iken anı arayüzde açıkça örnek olarak işaretlenir. */
  sample: boolean;
}

export const memories: Memory[] = [
  {
    id: 'gold', index: 1, title: 'İlk görüşte aşk', short: 'İlk görüşte',
    summary: 'Sıcak, altın bir ışık. Daha arkadaşken açtığım bir fotoğrafta, kalbimin sana döndüğü an burada saklı.',
    text: 'Henüz o zamanlar arkadaştık. Bir gün Snapchat’te bu fotoğrafın geldi; açtım ve öylece kalakaldım. O gülümseme, o bakış… Ekrana ne kadar baktığımı hatırlamıyorum ama içimde bir şeylerin değiştiğini çok iyi hatırlıyorum.\n\nBelki sen farkında bile değildin, ama benim için her şey o fotoğrafla başladı. Sana ilk o gün âşık oldum, canımın içi.',
    script: 'Bir fotoğraf.<br>Ve her şey değişti.', photoNote: 'İlk anınıza ait fotoğraf buraya gelecek', sample: false,
    photo: { src: 'anilar/gold.jpg', width: 1174, height: 2400, alt: 'Yağmur, pembe bluzu ve kar tanesi kolyesiyle kameraya gülümsüyor.', focus: '50% 48%', focusMobile: '50% 36%' },
  },
  {
    id: 'binary', index: 2, title: 'İkimizin ışığı', short: 'Yan yana',
    summary: 'Birbirinin etrafında dönen iki yıldız. İlk kez birlikte denize gittiğimiz o yaz günü, yan yana olmanın ışığı burada saklı.',
    text: 'İlk kez birlikte denize yüzmeye gittiğimiz gündü. Gökyüzü masmaviydi, saçlarım tuzdan darmadağın… Sen başını omzuma yasladın ve o an hiçbir yere yetişmem gerekmiyormuş gibi geldi.\n\nO gün anladım ki seninle yan yana olmak benim en huzurlu hâlim. Aynı yörüngede dönen iki yıldız gibiyiz; biri olmadan öteki hep eksik. İyi ki o gün oradaydık, birtanem.',
    script: 'Aynı yörünge.<br>İki ışık.', photoNote: 'İkinize ait fotoğraf buraya gelecek', sample: false,
    photo: { src: 'anilar/binary.jpg', width: 1200, height: 2134, alt: 'Hazret ve Yağmur masmavi gökyüzünün altında yan yana; Yağmur başını Hazret’in omzuna yaslamış, gülümsüyor.', focus: '52% 66%', focusMobile: '52% 50%' },
  },
  {
    id: 'rose', index: 3, title: 'Bir kahkaha kadar yakın', short: 'Bir kahkaha',
    summary: 'Pembe bir ışık, pespembe bir kafe. Saklamaya çalıştığın ama saklayamadığın o güzel gülüş burada.',
    text: 'Hani beni o pespembe kafeye götürmek istemiştin ya… Utandım, gelemedim. Ama bu fotoğrafı her gördüğümde “iyi ki” demeden duramıyorum.\n\nBak, yine gülüşünü saklamaya çalışıyorsun. Hiç saklama güzellik; o gülüş benim en sevdiğim şey. Bir dahakine kafe istediği kadar pembe olsun, birlikte orada olacağız.',
    script: 'Saklamaya çalıştığın<br>o gülüş.', photoNote: 'Birlikte güldüğünüz bir fotoğraf eklenecek', sample: false,
    photo: { src: 'anilar/rose.jpg', width: 1200, height: 1600, alt: 'Yağmur pembe neon ışıklı bir kafede, gülüşünü eliyle saklamaya çalışırken yana bakıyor; arkasında “All you need is love” yazan bir tabela var.', focus: '42% 72%', focusMobile: '42% 70%' },
  },
  {
    id: 'azure', index: 4, title: 'Küçük mutluluklarımız', short: 'Küçük şeyler',
    summary: 'Turkuaz bir yıldız. Pierre Loti’de soğuk bir bahar günü ve yanımda olmanın sıcaklığı burada saklı.',
    text: 'Hatırlıyor musun, Pierre Loti’ye çıktığımız o gün hava ne kadar soğuktu? Bahardı ama hiç belli etmiyordu.\n\nYine de ben o gün hiç üşümedim. Yanımdaydın ya… İçimi ısıtan hep sendin, birtanem.',
    script: 'Soğuk bir bahar günü.<br>Sıcacık bir sen.', photoNote: 'Gündelik bir anınıza ait fotoğraf eklenecek', sample: false,
    photo: { src: 'anilar/azure.jpg', width: 1600, height: 1200, alt: 'Pierre Loti tabelasının altında, güneşli ama soğuk bir bahar günü; kalın montlu Hazret gülümseyen Yağmur’u yanağından öpüyor.', focus: '48% 50%', scriptAt: 'top' },
  },
  {
    id: 'violet', index: 5, title: 'Daha nice yollar', short: 'Yeni yollar',
    summary: 'Mor ışıkların ardında, henüz gitmediğiniz yerlere ve birlikte kurduğunuz hayallere açılan bir yıldız.',
    text: 'Birlikte gerçekleştirmek istediğiniz bir hayal ya da gitmek istediğiniz bir yer için ayrılmış örnek alan. Buraya sizin kelimeleriniz gelecek.',
    script: 'Henüz<br>yazmadığımız sayfalar.', photoNote: 'Bir hayalinizi temsil eden görsel eklenecek', sample: true,
  },
  {
    id: 'dawn', index: 6, title: 'İyi ki biz', short: 'İyi ki biz',
    summary: 'Bütün bu ışıkların sonunda, Yağmur’a söylemek istediğin en kişisel birkaç cümle burada olacak.',
    text: 'Bu son anı Hazret’in Yağmur’a yazacağı kendi sözlerine ayrıldı. Gerçek metin henüz eklenmedi. Altı yıldız keşfedildiğinde takımyıldız ve mektup açılacak.',
    script: 'Aynı gökyüzü.<br>İyi ki biz.', photoNote: 'Sizin için özel bir fotoğraf buraya gelecek', sample: true,
  },
];

export const starOrder: StarId[] = memories.map((m) => m.id);

export const memoryById = (id: StarId): Memory => {
  const memory = memories.find((m) => m.id === id);
  if (!memory) throw new Error(`Bilinmeyen yıldız: ${id}`);
  return memory;
};

export const isComplete = (visited: readonly StarId[]) => starOrder.every((id) => visited.includes(id));

// Takımyıldızın bağlantı grafiği hikâye sırasından ayrıdır: experience/constellationGraph.ts.

export function nextUnvisited(current: StarId | null, visited: readonly StarId[]): StarId {
  const start = current ? starOrder.indexOf(current) : -1;
  for (let offset = 1; offset <= starOrder.length; offset++) {
    const id = starOrder[(start + offset) % starOrder.length];
    if (!visited.includes(id)) return id;
  }
  return starOrder[(start + 1) % starOrder.length];
}
