import { Vector3, Vector4 } from 'three';

// Gaz bölgeleri dünya uzayında sabit. Kamera bunların önüne, içine ve arkasına
// geçer; yoğunluk uçuş yüzdesine ya da kamera hızına bağlı değildir.
export const journeyClouds = [
  { center: [-120, -70, 120], radius: [750, 420, 140] },
  { center: [80, -90, -620], radius: [800, 470, 150] },
  { center: [80, 100, -1250], radius: [950, 600, 175] },
  { center: [-30, 300, -1830], radius: [1000, 650, 150] },
  { center: [-80, 550, -2430], radius: [1150, 650, 170] },
  { center: [250, 790, -3050], radius: [1050, 650, 160] },
] as const;

export const cloudCenters = journeyClouds.map((c) => new Vector4(...c.center, c.radius[2]));
export const cloudRadii = journeyClouds.map((c) => new Vector3(...c.radius));
