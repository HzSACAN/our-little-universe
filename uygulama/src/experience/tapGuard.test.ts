import { describe, expect, it } from 'vitest';
import { createTapGuard, TAP_SLOP } from './tapGuard';

describe('yıldız dokunuşu koruması', () => {
  it('kısa bir dokunuş, basışın başladığı andaki varış kimliğini döndürür', () => {
    const g = createTapGuard();
    g.down(1, 100, 100, 3);
    g.move(1, 104, 102);
    g.up(1);
    expect(g.claim(false, 7)).toBe(3);
  });

  it('sürükleme dokunma sayılmaz', () => {
    const g = createTapGuard();
    g.down(1, 100, 100, 3);
    g.move(1, 100 + TAP_SLOP + 2, 100);
    g.up(1);
    expect(g.claim(false, 3)).toBeNull();
  });

  it('pointercancel dokunmayı iptal eder', () => {
    const g = createTapGuard();
    g.down(1, 100, 100, 3);
    g.cancel(1);
    expect(g.claim(false, 3)).toBeNull();
  });

  it('çoklu dokunma (ikinci parmak) anı açmaz', () => {
    const g = createTapGuard();
    g.down(1, 100, 100, 3);
    g.down(2, 200, 200, 3);
    g.up(2);
    g.up(1);
    expect(g.claim(false, 3)).toBeNull();
  });

  it('her basış yalnız bir kez kullanılabilir; basışsız işaretçi tıklaması geçersiz', () => {
    const g = createTapGuard();
    g.down(1, 10, 10, 2);
    g.up(1);
    expect(g.claim(false, 2)).toBe(2);
    expect(g.claim(false, 2)).toBeNull();
  });

  it('klavye etkinleştirmesi o anki varışa aittir', () => {
    const g = createTapGuard();
    expect(g.claim(true, 9)).toBe(9);
  });
});
