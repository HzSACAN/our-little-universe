// Gerçek anılar ve fotoğraflar henüz verilmedi. Bütün içerikler örnektir.
export type StarId = 'gold' | 'binary' | 'rose' | 'azure' | 'violet' | 'dawn';

export interface Memory {
  id: StarId;
  index: number;
  title: string;
  short: string;
  summary: string;
  text: string;
  script: string;
  photoNote: string;
}

export const memories: Memory[] = [
  {
    id: 'gold', index: 1, title: 'Başladığımız yer', short: 'İlk merhaba',
    summary: 'Sıcak, altın bir ışık. Hikâyenizin başladığı ana ait küçük bir ayrıntı bu yıldızda saklanacak.',
    text: 'Burada ilk karşılaşmanızı anlatan kısa bir not yer alacak: o gün aklında kalan bir cümle, bir bakış ya da küçük bir ayrıntı. Şimdilik bu satırlar yalnızca yeri tutuyor.',
    script: 'Her şey<br>burada başladı.', photoNote: 'İlk anınıza ait fotoğraf buraya gelecek',
  },
  {
    id: 'binary', index: 2, title: 'İkimizin ışığı', short: 'Yan yana',
    summary: 'Birbirinin etrafında dönen iki yıldız. Bu ışık, yan yana olduğunuzda tamamlanan bir anı için ayrıldı.',
    text: 'Bu yıldızda birlikte geçirdiğiniz, sizin için kıymetli bir günden kısa bir not olacak. Metin ve fotoğraf, Hazret’in kendi anısıyla değiştirilecek.',
    script: 'Aynı yörünge.<br>İki ışık.', photoNote: 'İkinize ait fotoğraf buraya gelecek',
  },
  {
    id: 'rose', index: 3, title: 'Bir kahkaha kadar yakın', short: 'Bir kahkaha',
    summary: 'Pembe bir ışığın içinde, hatırladığınızda yeniden gülümsediğiniz bir an için küçük bir yer.',
    text: 'Yalnızca sizin anladığınız bir şaka, birlikte güldüğünüz bir an ya da yüzünüzde kalan bir gülümseme. Bu örnek metnin yerine size ait o hikâye gelecek.',
    script: 'Bir gülüş.<br>Kocaman bir an.', photoNote: 'Birlikte güldüğünüz bir fotoğraf eklenecek',
  },
  {
    id: 'azure', index: 4, title: 'Küçük mutluluklarımız', short: 'Küçük şeyler',
    summary: 'Turkuaz bir yıldız. Sıradan bir günü sizin için özel yapan o küçük ayrıntılara ayrıldı.',
    text: 'Birlikte sevdiğiniz bir alışkanlık, bir şarkı veya paylaştığınız küçük bir ritüel burada anlatılabilir. Gerçek ayrıntılar henüz eklenmedi.',
    script: 'Küçük şeyler.<br>Bizden izler.', photoNote: 'Gündelik bir anınıza ait fotoğraf eklenecek',
  },
  {
    id: 'violet', index: 5, title: 'Daha nice yollar', short: 'Yeni yollar',
    summary: 'Mor ışıkların ardında, henüz gitmediğiniz yerlere ve birlikte kurduğunuz hayallere açılan bir yıldız.',
    text: 'Birlikte gerçekleştirmek istediğiniz bir hayal ya da gitmek istediğiniz bir yer için ayrılmış örnek alan. Buraya sizin kelimeleriniz gelecek.',
    script: 'Henüz<br>yazmadığımız sayfalar.', photoNote: 'Bir hayalinizi temsil eden görsel eklenecek',
  },
  {
    id: 'dawn', index: 6, title: 'İyi ki biz', short: 'İyi ki biz',
    summary: 'Bütün bu ışıkların sonunda, Yağmur’a söylemek istediğin en kişisel birkaç cümle burada olacak.',
    text: 'Bu son anı Hazret’in Yağmur’a yazacağı kendi sözlerine ayrıldı. Gerçek metin henüz eklenmedi. Altı yıldız keşfedildiğinde takımyıldız ve mektup açılacak.',
    script: 'Aynı gökyüzü.<br>İyi ki biz.', photoNote: 'Sizin için özel bir fotoğraf buraya gelecek',
  },
];

export const starOrder: StarId[] = memories.map((m) => m.id);

export const memoryById = (id: StarId): Memory => {
  const memory = memories.find((m) => m.id === id);
  if (!memory) throw new Error(`Bilinmeyen yıldız: ${id}`);
  return memory;
};

export const isComplete = (visited: readonly StarId[]) => starOrder.every((id) => visited.includes(id));

/** Bağlantılar ziyaret sırasına değil, sabit hikâye sırasına bağlıdır. */
export function discoveredEdges(visited: readonly StarId[]): [StarId, StarId][] {
  const edges: [StarId, StarId][] = [];
  for (let i = 0; i < starOrder.length - 1; i++) {
    if (visited.includes(starOrder[i]) && visited.includes(starOrder[i + 1])) edges.push([starOrder[i], starOrder[i + 1]]);
  }
  if (isComplete(visited)) edges.push([starOrder[starOrder.length - 1], starOrder[0]]);
  return edges;
}

export function nextUnvisited(current: StarId | null, visited: readonly StarId[]): StarId {
  const start = current ? starOrder.indexOf(current) : -1;
  for (let offset = 1; offset <= starOrder.length; offset++) {
    const id = starOrder[(start + offset) % starOrder.length];
    if (!visited.includes(id)) return id;
  }
  return starOrder[(start + 1) % starOrder.length];
}
