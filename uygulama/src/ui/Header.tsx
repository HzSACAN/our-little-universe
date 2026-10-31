interface HeaderProps {
  started: boolean;
  locked: boolean;
  reducedMotion: boolean;
  onHome: () => void;
  onList: () => void;
  onToggleMotion: () => void;
}

export function Header({ started, locked, reducedMotion, onHome, onList, onToggleMotion }: HeaderProps) {
  return (
    <header className="header">
      <button
        className="brand"
        type="button"
        onClick={onHome}
        disabled={!started || locked}
        aria-label="Tüm gökyüzümüzü gör"
      >
        <svg viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <path d="m7 28 8-17 14 5 5 16-19-5-8 1" stroke="currentColor" strokeWidth=".6" />
          <g fill="currentColor">
            <circle cx="7" cy="28" r="1.8" />
            <circle cx="15" cy="11" r="2" />
            <circle cx="29" cy="16" r="1.4" />
            <circle cx="34" cy="32" r="1.6" />
            <circle cx="15" cy="27" r="1.2" />
          </g>
        </svg>
        <span>
          bizim küçük
          <br />
          <strong>evrenimiz</strong>
        </span>
      </button>
      <div className="header-tools">
        <button className="nav-link" type="button" disabled={locked} onClick={onList}>
          Anılarımız <span className="tiny-count">02</span>
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onToggleMotion}
          aria-pressed={reducedMotion}
          aria-label={reducedMotion ? 'Hareketi aç' : 'Hareketi azalt'}
          title={reducedMotion ? 'Hareketi aç' : 'Hareketi azalt'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            {reducedMotion ? (
              <path d="M5 12h14" strokeWidth="1.3" strokeLinecap="round" />
            ) : (
              <path d="M3 12c3-6 6-6 9 0s6 6 9 0" strokeWidth="1.3" strokeLinecap="round" />
            )}
          </svg>
          <span className="icon-label">{reducedMotion ? 'Hareket azaltıldı' : 'Hareket açık'}</span>
        </button>
      </div>
    </header>
  );
}
