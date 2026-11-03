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
    summary: 'Birbirinin etrafında dönen iki yıldız. Bu ışık, yan yana olduğunuzda tamamlanan bir anı için ayrıldı.',
    text: 'Bu yıldızda birlikte geçirdiğiniz, sizin için kıymetli bir günden kısa bir not olacak. Metin ve fotoğraf, Hazret’in kendi anısıyla değiştirilecek.',
    script: 'Aynı yörünge.<br>İki ışık.', photoNote: 'İkinize ait fotoğraf buraya gelecek', sample: true,
  },
  {
    id: 'rose', index: 3, title: 'Bir kahkaha kadar yakın', short: 'Bir kahkaha',
    summary: 'Pembe bir ışığın içinde, hatırladığınızda yeniden gülümsediğiniz bir an için küçük bir yer.',
    text: 'Yalnızca sizin anladığınız bir şaka, birlikte güldüğünüz bir an ya da yüzünüzde kalan bir gülümseme. Bu örnek metnin yerine size ait o hikâye gelecek.',
    script: 'Bir gülüş.<br>Kocaman bir an.', photoNote: 'Birlikte güldüğünüz bir fotoğraf eklenecek', sample: true,
  },
  {
    id: 'azure', index: 4, title: 'Küçük mutluluklarımız', short: 'Küçük şeyler',
    summary: 'Turkuaz bir yıldız. Sıradan bir günü sizin için özel yapan o küçük ayrıntılara ayrıldı.',
    text: 'Birlikte sevdiğiniz bir alışkanlık, bir şarkı veya paylaştığınız küçük bir ritüel burada anlatılabilir. Gerçek ayrıntılar henüz eklenmedi.',
    script: 'Küçük şeyler.<br>Bizden izler.', photoNote: 'Gündelik bir anınıza ait fotoğraf eklenecek', sample: true,
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
