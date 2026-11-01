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

describe('yıldıza dokunma', () => {
  const arriveAt = (to: 'gold' | 'binary', from: ExperienceState = initialState) => {
    const s = run([{ type: 'travel', to }], from);
    return run([{ type: 'arrive', flightId: s.flight!.id }], s);
  };

  it('genel görünümde ya da başka bir yıldızdayken uzak yıldıza dokunmak yolculuk başlatır', () => {
    let s = run([{ type: 'touchStar', id: 'gold', arrival: 0 }]);
    expect(s.phase).toBe('travelling');
    expect(s.flight?.to).toBe('gold');
    s = run([{ type: 'arrive', flightId: s.flight!.id }], s);
    s = run([{ type: 'touchStar', id: 'binary', arrival: s.arrivalId }], s);
    expect(s.flight?.to).toBe('binary');
    expect(s.detailOpen).toBe(false);
  });

  it('varıştan sonra bulunulan yıldıza dokunmak anıyı açar (yolculuk başlatmaz)', () => {
    const s = arriveAt('gold');
    const touched = run([{ type: 'touchStar', id: 'gold', arrival: s.arrivalId }], s);
    expect(touched.detailOpen).toBe(true);
    expect(touched.flight).toBeNull();
    expect(touched.phase).toBe('arrived');
    expect(touched.opened).toEqual(['gold']);
  });

  it('yolculuğu başlatan dokunuş varışta anıyı açmaz; anı kendiliğinden açılmaz', () => {
    const started = run([{ type: 'touchStar', id: 'gold', arrival: initialState.arrivalId }]);
    const pressArrival = started.arrivalId; // dokunuşun başladığı andaki varış
    const arrived = run([{ type: 'arrive', flightId: started.flight!.id }], started);
    expect(arrived.detailOpen).toBe(false);
    expect(arrived.arrivalId).not.toBe(pressArrival);
    expect(run([{ type: 'touchStar', id: 'gold', arrival: pressArrival }], arrived)).toBe(arrived);
  });

  it('uçuş sırasında ve dialog açıkken dokunuşlar kilitli; hızlı tekrar tek dialog bırakır', () => {
    const flying = run([{ type: 'travel', to: 'gold' }]);
    expect(run([{ type: 'touchStar', id: 'binary', arrival: 0 }], flying)).toBe(flying);
    expect(run([{ type: 'touchStar', id: 'gold', arrival: 0 }], flying)).toBe(flying);
    const s = arriveAt('gold');
    const once = run([{ type: 'touchStar', id: 'gold', arrival: s.arrivalId }], s);
    const twice = run([{ type: 'touchStar', id: 'gold', arrival: s.arrivalId }, { type: 'touchStar', id: 'binary', arrival: s.arrivalId }], once);
    expect(twice).toBe(once);
  });

  it('kapatıp yeniden dokunmak anıyı yeniden açar; geri dönüşte yeni varış gerekir', () => {
    let s = arriveAt('gold');
    s = run([{ type: 'touchStar', id: 'gold', arrival: s.arrivalId }, { type: 'closeDetail' }], s);
    expect(run([{ type: 'touchStar', id: 'gold', arrival: s.arrivalId }], s).detailOpen).toBe(true);
    const goldArrival = s.arrivalId;
    s = arriveAt('binary', s);
    s = arriveAt('gold', s);
    expect(run([{ type: 'touchStar', id: 'gold', arrival: goldArrival }], s)).toBe(s);
    expect(s.opened).toEqual(['gold']);
  });
});

describe('mektup ve alternatif okuma akışı', () => {
  const order = ['violet', 'gold', 'dawn', 'rose', 'binary', 'azure'] as const;
  it('ilk beş keşifte mektubu kilitler, altıncı varışta açılabilir kılar', () => {
    let state = initialState;
    for (let i = 0; i < order.length; i++) {
      state = experienceReducer(state, { type: 'travel', to: order[i] });
      expect(experienceReducer(state, { type: 'openLetter' }).letterOpen).toBe(false);
      state = experienceReducer(state, { type: 'arrive', flightId: state.flight!.id });
      expect(state.letterOpen).toBe(false); // Kendiliğinden açılıp sahneyi kesmez.
      expect(experienceReducer(state, { type: 'openLetter' }).letterOpen).toBe(i === 5);
    }
    const opened = experienceReducer(state, { type: 'openLetter' });
    const closed = experienceReducer(opened, { type: 'closeLetter' });
    expect(closed.visited).toEqual([...order]);
    expect(closed.letterOpen).toBe(false);
  });
  it('aynı anıyı tekrar okumak kilidi kaldırmaz', () => {
    let state = initialState;
    for (let i = 0; i < 6; i++) state = experienceReducer(state, { type: 'discoverFallback', id: 'gold' });
    expect(state.visited).toEqual(['gold']);
    expect(experienceReducer(state, { type: 'openLetter' })).toBe(state);
  });
  it('WebGL kaybında ziyaretleri korur, eski uçuşu kapatır ve mektuba erişim sağlar', () => {
    let state = experienceReducer(initialState, { type: 'travel', to: 'gold' });
    const staleId = state.flight!.id;
    for (const id of order) state = experienceReducer(state, { type: 'discoverFallback', id });
    expect(state.flight).toBeNull();
    expect(experienceReducer(state, { type: 'arrive', flightId: staleId })).toBe(state);
    expect(experienceReducer(state, { type: 'openLetter' }).letterOpen).toBe(true);
  });
  it('anıdan mektuba geçerken tek dialog bırakır; yeni uçuş mektubu kapatır', () => {
    let state = { ...initialState, phase: 'arrived' as const, current: 'gold' as const, visited: [...order], detailOpen: true };
    const opened = experienceReducer(state, { type: 'openLetter' });
    expect(opened.detailOpen).toBe(false);
    expect(opened.letterOpen).toBe(true);
    expect(experienceReducer(opened, { type: 'travel', to: 'home' }).letterOpen).toBe(false);
  });
});
