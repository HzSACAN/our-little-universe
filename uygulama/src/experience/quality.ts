export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  tier: QualityTier;
  dpr: [number, number];
  farStars: number;
  midStars: number;
  dust: number;
  /** Bulutsu parçacıklarının ne kadarının çizileceği (0–1). */
  nebulaShare: number;
  nebulaOctaves: number;
  skyOctaves: number;
  bloomScale: number;
  multisampling: number;
  /** Bulutsu ara hedefinin çözünürlük oranı. */
  nebulaResolution: number;
}

const settings: Record<QualityTier, QualitySettings> = {
  high: {
    tier: 'high',
    dpr: [1, 1.75],
    farStars: 7000,
    midStars: 2600,
    dust: 900,
    nebulaShare: 1,
    nebulaOctaves: 5,
    skyOctaves: 5,
    bloomScale: 0.6,
    multisampling: 2,
    nebulaResolution: 0.6,
  },
  medium: {
    tier: 'medium',
    dpr: [1, 1.35],
    farStars: 4200,
    midStars: 1600,
    dust: 520,
    nebulaShare: 0.8,
    nebulaOctaves: 4,
    skyOctaves: 5,
    bloomScale: 0.5,
    multisampling: 0,
    nebulaResolution: 0.5,
  },
  low: {
    tier: 'low',
    dpr: [0.85, 1],
    farStars: 3000,
    midStars: 1100,
    dust: 360,
    nebulaShare: 0.62,
    nebulaOctaves: 3,
    skyOctaves: 5,
    bloomScale: 0.4,
    multisampling: 0,
    nebulaResolution: 0.34,
  },
};

export const qualitySettings = (tier: QualityTier) => settings[tier];

export function initialTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  return coarse || small ? 'medium' : 'high';
}

export const lowerTier = (tier: QualityTier): QualityTier => (tier === 'high' ? 'medium' : 'low');
