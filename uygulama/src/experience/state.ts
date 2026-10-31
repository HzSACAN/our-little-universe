import type { StarId } from '../content/memories';

export type Phase = 'intro' | 'travelling' | 'arrived' | 'overview';
export type Destination = StarId | 'home';

export interface Flight {
  id: number;
  to: Destination;
}

export interface ExperienceState {
  phase: Phase;
  /** Kameranın şu an bulunduğu yıldız; genel görünümde veya açılışta null. */
  current: StarId | null;
  flight: Flight | null;
  visited: StarId[];
  detailOpen: boolean;
  nextFlightId: number;
}

export type ExperienceAction =
  | { type: 'travel'; to: Destination }
  | { type: 'arrive'; flightId: number }
  | { type: 'openDetail' }
  | { type: 'closeDetail' };

export const initialState: ExperienceState = {
  phase: 'intro',
  current: null,
  flight: null,
  visited: [],
  detailOpen: false,
  nextFlightId: 1,
};

export function experienceReducer(state: ExperienceState, action: ExperienceAction): ExperienceState {
  switch (action.type) {
    case 'travel': {
      // Yolculuk sürerken yeni seçimler kilitli; aynı yere tekrar uçulmaz.
      if (state.flight) return state;
      if (action.to === 'home' && state.phase === 'overview') return state;
      if (action.to === 'home' && state.phase === 'intro') return state;
      if (action.to !== 'home' && action.to === state.current) return state;
      return {
        ...state,
        phase: 'travelling',
        detailOpen: false,
        flight: { id: state.nextFlightId, to: action.to },
        nextFlightId: state.nextFlightId + 1,
      };
    }
    case 'arrive': {
      // Eski veya iptal edilmiş bir uçuşun tamamlanma çağrısı durumu yazamaz.
      if (!state.flight || state.flight.id !== action.flightId) return state;
      const to = state.flight.to;
      if (to === 'home') {
        return { ...state, phase: 'overview', current: null, flight: null };
      }
      // Keşif, varışta işaretlenir; tekrar ziyaret sayacı artırmaz.
      const visited = state.visited.includes(to) ? state.visited : [...state.visited, to];
      return { ...state, phase: 'arrived', current: to, flight: null, visited };
    }
    case 'openDetail':
      if (state.phase !== 'arrived' || !state.current) return state;
      return { ...state, detailOpen: true };
    case 'closeDetail':
      return state.detailOpen ? { ...state, detailOpen: false } : state;
  }
}
