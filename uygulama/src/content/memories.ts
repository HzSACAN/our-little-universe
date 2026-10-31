// Örnek içerik. Gerçek anılar, tarihler ve fotoğraflar henüz verilmedi;
// bu metinler yalnızca alanların nasıl görüneceğini göstermek içindir.

export type StarId = 'gold' | 'binary';

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
    id: 'gold',
    index: 1,
    title: 'Başladığımız yer',
    short: 'Başladığımız yer',
    summary:
      'Sıcak, altın bir ışık. Bu yıldız, hikâyenizin başladığı ana ayrıldı; o güne dair saklamak istediğin küçük bir ayrıntı burada duracak.',
    text:
      'Burada ilk karşılaşmanızı anlatan kısa bir not yer alacak: nerede olduğunuz, o an aklında kalan bir cümle ya da küçük bir ayrıntı. Şimdilik bu satırlar yalnızca yeri tutuyor.',
    script: 'Her şey<br>burada başladı.',
    photoNote: 'İlk anınıza ait fotoğraf buraya gelecek',
  },
  {
    id: 'binary',
    index: 2,
    title: 'İkimizin ışığı',
    short: 'İkimizin ışığı',
    summary:
      'Birbirinin etrafında dönen iki yıldız. Bu ışık, yan yana olduğunuzda tamamlanan bir anı için ayrıldı.',
    text:
      'Bu yıldızda birlikte güldüğünüz, yan yana durduğunuz ya da sıradan ama sizin için kıymetli bir günden kısa bir not olacak. Metin ve fotoğraf, Hazret’in kendi anısıyla değiştirilecek.',
    script: 'Aynı yörünge.<br>İki ışık.',
    photoNote: 'İkinize ait fotoğraf buraya gelecek',
  },
];

export const memoryById = (id: StarId): Memory => {
  const memory = memories.find((m) => m.id === id);
  if (!memory) throw new Error(`Bilinmeyen yıldız: ${id}`);
  return memory;
};

export const starOrder: StarId[] = memories.map((m) => m.id);
