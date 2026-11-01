import { memories, type StarId } from '../content/memories';
import type { SceneBridge } from '../experience/bridge';

interface StarLabelsProps {
  bridge: SceneBridge;
  visited: StarId[];
  /** Sürükleme/çoklu dokunma ayrımı App'teki dokunuş korumasında yapılır. */
  onSelect: (id: StarId, fromKeyboard: boolean) => void;
}

/**
 * Uzaydaki yıldızların üzerine oturan geniş dokunma hedefleri. Konumları sahne
 * döngüsü tarafından projeksiyonla yazılır.
 */
export function StarLabels({ bridge, visited, onSelect }: StarLabelsProps) {
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
            onClick={(e) => onSelect(m.id, e.detail === 0)}
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
