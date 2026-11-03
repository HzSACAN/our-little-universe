import { memories } from './memories';

/** Kişisel mektup gelene kadar açıkça örnek olarak sunulur. */
export const letter = {
  greeting: 'Sevgili Yağmur,',
  paragraphs: [
    'Bu küçük evrenin her yıldızına bizden bir şey bırakmak istedim. Bir fotoğraf, bir cümle, dönüp dönüp hatırlamak istediğim bir an…',
    'Gökyüzü ne kadar büyük olursa olsun, benim en sevdiğim yer hep senin yanın.',
    'İyi ki yollarımız kesişti. İyi ki biz.',
  ],
  signature: 'Hazret',
  /** Kişisel mektup gelince false: örnek notu gizlenir. */
  sample: true,
  note: 'Örnek mektup · Hazret’in kişisel mektubuyla değiştirilecek.',
};

/** Herhangi bir içerik hâlâ örnekse önizleme etiketi görünür kalır. */
export const hasSampleContent = letter.sample || memories.some((m) => m.sample);
