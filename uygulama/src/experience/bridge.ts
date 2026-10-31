import type { StarId } from '../content/memories';

/**
 * React ile sahne döngüsü arasındaki köprü. Her frame değişen değerler
 * React state yerine bu nesnede tutulur; HTML öğelerine doğrudan yazılır.
 */
export interface SceneBridge {
  reducedMotion: boolean;
  look: {
    /** Sürüklemeyle hedeflenen bakış sapması (radyan). */
    yaw: number;
    pitch: number;
    /** Fare paralaksı (-1…1). */
    hoverX: number;
    hoverY: number;
  };
  labels: Partial<Record<StarId, HTMLElement | null>>;
  progressBar: HTMLElement | null;
  veil: HTMLElement | null;
  /** Yolculuğun yoğunluğu (0–1); parçacıklar ve FOV için kamera tarafından yazılır. */
  travel: number;
  /** Etiketler bu yıldız için gizlenir (kamera yanında duruyorsa). */
  current: StarId | null;
  flying: boolean;
}

export const createBridge = (reducedMotion: boolean): SceneBridge => ({
  reducedMotion,
  look: { yaw: 0, pitch: 0, hoverX: 0, hoverY: 0 },
  labels: {},
  progressBar: null,
  veil: null,
  travel: 0,
  current: null,
  flying: false,
});

export const LOOK_LIMITS = { yaw: 0.32, pitch: 0.2 };
