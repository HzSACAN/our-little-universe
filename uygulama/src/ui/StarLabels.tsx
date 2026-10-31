import { useRef } from 'react';
import { memories, type StarId } from '../content/memories';
import type { SceneBridge } from '../experience/bridge';

interface StarLabelsProps {
  bridge: SceneBridge;
  visited: StarId[];
  onSelect: (id: StarId) => void;
}

/**
 * Uzaydaki yıldızların üzerine oturan geniş dokunma hedefleri. Konumları sahne
 * döngüsü tarafından projeksiyonla yazılır.
 */
export function StarLabels({ bridge, visited, onSelect }: StarLabelsProps) {
  const press = useRef<{ x: number; y: number } | null>(null);
  return (
    <div className="star-labels" role="group" aria-label="Uzaydaki anı yıldızları">
      {memories.map((m) => {
        const seen = visited.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            className={`world-label world-label--${m.id}${seen ? ' visited' : ''}`}
            data-visible="false"
            tabIndex={-1}
            ref={(el) => {
              bridge.labels[m.id] = el;
              return () => {
                if (bridge.labels[m.id] === el) bridge.labels[m.id] = null;
              };
            }}
            aria-label={`${m.index}. yıldıza yolculuk: ${m.title}${seen ? ', keşfedildi' : ''}`}
            onPointerDown={(e) => (press.current = { x: e.clientX, y: e.clientY })}
            onClick={(e) => {
              // Etiket üzerinde başlayan sürükleme bırakılınca uçuş başlamaz.
              const p = press.current;
              press.current = null;
              if (p && e.detail > 0 && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) return;
              onSelect(m.id);
            }}
          >
            <span className="target-ring" aria-hidden="true" />
            <span className="world-name">
              <small>0{m.index}</small>
              {m.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
