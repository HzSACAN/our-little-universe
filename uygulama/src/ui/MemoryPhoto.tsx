import type { CSSProperties } from 'react';
import type { Memory } from '../content/memories';

/**
 * Anının fotoğrafı; yoksa yer tutucu. Kadraj CSS değişkenleriyle verilir:
 * masaüstünde dikey sütun (--focus), telefonda yatay şerit (--focus-m).
 */
export function MemoryPhoto({ memory, className }: { memory: Memory; className: string }) {
  const photo = memory.photo;
  if (!photo) {
    return (
      <div className="photo-placeholder">
        <span aria-hidden="true">✧</span>
        Fotoğraf alanı · {memory.photoNote}
      </div>
    );
  }
  const focus = photo.focus ?? '50% 40%';
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}${photo.src}`}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      decoding="async"
      draggable={false}
      style={{ '--focus': focus, '--focus-m': photo.focusMobile ?? focus } as CSSProperties}
    />
  );
}
