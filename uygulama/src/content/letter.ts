import { memories } from './memories';

/** Altı yıldız keşfedilince açılan kişisel mektup. */
export const letter = {
  greeting: 'Canımın içi,',
  paragraphs: [
    'Bu küçük evrendeki her yıldız bizden bir an taşıyor. Ama hepsini bir arada tutan, bu gökyüzünün tam ortasındaki sensin.',
    'Ne zaman karamsarlığa düşsem, umudumu yitirsem, beni o karanlıktan çekip alan hep sen oldun. Zor zamanlarımda yanımda durdun, bana yeniden umut verdin. Bilir misin, ne kadar güçlü, ne kadar güzel, ne kadar düşüncelisin?',
    'Sana sahip olduğum için çok şanslıyım. Hayatımızın geri kalanında da hep birlikte olalım, hep mutlu olalım istiyorum.',
    'Ve sana bir söz: hayatım boyunca en büyük çabam senin mutluluğun için olacak.',
  ],
  signature: 'Hazret',
  /** Kişisel mektup gelince false: örnek notu gizlenir. */
  sample: false,
  note: 'Örnek mektup · Hazret’in kişisel mektubuyla değiştirilecek.',
};

/** Herhangi bir içerik hâlâ örnekse önizleme etiketi görünür kalır. */
export const hasSampleContent = letter.sample || memories.some((m) => m.sample);
