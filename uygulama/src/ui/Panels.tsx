import { forwardRef } from 'react';
import { isComplete, memories, nextUnvisited, type Memory, type StarId } from '../content/memories';

export function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="intro" aria-labelledby="intro-title">
      <div className="eyebrow">
        <span className="fine-line" aria-hidden="true" /> HAZRET’TEN YAĞMUR’A
      </div>
      <h1 id="intro-title">
        Bütün yıldızların
        <br />
        arasında, <em>sen.</em>
      </h1>
      <p className="intro-copy">
        Benim evrenim seninle değişti, Yağmur.
        <br />
        Şimdi biraz bize doğru yolculuk yapalım.
      </p>
      <button className="primary" type="button" onClick={onBegin}>
        <span>Yolculuğumuza başla</span>
        <span className="button-star" aria-hidden="true">
          ↗
        </span>
      </button>
      <p className="little-note">Her yıldızda bizden bir parça saklı.</p>
    </section>
  );
}

export function ExploreCaption() {
  return (
    <div className="explore-caption">
      <span className="eyebrow">BİZE AİT BİR GÖKYÜZÜ</span>
      <p>
        Hangi anımıza
        <br />
        <em>gitmek istersin?</em>
      </p>
    </div>
  );
}

export const FlightStatus = forwardRef<HTMLElement, { label: string }>(function FlightStatus({ label }, barRef) {
  return (
    <div className="flight-status" role="status">
      <span className="flight-symbol" aria-hidden="true">
        ✧
      </span>
      <span>{label}</span>
      <span className="flight-line" aria-hidden="true">
        <i ref={barRef} />
      </span>
    </div>
  );
});

export function CompletionPanel({ onLetter }: { onLetter: () => void }) {
  return <section className="completion-panel" aria-labelledby="completion-title">
    <div className="eyebrow">ALTI YILDIZ · BİR TAKIMYILDIZ</div>
    <h2 id="completion-title">Bütün yollar,<br/><em>sana.</em></h2>
    <p>Gökyüzümüz tamamlandı, Yağmur.<br/>Şimdi sana birkaç sözüm var.</p>
    <button className="primary" type="button" onClick={onLetter}>Sana bir mektup <span aria-hidden="true">↗</span></button>
  </section>;
}

interface ArrivalPanelProps {
  memory: Memory;
  complete: boolean;
  onLetter: () => void;
  onOpen: () => void;
}

export const ArrivalPanel = forwardRef<HTMLHeadingElement, ArrivalPanelProps>(function ArrivalPanel(
  { memory, onOpen, complete, onLetter },
  titleRef,
) {
  return (
    <section className="arrival-panel" aria-labelledby="arrival-title" aria-live="polite">
      <div className="eyebrow">YILDIZ 0{memory.index} · BİZİM EVRENİMİZ</div>
      <h2 id="arrival-title" ref={titleRef} tabIndex={-1}>
        {memory.title}
      </h2>
      <p>{memory.summary}</p>
      <div className="arrival-actions"><button className="text-button" type="button" onClick={onOpen}>
        Anıyı aç <span aria-hidden="true">↗</span>
      </button>
      {complete && <button className="text-button" type="button" onClick={onLetter}>Mektubunu aç <span aria-hidden="true">✧</span></button>}</div>
      <span className="sample-note">Örnek anı · Gerçek hikâyenizle değiştirilecek</span>
    </section>
  );
});

interface NavigationProps {
  current: StarId | null;
  visited: StarId[];
  locked: boolean;
  atHome: boolean;
  onTravel: (id: StarId) => void;
  onHome: () => void;
  onLetter: () => void;
}

export function Navigation({ current, visited, locked, atHome, onTravel, onHome, onLetter }: NavigationProps) {
  const index = current ? memories.findIndex((m) => m.id === current) : -1;
  const complete = isComplete(visited);
  const next = nextUnvisited(current, visited);
  const previous = memories[(index - 1 + memories.length) % memories.length];
  return (
    <nav className="navigation" aria-label="Anılar arasında yolculuk">
      <div className="nav-row">
        <button
          className="round-button"
          type="button"
          disabled={locked}
          onClick={() => onTravel(index < 0 ? memories[memories.length - 1].id : previous.id)}
          aria-label="Önceki yıldıza git"
        >
          ←
        </button>
        <div className="route-stops" role="group" aria-label="Yıldızlar">
          {memories.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={locked}
              className={`${visited.includes(m.id) ? 'visited' : ''}${m.id === current ? ' active' : ''}`}
              aria-current={m.id === current ? 'step' : undefined}
              aria-label={`${m.title} yıldızına git${visited.includes(m.id) ? ', keşfedildi' : ''}`}
              title={m.title}
              onClick={() => onTravel(m.id)}
            >
              0{m.index}
            </button>
          ))}
        </div>
        <button className="next-destination" type="button" disabled={locked} onClick={() => complete ? (atHome ? onLetter() : onHome()) : onTravel(next)}>
          <span>{complete ? (atHome ? 'Sana bir mektup' : 'Takımyıldızımızı gör') : 'Sıradaki yıldıza'}</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="journey-hud">
        <button type="button" onClick={onHome} disabled={locked || atHome}>
          ↖ Tüm evreni gör
        </button>
        <span role="status">
          {visited.length} / {memories.length} anı keşfedildi
        </span>
      </div>
    </nav>
  );
}

export function Footer({ hint }: { hint: string }) {
  return (
    <footer className="space-footer">
      <div className="anniversary">
        <span className="date">
          06<span>·</span>11
        </span>
        <span>
          BİZİM GÜNÜMÜZ
          <br />
          <strong>İyi ki biz.</strong>
        </span>
      </div>
      <p className="gesture-hint">{hint}</p>
      <span className="preview-label">TASARIM ÖNİZLEMESİ · ÖRNEK ANILAR</span>
    </footer>
  );
}
