// Bir yıldız dokunuşunun gerçekten "dokunma" olup olmadığına karar verir.
// Sürükleme, pointercancel ve çoklu dokunma anı açmaz; dokunuşun başladığı
// andaki varış kimliği saklanır ki yolculuğu başlatan basış varışta anıyı açmasın.

/** Basışın dokunma sayılması için en fazla kayma (CSS pikseli). */
export const TAP_SLOP = 10;

interface Press {
  id: number;
  x: number;
  y: number;
  arrival: number;
  spoiled: boolean;
}

export interface TapGuard {
  down(pointerId: number, x: number, y: number, arrival: number): void;
  move(pointerId: number, x: number, y: number): void;
  up(pointerId: number): void;
  cancel(pointerId: number): void;
  /**
   * Bir tıklama olayı geldiğinde çağrılır. Klavye (Enter/Space) tıklamasında
   * o anki varış kimliği, işaretçi tıklamasında basışın varış kimliği döner;
   * dokunma geçersizse null.
   */
  claim(fromKeyboard: boolean, currentArrival: number): number | null;
}

export function createTapGuard(): TapGuard {
  const active = new Set<number>();
  let press: Press | null = null;
  return {
    down(pointerId, x, y, arrival) {
      active.add(pointerId);
      if (active.size > 1) {
        // İkinci parmak: süren basış da dokunma sayılmaz.
        if (press) press.spoiled = true;
        return;
      }
      press = { id: pointerId, x, y, arrival, spoiled: false };
    },
    move(pointerId, x, y) {
      if (press && press.id === pointerId && Math.hypot(x - press.x, y - press.y) > TAP_SLOP) press.spoiled = true;
    },
    up(pointerId) {
      active.delete(pointerId);
    },
    cancel(pointerId) {
      active.delete(pointerId);
      if (press && press.id === pointerId) press.spoiled = true;
    },
    claim(fromKeyboard, currentArrival) {
      if (fromKeyboard) return currentArrival;
      const p = press;
      press = null;
      if (!p || p.spoiled) return null;
      return p.arrival;
    },
  };
}
