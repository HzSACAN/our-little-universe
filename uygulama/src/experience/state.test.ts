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

describe('tek dialog kuralı', () => {
  const order = ['gold', 'binary', 'rose', 'azure', 'violet', 'dawn'] as const;
  const dialogs = (s: ExperienceState) => [s.detailOpen, s.letterOpen, s.listOpen].filter(Boolean).length;
  const arrived = (visited: readonly (typeof order)[number][] = ['gold']): ExperienceState => ({
    ...initialState, phase: 'arrived', current: 'gold', visited: [...visited], arrivalId: 1, nextFlightId: 2,
  });

  it('yıldıza dokunulduktan hemen sonra açılan liste, bekleyen anı açılışının yerini alır', () => {
    const touched = run([{ type: 'touchStar', id: 'gold', arrival: 1 }], arrived());
    expect(touched.detailOpen).toBe(true);
    const list = run([{ type: 'openList' }], touched);
    expect(list.listOpen).toBe(true);
    expect(list.detailOpen).toBe(false);
    expect(dialogs(list)).toBe(1);
  });

  it('liste açıkken yıldız dokunuşu ve anı isteği yok sayılır', () => {
    const list = run([{ type: 'openList' }], arrived());
    expect(run([{ type: 'touchStar', id: 'gold', arrival: 1 }, { type: 'openDetail' }], list)).toBe(list);
    expect(run([{ type: 'closeList' }, { type: 'touchStar', id: 'gold', arrival: 1 }], list).detailOpen).toBe(true);
  });

  it('mektup, açık ya da bekleyen anıyı ve listeyi kapatır; mektup açıkken liste mektubun yerini alır', () => {
    const complete = arrived(order);
    const letter = run([{ type: 'touchStar', id: 'gold', arrival: 1 }, { type: 'openList' }, { type: 'openLetter' }], complete);
    expect([letter.letterOpen, dialogs(letter)]).toEqual([true, 1]);
    const list = run([{ type: 'openList' }], letter);
    expect([list.listOpen, dialogs(list)]).toEqual([true, 1]);
  });

  it('yolculuk her dialogu ve bekleyen anıyı kapatır; uçuşta liste açılmaz', () => {
    const flying = run([{ type: 'touchStar', id: 'gold', arrival: 1 }, { type: 'travel', to: 'home' }], arrived());
    expect([flying.phase, dialogs(flying)]).toEqual(['travelling', 0]);
    expect(run([{ type: 'openList' }], flying)).toBe(flying);
    const fromList = run([{ type: 'openList' }, { type: 'travel', to: 'binary' }], arrived());
    expect([fromList.flight?.to, dialogs(fromList)]).toEqual(['binary', 0]);
  });

  it('rastgele giriş dizilerinde hiçbir adımda birden fazla dialog açık olmaz', () => {
    const actions: Parameters<typeof experienceReducer>[1][] = [
      { type: 'touchStar', id: 'gold', arrival: 1 }, { type: 'openList' }, { type: 'closeList' }, { type: 'openLetter' },
      { type: 'closeLetter' }, { type: 'openDetail' }, { type: 'closeDetail' }, { type: 'travel', to: 'home' },
    ];
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let run = 0; run < 200; run++) {
      let s = arrived(order);
      for (let i = 0; i < 30; i++) {
        s = experienceReducer(s, actions[Math.floor(rand() * actions.length)]);
        if (s.flight) s = experienceReducer(s, { type: 'arrive', flightId: s.flight.id });
        expect(dialogs(s)).toBeLessThanOrEqual(1);
      }
    }
  });
});
