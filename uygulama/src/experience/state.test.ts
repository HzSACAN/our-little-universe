import { describe, expect, it } from 'vitest';
import { experienceReducer, initialState, type ExperienceState } from './state';

const run = (actions: Parameters<typeof experienceReducer>[1][], from: ExperienceState = initialState) =>
  actions.reduce(experienceReducer, from);

describe('deneyim durumu', () => {
  it('açılıştan ilk yıldıza uçar ve keşfi varışta işaretler', () => {
    const travelling = run([{ type: 'travel', to: 'gold' }]);
    expect(travelling.phase).toBe('travelling');
    expect(travelling.visited).toEqual([]);
    const arrived = run([{ type: 'arrive', flightId: travelling.flight!.id }], travelling);
    expect(arrived.phase).toBe('arrived');
    expect(arrived.current).toBe('gold');
    expect(arrived.visited).toEqual(['gold']);
  });

  it('yolculuk sürerken yeni seçimleri kilitler', () => {
    const first = run([{ type: 'travel', to: 'gold' }]);
    const again = run([{ type: 'travel', to: 'binary' }, { type: 'travel', to: 'home' }], first);
    expect(again).toBe(first);
  });

  it('eski uçuşun tamamlanma çağrısını yok sayar', () => {
    const s = run([{ type: 'travel', to: 'gold' }]);
    const stale = run([{ type: 'arrive', flightId: s.flight!.id + 5 }], s);
    expect(stale).toBe(s);
  });

  it('tekrar ziyaret sayacı artırmaz', () => {
    let s = initialState;
    for (const to of ['gold', 'binary', 'gold', 'binary'] as const) {
      s = run([{ type: 'travel', to }], s);
      s = run([{ type: 'arrive', flightId: s.flight!.id }], s);
    }
    expect(s.visited).toEqual(['gold', 'binary']);
  });

  it('bulunulan yıldıza yeniden uçmaz; genel görünüm ziyaretleri korur', () => {
    let s = run([{ type: 'travel', to: 'gold' }]);
    s = run([{ type: 'arrive', flightId: s.flight!.id }], s);
    expect(run([{ type: 'travel', to: 'gold' }], s)).toBe(s);
    s = run([{ type: 'travel', to: 'home' }], s);
    s = run([{ type: 'arrive', flightId: s.flight!.id }], s);
    expect(s.phase).toBe('overview');
    expect(s.current).toBeNull();
    expect(s.visited).toEqual(['gold']);
  });

  it('anı ayrıntısı yalnızca varışta açılır, uçuş başlayınca kapanır', () => {
    expect(run([{ type: 'openDetail' }]).detailOpen).toBe(false);
    let s = run([{ type: 'travel', to: 'gold' }]);
    s = run([{ type: 'arrive', flightId: s.flight!.id }, { type: 'openDetail' }], s);
    expect(s.detailOpen).toBe(true);
    s = run([{ type: 'travel', to: 'binary' }], s);
    expect(s.detailOpen).toBe(false);
  });
});
