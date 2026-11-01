import type { MouseEvent } from 'react';
import type { Memory } from '../content/memories';
import type { SceneBridge } from '../experience/bridge';

interface StarTargetProps {
  memory: Memory;
  bridge: SceneBridge;
  /** Bu yıldızın anısı henüz açılmadıysa yanındaki kısa ipucu ve davet halkası görünür. */
  invite: boolean;
  coarse: boolean;
  onTap: (fromKeyboard: boolean) => void;
}

/**
 * Bulunulan yıldızın kanvastaki diskiyle aynı yere oturan erişilebilir hedef.
 * Klavye odağı, Enter/Space ve ekran okuyucu adı buradan gelir; dokunma da
 * aynı düğmeye düşer. İkili yıldızda eş yıldızın üzerinde ikinci bir dokunma
 * alanı vardır; ikisi de aynı anıyı açar.
 */
export function StarTarget({ memory, bridge, invite, coarse, onTap }: StarTargetProps) {
  const setHover = (value: boolean) => (bridge.fx.hover = value);
  return (
    <>
      <button
        type="button"
        className={`star-target star-target--${memory.id}`}
        data-visible="false"
        data-look-through=""
        ref={(el) => {
          bridge.starTarget = el;
          return () => {
            if (bridge.starTarget === el) bridge.starTarget = null;
            bridge.fx.hover = false;
          };
        }}
        aria-label={`Anıyı aç: ${memory.title}. Yıldıza dokun, anımızı keşfet.`}
        onClick={(e: MouseEvent<HTMLButtonElement>) => onTap(e.detail === 0)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <span className="star-target-ring" aria-hidden="true" />
        {memory.id === 'binary' && <span className="star-target-companion" aria-hidden="true" />}
      </button>
      <p
        className="star-hint"
        aria-hidden="true"
        data-show={String(invite)}
        data-placed="false"
        ref={(el) => {
          bridge.starHint = el;
          return () => {
            if (bridge.starHint === el) bridge.starHint = null;
          };
        }}
      >
        <span className="star-hint-mark">✧</span>
        {coarse ? (
          <span>
            Bu yıldızda bir anımız saklı. <strong>Dokun.</strong>
          </span>
        ) : (
          <span>
            Bu yıldızda bir anımız saklı. <strong>Yıldıza dokun, anımızı keşfet.</strong>
          </span>
        )}
      </p>
    </>
  );
}
