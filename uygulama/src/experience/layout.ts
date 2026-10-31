/** Ekran düzeni uygulama kabuğunda da kullanılır; Three.js indirilmesini gerektirmez. */
export type Layout = 'wide' | 'portrait';

export function layoutFor(width: number, height: number): Layout {
  return width / Math.max(height, 1) < 0.9 ? 'portrait' : 'wide';
}
